'use strict';
const path = require('path');

module.exports = function (ctx) {
  const { app, query, all, one, wrap, requireAdmin, adminPath } = ctx;

  let ready = null;
  function ensure() {
    if (!ready) {
      ready = query(
        'CREATE TABLE IF NOT EXISTS reviews (' +
        'id SERIAL PRIMARY KEY, name TEXT NOT NULL, rating INTEGER NOT NULL, ' +
        'comment TEXT NOT NULL, approved INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now())'
      ).catch(function (e) { ready = null; throw e; });
    }
    return ready;
  }

  function clean(v, max) {
    return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  const recent = new Map();
  function limited(ip) {
    const now = Date.now();
    const list = (recent.get(ip) || []).filter(function (t) { return now - t < 3600000; });
    if (list.length >= 3) { recent.set(ip, list); return true; }
    list.push(now);
    recent.set(ip, list);
    if (recent.size > 5000) recent.clear();
    return false;
  }
  function clientIp(req) {
    const f = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return f || req.ip || 'unknown';
  }

  // Public: approved reviews + summary
  app.get('/api/reviews', wrap(async function (req, res) {
    await ensure();
    const rows = await all('SELECT id, name, rating, comment, created_at FROM reviews WHERE approved = 1 ORDER BY created_at DESC LIMIT 60');
    const s = await one('SELECT COUNT(*)::int AS count, COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS average FROM reviews WHERE approved = 1');
    res.json({ reviews: rows, count: s ? s.count : 0, average: s ? s.average : 0 });
  }));

  // Public: submit a review (saved as pending until you approve it)
  app.post('/api/reviews', wrap(async function (req, res) {
    const b = req.body || {};
    if (clean(b.hp, 100)) return res.json({ ok: true });
    const name = clean(b.name, 60);
    const comment = clean(b.comment, 600);
    const rating = parseInt(b.rating, 10);
    if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: 'Please choose a star rating.' });
    if (comment.length < 10) return res.status(400).json({ error: 'Please write at least a short sentence.' });
    if (limited(clientIp(req))) return res.status(429).json({ error: 'Too many reviews from your connection. Please try again later.' });
    await ensure();
    await query('INSERT INTO reviews (name, rating, comment, approved) VALUES ($1, $2, $3, 0)', [name, rating, comment]);
    res.json({ ok: true });
  }));

  // Admin: list, approve / unpublish, delete
  app.get('/api/admin/reviews', requireAdmin, wrap(async function (req, res) {
    await ensure();
    res.json(await all('SELECT id, name, rating, comment, approved, created_at FROM reviews ORDER BY approved ASC, created_at DESC LIMIT 300'));
  }));
  app.put('/api/admin/reviews/:id', requireAdmin, wrap(async function (req, res) {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
    await ensure();
    const on = req.body && Number(req.body.approved) ? 1 : 0;
    await query('UPDATE reviews SET approved = $1 WHERE id = $2', [on, req.params.id]);
    res.json({ ok: true });
  }));
  app.delete('/api/admin/reviews/:id', requireAdmin, wrap(async function (req, res) {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
    await ensure();
    await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  }));

  // Admin page: <your admin address>/reviews
  app.get(adminPath + '/reviews', function (req, res) {
    res.sendFile(path.join(__dirname, 'private', 'reviews.html'));
  });
};
