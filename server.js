require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const Database = require('better-sqlite3');

// ---------- Cloudinary (optional — falls back to local disk if not configured) ----------
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const useCloud = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (useCloud) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✔ Cloudinary storage enabled');
} else {
  console.warn('⚠ Cloudinary env vars missing — using LOCAL disk storage (images will be lost on restart)');
}

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'supreme.db');
const db = new Database((() => { const p = DB_PATH; require("fs").mkdirSync(require("path").dirname(p), { recursive: true }); return p; })());
console.log('✔ Database:', DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  image TEXT,
  description TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER,
  brand TEXT,
  description TEXT,
  price REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  image TEXT,
  universal INTEGER DEFAULT 0,
  car_make TEXT,
  car_model TEXT,
  fits TEXT,
  sku TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  price REAL DEFAULT 0,
  old_price REAL DEFAULT 0,
  image TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  items TEXT NOT NULL,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

try { db.exec('ALTER TABLE categories ADD COLUMN image TEXT'); } catch(e){}
try { db.exec('ALTER TABLE products ADD COLUMN updated_at DATETIME'); } catch(e){}

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

if (db.prepare('SELECT COUNT(*) as c FROM categories').get().c === 0) {
  // columns: name, slug, icon, description  (image stays NULL until admin uploads)
  const ins = db.prepare('INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)');
  db.transaction((rows) => { for (const r of rows) ins.run(...r); })(seedCategories);
}

if (db.prepare('SELECT COUNT(*) as c FROM admins').get().c === 0) {
  const u = process.env.ADMIN_USER, p = process.env.ADMIN_PASS;
  if (u && p) {
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run(u, bcrypt.hashSync(p, 12));
    console.log('✔ Admin seeded from .env');
  } else {
    console.warn('⚠ No ADMIN_USER / ADMIN_PASS in .env — no admin created.');
  }
}

// ---------- Multer: Cloudinary if configured, else local disk ----------
const storage = useCloud
  ? new CloudinaryStorage({
      cloudinary,
      params: (req, file) => {
        let folder = 'misc';
        if (req.path.includes('/products'))   folder = 'products';
        else if (req.path.includes('/categories')) folder = 'categories';
        else if (req.path.includes('/offers')) folder = 'offers';
        return {
          folder: `supreme-auto-parts/${folder}`,
          allowed_formats: ['jpg','jpeg','png','webp','gif']
        };
      }
    })
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname).toLowerCase())
    });

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|jpg|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Unified helper: get the final stored image URL from a request
function imageUrlFrom(req, fallback = '') {
  if (req.file) return useCloud ? req.file.path : '/uploads/' + req.file.filename;
  return req.body.image || fallback;
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false, saveUninitialized: false,
  cookie: { maxAge: 1000*60*60*8, httpOnly: true, sameSite: 'lax' }
}));

app.use(express.static(path.join(__dirname, 'public')));

// ---------- Settings API (uses the shared db connection) ----------
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  rows.forEach(r => out[r.key] = r.value);
  res.json(out);
});
app.post('/api/admin/settings', (req, res) => {
  const up = db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  const tx = db.transaction(obj => { for (const k in obj) up.run(k, String(obj[k] ?? '')); });
  try { tx(req.body || {}); res.json({ ok: true }); } catch(e){ res.status(500).json({ error: e.message }); }
});

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

// ---------- Public API ----------
app.get('/api/categories', (req, res) =>
  res.json(db.prepare('SELECT * FROM categories ORDER BY name').all()));

app.get('/api/products', (req, res) => {
  const { category, search, universal, car_make, car_model } = req.query;
  let sql = `SELECT p.*, c.name as category_name, c.slug as category_slug
             FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  const params = [];
  if (category) { sql += ` AND c.slug = ?`; params.push(category); }
  if (search) {
    sql += ` AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.car_make LIKE ? OR p.car_model LIKE ?)`;
    const s = `%${search}%`; params.push(s, s, s, s, s, s);
  }
  if (universal === '1') { sql += ` AND p.universal = 1`; }
  if (car_make)  { sql += ` AND (p.car_make  LIKE ? OR p.universal = 1)`; params.push(`%${car_make}%`); }
  if (car_model) { sql += ` AND (p.car_model LIKE ? OR p.universal = 1)`; params.push(`%${car_model}%`); }
  sql += ` ORDER BY p.created_at DESC`;
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/products/:id', (req, res) => {
  const row = db.prepare(`SELECT p.*, c.name as category_name, c.slug as category_slug
                          FROM products p LEFT JOIN categories c ON p.category_id = c.id
                          WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.get('/api/offers', (req, res) =>
  res.json(db.prepare('SELECT * FROM offers WHERE active = 1 ORDER BY created_at DESC').all()));

app.post('/api/orders', (req, res) => {
  const { customer_name, phone, email, location, items, total } = req.body;
  if (!customer_name || !phone || !location || !items)
    return res.status(400).json({ error: 'Missing required fields' });
  const info = db.prepare(`INSERT INTO orders (customer_name, phone, email, location, items, total)
                           VALUES (?, ?, ?, ?, ?, ?)`)
    .run(customer_name, phone, email || '', location, JSON.stringify(items), total || 0);
  res.json({ id: info.lastInsertRowid, message: 'Order received. Supreme Auto Parts will contact you shortly.' });
});

// ---------- Admin auth ----------
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5, LOCK_MS = 15*60*1000;

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip, now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, until: 0 };
  if (rec.until > now) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    rec.count++;
    if (rec.count >= MAX_ATTEMPTS) { rec.until = now + LOCK_MS; rec.count = 0; }
    loginAttempts.set(ip, rec);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  loginAttempts.delete(ip);
  req.session.adminId = admin.id;
  req.session.adminName = admin.username;
  res.json({ ok: true, username: admin.username });
});
app.post('/api/admin/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/api/admin/me', (req, res) => {
  if (req.session && req.session.adminId) return res.json({ loggedIn: true, username: req.session.adminName });
  res.json({ loggedIn: false });
});
app.get('/api/admin/orders', requireAdmin, (req, res) =>
  res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()));

