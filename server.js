require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Pool } = require('pg');

// ---------- Supabase Storage (product / category / offer images) ----------
const SUPABASE_URL = (() => { try { return new URL(process.env.SUPABASE_URL).origin; } catch (e) { return ''; } })();
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || 'products';
const storageReady = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
if (storageReady) console.log('✔ Supabase Storage enabled (bucket: ' + STORAGE_BUCKET + ')');
else console.warn('⚠ SUPABASE_URL / SUPABASE_SERVICE_KEY missing — image uploads will fail until they are set');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Database (Supabase Postgres) ----------
if (!process.env.DATABASE_URL) {
  console.error('✖ DATABASE_URL is not set. Add your Supabase connection string to .env (local) or Render Environment.');
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.on('error', (err) => console.error('Unexpected Postgres error:', err.message));

// Small helpers
const query = (text, params = []) => pool.query(text, params);
const all = async (text, params) => (await query(text, params)).rows;
const one = async (text, params) => (await query(text, params)).rows[0];
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  image TEXT,
  description TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  description TEXT,
  price DOUBLE PRECISION DEFAULT 0,
  stock INTEGER DEFAULT 0,
  image TEXT,
  universal INTEGER DEFAULT 0,
  car_make TEXT,
  car_model TEXT,
  fits TEXT,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DOUBLE PRECISION DEFAULT 0,
  old_price DOUBLE PRECISION DEFAULT 0,
  image TEXT,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  items TEXT NOT NULL,
  total DOUBLE PRECISION DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  "key" TEXT PRIMARY KEY,
  "value" TEXT
);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
`;

// ---------- Seed categories (icon stays in the icon column!) ----------
const seedCategories = [
  ['LED Bulbs','led-bulbs','💡','High brightness LED bulbs for headlights, fog lights and interiors.'],
  ['Halogen Bulbs','halogen-bulbs','🔆','Standard and upgraded halogen bulbs.'],
  ['Xenon/HID Bulbs','xenon-hid-bulbs','🔦','Xenon and HID conversion kits and bulbs.'],
  ['Hydrogen Bulbs','hydrogen-bulbs','⚛️','Hydrogen bulbs and advanced lighting solutions.'],
  ['Fog Lights','fog-lights','🌫️','Fog lights and fog lamp assemblies.'],
  ['Spot Lights','spot-lights','🔎','Spot lights, work lights and off-road lights.'],
  ['Headlights','headlights','🚘','Headlight assemblies and upgrades.'],
  ['Tail Lights','tail-lights','🔴','Tail lights, brake lights and rear lamps.'],
  ['Indicators','indicators','🟠','Indicator bulbs and assemblies.'],
  ['Interior Lights','interior-lights','✨','Interior ambient and dome lights.'],
  ['Boot Shocks','boot-shocks','🚙','Boot shocks and tailgate struts.'],
  ['Bonnet Shocks','bonnet-shocks','🔧','Bonnet shocks and hood struts.'],
  ['Shock Absorbers','shock-absorbers','🛞','Shock absorbers for all vehicle types.'],
  ['Struts','struts','🔩','Struts and complete assemblies.'],
  ['Coil Springs','coil-springs','🌀','Coil springs and suspension springs.'],
  ['Bushings','bushings','⭕','Suspension bushings and mounts.'],
  ['Bumper Slides','bumper-slides','🛡️','Bumper slides, brackets and protectors.'],
  ['Side Steps','side-steps','🪜','Side steps and running boards.'],
  ['Fenders','fenders','🚗','Fenders, wheel arches and panels.'],
  ['Mud Flaps','mud-flaps','💦','Mud flaps and splash guards.'],
  ['Grilles','grilles','🕸️','Front grilles and inserts.'],
  ['Spoilers','spoilers','🏎️','Spoilers and body kits.'],
  ['Roof Racks','roof-racks','🧳','Roof racks, carriers and boxes.'],
  ['Mirrors','mirrors','🪞','Side mirrors and mirror covers.'],
  ['Door Handles','door-handles','🚪','Door handles and accessories.'],
  ['Air Filters','air-filters','🌬️','Air filters and intake systems.'],
  ['Oil Filters','oil-filters','🛢️','Oil filters and filter kits.'],
  ['Fuel Filters','fuel-filters','⛽','Fuel filters and diesel filters.'],
  ['Spark Plugs','spark-plugs','⚡','Spark plugs and ignition parts.'],
  ['Belts','belts','🔗','Timing belts, fan belts and serpentine belts.'],
  ['Pumps','pumps','💧','Water pumps, fuel pumps and oil pumps.'],
  ['Radiators','radiators','🌡️','Radiators and cooling systems.'],
  ['Perfumes','perfumes','🌸','Car perfumes, diffusers and air fresheners.'],
  ['Seat Covers','seat-covers','💺','Seat covers and cushions.'],
  ['Floor Mats','floor-mats','🧹','Floor mats and boot mats.'],
  ['Steering Covers','steering-covers','🎯','Steering wheel covers.'],
  ['Phone Holders','phone-holders','📱','Phone holders and mounts.'],
  ['Sunshades','sunshades','☀️','Sunshades and window screens.'],
  ['Ambient Lights','ambient-lights','🌈','Ambient interior lighting.'],
  ['Batteries','batteries','🔋','Car batteries and accessories.'],
  ['Alternators','alternators','⚙️','Alternators and charging parts.'],
  ['Starters','starters','🔑','Starter motors.'],
  ['Dash Cams','dash-cams','📷','Dash cameras and recorders.'],
  ['Parking Sensors','parking-sensors','📡','Parking sensors and cameras.'],
  ['Audio Systems','audio-systems','🔊','Car audio, speakers and radios.'],
  ['Tires','tires','🛞','Tires for all vehicles.'],
  ['Rims','rims','⭕','Alloy and steel rims.'],
  ['Wheel Covers','wheel-covers','🛡️','Wheel covers and hubcaps.'],
  ['TPMS','tpms','📶','Tire pressure monitoring systems.'],
  ['Universal Parts','universal-parts','🌍','Universal fit parts and accessories.'],
  ['Universal Bulbs','universal-bulbs','💡','Universal bulbs for many vehicles.'],
  ['Universal Shocks','universal-shocks','🔧','Universal shocks and struts.'],
  ['Universal Fittings','universal-fittings','🔩','Universal fittings and adapters.'],
  ['Universal Perfumes','universal-perfumes','🌸','Universal car perfumes.'],
  ['Universal Mats','universal-mats','🧹','Universal floor mats.'],
  ['Universal Covers','universal-covers','🚗','Universal car covers.'],
  ['Jacks','jacks','🛠️','Jacks and lifting equipment.'],
  ['Tool Kits','tool-kits','🧰','Tool kits and sets.'],
  ['Jump Starters','jump-starters','🔌','Jump starters and power banks.'],
  ['Tire Inflators','tire-inflators','💨','Tire inflators and compressors.'],
  ['First Aid Kits','first-aid-kits','🩹','First aid kits and emergency gear.'],
  ['EV Charging Cables','ev-charging-cables','🔌','EV charging cables and adapters.'],
  ['EV Adapters','ev-adapters','🔀','EV charging adapters.'],
  ['EV Mats','ev-mats','🧹','EV-specific mats.'],
  ['EV Battery Protection','ev-battery-protection','🔋','EV battery protection accessories.']
];

async function initDatabase() {
  await query(SCHEMA);
  console.log('✔ Database connected and schema ready');

  const cat = await one('SELECT COUNT(*)::int AS c FROM categories');
  if (cat.c === 0) {
    // columns: name, slug, icon, description  (image stays NULL until admin uploads)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const r of seedCategories) {
        await client.query(
          'INSERT INTO categories (name, slug, icon, description) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', r);
      }
      await client.query('COMMIT');
      console.log('✔ Categories seeded');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Admin login comes from ADMIN_USER / ADMIN_PASS on every start (change them in Render, then redeploy)
  const u = process.env.ADMIN_USER, p = process.env.ADMIN_PASS;
  if (u && p) {
    await query('DELETE FROM admins WHERE username <> $1', [u]);
    await query(
      'INSERT INTO admins (username, password) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password',
      [u, bcrypt.hashSync(p, 12)]);
    console.log('✔ Admin synced from env:', u);
  } else {
    console.warn('⚠ No ADMIN_USER / ADMIN_PASS set — admin login unchanged.');
  }
}

// ---------- Multer: keep the file in memory, then push it to Supabase Storage ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|jpg|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Final stored image URL for a request
function imageUrlFrom(req, fallback = '') {
  if (req.file && req.file.publicUrl) return req.file.publicUrl;
  return req.body.image || fallback;
}

// Uploads req.file to Supabase Storage and sets req.file.publicUrl
async function storeImage(req, res, next) {
  try {
    if (!req.file) return next();
    if (!storageReady) throw new Error('Image storage is not configured (set SUPABASE_URL and SUPABASE_SERVICE_KEY)');
    let folder = 'misc';
    if (req.path.includes('/products')) folder = 'products';
    else if (req.path.includes('/categories')) folder = 'categories';
    else if (req.path.includes('/offers')) folder = 'offers';
    const ext = (path.extname(req.file.originalname) || '.jpg').toLowerCase();
    const objectPath = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`, {
      method: 'POST',
      headers: Object.assign(
        { apikey: SUPABASE_SERVICE_KEY, 'Content-Type': req.file.mimetype, 'x-upsert': 'true' },
        SUPABASE_SERVICE_KEY.startsWith('sb_') ? {} : { Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY }
      ),
      body: req.file.buffer
    });
    if (!r.ok) throw new Error('Image upload failed: ' + (await r.text()));
    req.file.publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
    next();
  } catch (e) { next(e); }
}

const uploadImage = [upload.single('image'), storeImage];

app.set('trust proxy', 1); // Render sits behind a proxy (correct req.ip for login lockout)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false, saveUninitialized: false,
  cookie: { maxAge: 1000*60*60*8, httpOnly: true, sameSite: 'lax' }
}));

app.use(express.static(path.join(__dirname, 'public')));

// ---------- No-cache on all API routes (fixes "new product doesn't show") ----------
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
});

const requireAdmin = (req, res, next) => {
  if (req.session && req.session.adminId) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

// ---------- Settings API ----------
app.get('/api/settings', wrap(async (req, res) => {
  const rows = await all('SELECT "key", "value" FROM settings');
  const out = {};
  rows.forEach(r => out[r.key] = r.value);
  res.json(out);
}));

app.post('/api/admin/settings', requireAdmin, wrap(async (req, res) => {
  const obj = req.body || {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const k in obj) {
      await client.query(
        'INSERT INTO settings ("key","value") VALUES ($1,$2) ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"',
        [k, String(obj[k] ?? '')]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
}));

// ---------- Public API ----------
app.get('/api/categories', wrap(async (req, res) =>
  res.json(await all('SELECT * FROM categories ORDER BY name'))));

app.get('/api/products', wrap(async (req, res) => {
  const { category, search, universal, car_make, car_model } = req.query;
  let sql = `SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  const params = [];
  const add = (v) => { params.push(v); return '$' + params.length; };

  if (category) sql += ` AND c.slug = ${add(category)}`;
  if (search) {
    const s = add(`%${search}%`);
    sql += ` AND (p.name ILIKE ${s} OR p.brand ILIKE ${s} OR p.description ILIKE ${s} OR p.sku ILIKE ${s} OR p.car_make ILIKE ${s} OR p.car_model ILIKE ${s})`;
  }
  if (universal === '1') sql += ` AND p.universal = 1`;
  if (car_make)  sql += ` AND (p.car_make  ILIKE ${add(`%${car_make}%`)} OR p.universal = 1)`;
  if (car_model) sql += ` AND (p.car_model ILIKE ${add(`%${car_model}%`)} OR p.universal = 1)`;
  sql += ` ORDER BY p.created_at DESC`;
  res.json(await all(sql, params));
}));

app.get('/api/products/:id', wrap(async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const row = await one(`SELECT p.*, c.name AS category_name, c.slug AS category_slug
                         FROM products p LEFT JOIN categories c ON p.category_id = c.id
                         WHERE p.id = $1`, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
}));

app.get('/api/offers', wrap(async (req, res) =>
  res.json(await all('SELECT * FROM offers WHERE active = 1 ORDER BY created_at DESC'))));

app.post('/api/orders', wrap(async (req, res) => {
  const { customer_name, phone, email, location, items, total } = req.body;
  if (!customer_name || !phone || !location || !items)
    return res.status(400).json({ error: 'Missing required fields' });
  const row = await one(
    `INSERT INTO orders (customer_name, phone, email, location, items, total)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [customer_name, phone, email || '', location, JSON.stringify(items), total || 0]);
  res.json({ id: row.id, message: 'Order received. Supreme Auto Parts will contact you shortly.' });
}));

// ---------- Admin auth ----------
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5, LOCK_MS = 15*60*1000;

app.post('/api/admin/login', wrap(async (req, res) => {
  const ip = req.ip, now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, until: 0 };
  if (rec.until > now) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  const { username, password } = req.body;
  const admin = await one('SELECT * FROM admins WHERE username = $1', [username]);
  if (!admin || !bcrypt.compareSync(password || '', admin.password)) {
    rec.count++;
    if (rec.count >= MAX_ATTEMPTS) { rec.until = now + LOCK_MS; rec.count = 0; }
    loginAttempts.set(ip, rec);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  loginAttempts.delete(ip);
  req.session.adminId = admin.id;
  req.session.adminName = admin.username;
  res.json({ ok: true, username: admin.username });
}));

app.post('/api/admin/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get('/api/admin/me', (req, res) => {
  if (req.session && req.session.adminId) return res.json({ loggedIn: true, username: req.session.adminName });
  res.json({ loggedIn: false });
});

app.get('/api/admin/orders', requireAdmin, wrap(async (req, res) =>
  res.json(await all('SELECT * FROM orders ORDER BY created_at DESC'))));

// ---------- Products CRUD ----------
app.post('/api/admin/products', requireAdmin, uploadImage, wrap(async (req, res) => {
  const { name, category_id, brand, description, price, stock, universal, car_make, car_model, fits, sku } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const image = imageUrlFrom(req);
  const row = await one(
    `INSERT INTO products
      (name, category_id, brand, description, price, stock, image, universal, car_make, car_model, fits, sku, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
     RETURNING id`,
    [name, category_id || null, brand || '', description || '', price || 0, stock || 0,
     image, universal === '1' ? 1 : 0, car_make || '', car_model || '', fits || '', sku || '']);
  res.json({ id: row.id, image });
}));

app.put('/api/admin/products/:id', requireAdmin, uploadImage, wrap(async (req, res) => {
  const { name, category_id, brand, description, price, stock, universal, car_make, car_model, fits, sku } = req.body;
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const ex = await one('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!ex) return res.status(404).json({ error: 'Not found' });
  const image = imageUrlFrom(req, ex.image);
  await query(
    `UPDATE products SET name=$1, category_id=$2, brand=$3, description=$4, price=$5, stock=$6,
       image=$7, universal=$8, car_make=$9, car_model=$10, fits=$11, sku=$12, updated_at=now()
     WHERE id=$13`,
    [name, category_id || null, brand || '', description || '', price || 0, stock || 0,
     image, universal === '1' ? 1 : 0, car_make || '', car_model || '', fits || '', sku || '', req.params.id]);
  res.json({ ok: true, image });
}));

app.delete('/api/admin/products/:id', requireAdmin, wrap(async (req, res) => {
  if (/^\d+$/.test(req.params.id)) await query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// ---------- Categories CRUD ----------
app.post('/api/admin/categories', requireAdmin, uploadImage, wrap(async (req, res) => {
  const { name, slug, icon, description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  const image = imageUrlFrom(req);
  try {
    const row = await one(
      'INSERT INTO categories (name, slug, icon, image, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, slug, icon || '', image, description || '']);
    res.json({ id: row.id, image });
  } catch (e) { res.status(400).json({ error: e.message }); }
}));

app.put('/api/admin/categories/:id', requireAdmin, uploadImage, wrap(async (req, res) => {
  const { name, slug, icon, description } = req.body;
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const ex = await one('SELECT * FROM categories WHERE id = $1', [req.params.id]);
  if (!ex) return res.status(404).json({ error: 'Not found' });
  const image = imageUrlFrom(req, ex.image);
  try {
    await query(
      'UPDATE categories SET name = $1, slug = $2, icon = $3, image = $4, description = $5 WHERE id = $6',
      [name, slug, icon || '', image, description || '', req.params.id]);
    res.json({ ok: true, image });
  } catch (e) { res.status(400).json({ error: e.message }); }
}));

app.delete('/api/admin/categories/:id', requireAdmin, wrap(async (req, res) => {
  if (/^\d+$/.test(req.params.id)) await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// ---------- Offers CRUD ----------
app.get('/api/admin/offers', requireAdmin, wrap(async (req, res) =>
  res.json(await all('SELECT * FROM offers ORDER BY created_at DESC'))));

app.post('/api/admin/offers', requireAdmin, uploadImage, wrap(async (req, res) => {
  const { title, description, price, old_price, active } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const image = imageUrlFrom(req);
  const row = await one(
    `INSERT INTO offers (title, description, price, old_price, image, active)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [title, description || '', price || 0, old_price || 0, image, active === '0' ? 0 : 1]);
  res.json({ id: row.id, image });
}));

app.put('/api/admin/offers/:id', requireAdmin, uploadImage, wrap(async (req, res) => {
  const { title, description, price, old_price, active } = req.body;
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const ex = await one('SELECT * FROM offers WHERE id = $1', [req.params.id]);
  if (!ex) return res.status(404).json({ error: 'Not found' });
  const image = imageUrlFrom(req, ex.image);
  await query(
    'UPDATE offers SET title=$1, description=$2, price=$3, old_price=$4, image=$5, active=$6 WHERE id=$7',
    [title, description || '', price || 0, old_price || 0, image, active === '0' ? 0 : 1, req.params.id]);
  res.json({ ok: true, image });
}));

app.delete('/api/admin/offers/:id', requireAdmin, wrap(async (req, res) => {
  if (/^\d+$/.test(req.params.id)) await query('DELETE FROM offers WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// ---------- Health check ----------
app.get('/api/_health', wrap(async (req, res) => {
  const [p, c, o] = await Promise.all([
    one('SELECT COUNT(*)::int AS c FROM products'),
    one('SELECT COUNT(*)::int AS c FROM categories'),
    one('SELECT COUNT(*)::int AS c FROM offers')
  ]);
  res.json({
    products: p.c,
    categories: c.c,
    offers: o.c,
    database: 'supabase postgres (persistent ✔)',
    storage: storageReady ? 'supabase storage (persistent ✔)' : 'NOT CONFIGURED (set SUPABASE_URL and SUPABASE_SERVICE_KEY)',
    bucket: STORAGE_BUCKET
  });
}));

// ---------- Secret admin route ----------
app.get(process.env.ADMIN_PATH || '/supreme-control-9x7k', (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// ---------- Catch-all (must stay last) ----------
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// ---------- Start ----------
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Supreme Auto Parts running at http://localhost:${PORT}`);
      console.log(`Admin panel at http://localhost:${PORT}${process.env.ADMIN_PATH || '/supreme-control-9x7k'}`);
      console.log(`Image storage: ${storageReady ? 'Supabase Storage' : 'NOT CONFIGURED'}`);
    });
  })
  .catch((err) => {
    console.error('✖ Failed to initialise database:', err.message);
    process.exit(1);
  });