// ---------- Products CRUD ----------
app.post('/api/admin/products', requireAdmin, upload.single('image'), (req, res) => {
  const { name, category_id, brand, description, price, stock, universal, car_make, car_model, fits, sku } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const image = imageUrlFrom(req);
  const info = db.prepare(`INSERT INTO products
    (name, category_id, brand, description, price, stock, image, universal, car_make, car_model, fits, sku, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
    .run(name, category_id || null, brand || '', description || '', price || 0, stock || 0,
         image, universal === '1' ? 1 : 0, car_make || '', car_model || '', fits || '', sku || '');
  res.json({ id: info.lastInsertRowid, image });
});

app.put('/api/admin/products/:id', requireAdmin, upload.single('image'), (req, res) => {
  const { name, category_id, brand, description, price, stock, universal, car_make, car_model, fits, sku } = req.body;
  const ex = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Not found' });
  const image = imageUrlFrom(req, ex.image);
  db.prepare(`UPDATE products SET name=?, category_id=?, brand=?, description=?, price=?, stock=?,
              image=?, universal=?, car_make=?, car_model=?, fits=?, sku=?, updated_at=CURRENT_TIMESTAMP
              WHERE id=?`)
    .run(name, category_id || null, brand || '', description || '', price || 0, stock || 0,
         image, universal === '1' ? 1 : 0, car_make || '', car_model || '', fits || '', sku || '', req.params.id);
  res.json({ ok: true, image });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Categories CRUD (fixed the duplicate "image = ?" bug) ----------
app.post('/api/admin/categories', requireAdmin, upload.single('image'), (req, res) => {
  const { name, slug, icon, description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  const image = imageUrlFrom(req);
  try {
    const info = db.prepare('INSERT INTO categories (name, slug, icon, image, description) VALUES (?, ?, ?, ?, ?)')
      .run(name, slug, icon || '', image, description || '');
    res.json({ id: info.lastInsertRowid, image });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/admin/categories/:id', requireAdmin, upload.single('image'), (req, res) => {
  const { name, slug, icon, description } = req.body;
  const ex = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Not found' });
  const image = imageUrlFrom(req, ex.image);
  db.prepare('UPDATE categories SET name = ?, slug = ?, icon = ?, image = ?, description = ? WHERE id = ?')
    .run(name, slug, icon || '', image, description || '', req.params.id);
  res.json({ ok: true, image });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Offers CRUD ----------
app.get('/api/admin/offers', requireAdmin, (req, res) =>
  res.json(db.prepare('SELECT * FROM offers ORDER BY created_at DESC').all()));

app.post('/api/admin/offers', requireAdmin, upload.single('image'), (req, res) => {
  const { title, description, price, old_price, active } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const image = imageUrlFrom(req);
  const info = db.prepare(`INSERT INTO offers (title, description, price, old_price, image, active)
                           VALUES (?, ?, ?, ?, ?, ?)`)
    .run(title, description || '', price || 0, old_price || 0, image, active === '0' ? 0 : 1);
  res.json({ id: info.lastInsertRowid, image });
});

app.put('/api/admin/offers/:id', requireAdmin, upload.single('image'), (req, res) => {
  const { title, description, price, old_price, active } = req.body;
  const ex = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Not found' });
  const image = imageUrlFrom(req, ex.image);
  db.prepare(`UPDATE offers SET title=?, description=?, price=?, old_price=?, image=?, active=? WHERE id=?`)
    .run(title, description || '', price || 0, old_price || 0, image, active === '0' ? 0 : 1, req.params.id);
  res.json({ ok: true, image });
});

app.delete('/api/admin/offers/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM offers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Health check ----------
app.get('/api/_health', (req, res) => {
  res.json({
    products:   db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    categories: db.prepare('SELECT COUNT(*) as c FROM categories').get().c,
    offers:     db.prepare('SELECT COUNT(*) as c FROM offers').get().c,
    storage: useCloud ? 'cloudinary (persistent ✔)' : 'local-disk (EPHEMERAL — set Cloudinary env!)',
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || null
  });
});

// ---------- Secret admin route ----------
app.get(process.env.ADMIN_PATH || '/supreme-control-9x7k', (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/api/_health', (req, res) => {
  res.json({
    products:   db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    categories: db.prepare('SELECT COUNT(*) as c FROM categories').get().c,
    offers:     db.prepare('SELECT COUNT(*) as c FROM offers').get().c,
    storage:    typeof useCloud !== 'undefined' && useCloud ? 'cloudinary (persistent ✔)' : 'local-disk (EPHEMERAL)',
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || null,
    db_path:    typeof DB_PATH !== 'undefined' ? DB_PATH : 'unknown'
  });
});

app.get(process.env.ADMIN_PATH || '/supreme-control-9x7k', (req, res) => {
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`Supreme Auto Parts running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}${process.env.ADMIN_PATH || '/supreme-control-9x7k'}`);
  console.log(`Image storage: ${useCloud ? 'Cloudinary' : 'LOCAL DISK (not persistent!)'}`);
});
const DB_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });