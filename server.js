import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { put } from '@vercel/blob';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let dbInitPromise;

async function initializeDatabase() {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL غير مضبوط في Vercel Environment Variables');
    }
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);

    // Seed the first-run store with useful demo content. Existing data is preserved.
    const categoryCount = Number((await pool.query('SELECT COUNT(*)::int AS count FROM categories')).rows[0].count);
    if (categoryCount === 0) {
      await pool.query(`
        INSERT INTO categories(name_ar,name_en,icon,sort_order) VALUES
        ('الفواكه','Fruits','🍎',1),
        ('الخضروات','Vegetables','🥬',2),
        ('العروض','Offers','🔥',3),
        ('المشروبات','Drinks','🥤',4)
      `);
    }

    const productCount = Number((await pool.query('SELECT COUNT(*)::int AS count FROM products')).rows[0].count);
    if (productCount === 0) {
      const cats = Object.fromEntries((await pool.query('SELECT id,name_ar FROM categories')).rows.map(r => [r.name_ar, r.id]));
      await pool.query(`
        INSERT INTO products(category_id,name_ar,description_ar,price,old_price,unit,stock,featured,active) VALUES
        ($1,'تفاح أحمر','تفاح طازج مختار يومياً',2500,3000,'كغم',100,true,true),
        ($2,'برتقال طازج','برتقال عصيري بطعم غني',2000,2500,'كغم',100,true,true),
        ($3,'طماطم','طماطم طازجة للسلطة والطبخ',1500,NULL,'كغم',100,false,true),
        ($4,'علبة فلفل بارد 3 ألوان','ثلاث حبات بألوان مختلفة: أحمر وأصفر وبرتقالي',3500,4000,'علبة',50,true,true),
        ($5,'عصير برتقال','عصير برتقال طازج',2500,NULL,'عبوة',50,false,true)
      `, [cats['الفواكه'], cats['الفواكه'], cats['الخضروات'], cats['الخضروات'], cats['المشروبات']]);
    }

    const bannerCount = Number((await pool.query('SELECT COUNT(*)::int AS count FROM banners')).rows[0].count);
    if (bannerCount === 0) {
      await pool.query(`INSERT INTO banners(title_ar,subtitle_ar,sort_order,active) VALUES
        ('طازج كل يوم 🍎','فاكهة وخضروات مختارة بعناية وتوصيل إلى بابك',1,true),
        ('علبة الفلفل 3 ألوان 🌶️','ألوان أكثر على مائدتك بسعر مميز',2,true)`);
    }

    await seedAdmin();
    return true;
  })().catch(err => {
    dbInitPromise = null;
    throw err;
  });
  return dbInitPromise;
}


app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || `http://localhost:${PORT}`,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Vercel routes /api/* through api/index.js. Keep the Express app tolerant of
// both the normal /api/... path and a rewritten function path.
app.use((req, _res, next) => {
  if (process.env.VERCEL && req.url.startsWith('/api/index.js')) {
    const suffix = req.url.slice('/api/index.js'.length) || '/';
    req.url = suffix === '/' ? '/' : suffix;
  }
  next();
});

app.get('/health', async (_, res) => {
  try { await initializeDatabase(); res.json({ ok: true, database: 'connected' }); }
  catch (e) { res.status(503).json({ ok: false, error: e.message }); }
});

app.get('/api/health', async (_, res) => {
  try { await initializeDatabase(); res.json({ ok: true, database: 'connected' }); }
  catch (e) { res.status(503).json({ ok: false, error: e.message }); }
});

app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();
  try { await initializeDatabase(); next(); }
  catch (e) { console.error('Database initialization failed:', e); res.status(503).json({ error: 'قاعدة البيانات غير جاهزة. تحقق من DATABASE_URL في Vercel.', details: e.message }); }
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });
app.use('/api/auth', authLimiter);

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, /^image\/(jpeg|png|webp|avif)$/.test(file.mimetype))
});

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}
function requireAuth(req, res, next) {
  try {
    const token = req.cookies.token || (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!token) return res.status(401).json({ error: 'غير مسجل الدخول' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'جلسة الدخول غير صالحة' });
  }
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة' });
  next();
}
function cleanUser(u) { return { id: u.id, name: u.name, phone: u.phone, role: u.role }; }

async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  // ADMIN_EMAIL is used as the admin phone/login identifier.
  const exists = await pool.query('SELECT id FROM users WHERE phone=$1', [process.env.ADMIN_EMAIL]);
  if (!exists.rowCount) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await pool.query(
      "INSERT INTO users(name,phone,password_hash,role) VALUES($1,$2,$3,'admin')",
      ['مدير المتجر', process.env.ADMIN_EMAIL, hash]
    );
    console.log('Admin account created:', process.env.ADMIN_EMAIL);
  }
}

// Auth
app.post('/api/auth/register', async (req,res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password || password.length < 6)
      return res.status(400).json({ error: 'الاسم والهاتف وكلمة مرور من 6 أحرف مطلوبة' });
    const hash = await bcrypt.hash(password, 12);
    const r = await pool.query(
      'INSERT INTO users(name,phone,password_hash) VALUES($1,$2,$3) RETURNING id,name,phone,role',
      [name.trim(), phone.trim(), hash]
    );
    const token = sign(r.rows[0]);
    res.cookie('token', token, { httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV==='production', maxAge:7*86400000 });
    res.json({ user: cleanUser(r.rows[0]), token });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'رقم الهاتف مستخدم مسبقاً' });
    console.error(e); res.status(500).json({ error: 'خطأ في التسجيل' });
  }
});
app.post('/api/auth/login', async (req,res) => {
  try {
    const { phone, password } = req.body;
    const r = await pool.query('SELECT * FROM users WHERE phone=$1', [phone?.trim()]);
    const u = r.rows[0];
    if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    const token = sign(u);
    res.cookie('token', token, { httpOnly:true, sameSite:'lax', secure:process.env.NODE_ENV==='production', maxAge:7*86400000 });
    res.json({ user: cleanUser(u), token });
  } catch (e) { console.error(e); res.status(500).json({ error: 'خطأ في الدخول' }); }
});
app.post('/api/auth/logout', (_,res) => {
  res.clearCookie('token');
  res.json({ ok:true });
});
app.get('/api/auth/me', requireAuth, async (req,res) => {
  const r = await pool.query('SELECT id,name,phone,role FROM users WHERE id=$1',[req.user.id]);
  res.json({ user: cleanUser(r.rows[0]) });
});

// Store public data
app.get('/api/store', async (_,res) => {
  const [cats, products, banners, settings] = await Promise.all([
    pool.query('SELECT * FROM categories WHERE active=true ORDER BY sort_order,id'),
    pool.query(`SELECT p.*, c.name_ar category_name_ar FROM products p
                LEFT JOIN categories c ON c.id=p.category_id
                WHERE p.active=true ORDER BY p.featured DESC,p.id DESC`),
    pool.query('SELECT * FROM banners WHERE active=true ORDER BY sort_order,id'),
    pool.query('SELECT key,value FROM settings')
  ]);
  const s = Object.fromEntries(settings.rows.map(x => [x.key,x.value]));
  res.json({ categories:cats.rows, products:products.rows, banners:banners.rows, settings:s });
});

// Admin CRUD
app.post('/api/admin/upload', requireAuth, requireAdmin, upload.single('image'), async (req,res) => {
  try {
    if (!req.file) return res.status(400).json({ error:'الصورة مطلوبة' });
    if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error:'لم يتم إعداد Vercel Blob' });
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const blob = await put(`products/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`, req.file.buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: req.file.mimetype
    });
    res.json({ url: blob.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error:'تعذر رفع الصورة' });
  }
});

app.get('/api/admin/products', requireAuth, requireAdmin, async (_,res) => {
  const r = await pool.query(`SELECT p.*, c.name_ar category_name_ar
                              FROM products p LEFT JOIN categories c ON c.id=p.category_id
                              ORDER BY p.id DESC`);
  res.json(r.rows);
});
app.post('/api/admin/products', requireAuth, requireAdmin, async (req,res) => {
  const { category_id,name_ar,name_en,description_ar,description_en,price,old_price,image_url,unit,stock,featured,active }=req.body;
  const r=await pool.query(
   `INSERT INTO products(category_id,name_ar,name_en,description_ar,description_en,price,old_price,image_url,unit,stock,featured,active)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
   [category_id||null,name_ar,name_en||'',description_ar||'',description_en||'',price,old_price||null,image_url||null,unit||'قطعة',
    Number(stock||0),!!featured,active!==false]);
  res.json(r.rows[0]);
});
app.put('/api/admin/products/:id', requireAuth, requireAdmin, async (req,res) => {
  const { category_id,name_ar,name_en,description_ar,description_en,price,old_price,image_url,unit,stock,featured,active }=req.body;
  const r=await pool.query(
   `UPDATE products SET category_id=$1,name_ar=$2,name_en=$3,description_ar=$4,description_en=$5,price=$6,old_price=$7,
    image_url=$8,unit=$9,stock=$10,featured=$11,active=$12,updated_at=NOW() WHERE id=$13 RETURNING *`,
   [category_id||null,name_ar,name_en||'',description_ar||'',description_en||'',price,old_price||null,image_url||null,unit||'قطعة',
    Number(stock||0),!!featured,active!==false,req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req,res)=>{
  await pool.query('DELETE FROM products WHERE id=$1',[req.params.id]); res.json({ok:true});
});

app.get('/api/admin/categories', requireAuth, requireAdmin, async (_,res)=>{
  const r=await pool.query('SELECT * FROM categories ORDER BY sort_order,id'); res.json(r.rows);
});
app.post('/api/admin/categories', requireAuth, requireAdmin, async (req,res)=>{
  const {name_ar,name_en,icon,sort_order}=req.body;
  const r=await pool.query('INSERT INTO categories(name_ar,name_en,icon,sort_order) VALUES($1,$2,$3,$4) RETURNING *',
   [name_ar,name_en||'',icon||'🍎',Number(sort_order||0)]);
  res.json(r.rows[0]);
});
app.put('/api/admin/categories/:id', requireAuth, requireAdmin, async (req,res)=>{
  const {name_ar,name_en,icon,sort_order,active}=req.body;
  const r=await pool.query('UPDATE categories SET name_ar=$1,name_en=$2,icon=$3,sort_order=$4,active=$5 WHERE id=$6 RETURNING *',
   [name_ar,name_en||'',icon||'🍎',Number(sort_order||0),active!==false,req.params.id]);
  res.json(r.rows[0]);
});
app.delete('/api/admin/categories/:id', requireAuth, requireAdmin, async (req,res)=>{
  await pool.query('DELETE FROM categories WHERE id=$1',[req.params.id]); res.json({ok:true});
});

app.get('/api/admin/banners', requireAuth, requireAdmin, async (_,res)=>{
  const r=await pool.query('SELECT * FROM banners ORDER BY sort_order,id'); res.json(r.rows);
});
app.post('/api/admin/banners', requireAuth, requireAdmin, async (req,res)=>{
  const {title_ar,subtitle_ar,image_url,link_category_id,sort_order}=req.body;
  const r=await pool.query(
    'INSERT INTO banners(title_ar,subtitle_ar,image_url,link_category_id,sort_order) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [title_ar||'',subtitle_ar||'',image_url||null,link_category_id||null,Number(sort_order||0)]);
  res.json(r.rows[0]);
});
app.delete('/api/admin/banners/:id', requireAuth, requireAdmin, async (req,res)=>{
  await pool.query('DELETE FROM banners WHERE id=$1',[req.params.id]); res.json({ok:true});
});

app.get('/api/admin/orders', requireAuth, requireAdmin, async (_,res)=>{
  const r=await pool.query('SELECT * FROM orders ORDER BY id DESC'); res.json(r.rows);
});
app.put('/api/admin/orders/:id/status', requireAuth, requireAdmin, async (req,res)=>{
  const allowed=['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];
  if(!allowed.includes(req.body.status)) return res.status(400).json({error:'حالة غير صحيحة'});
  const r=await pool.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',[req.body.status,req.params.id]);
  res.json(r.rows[0]);
});

app.get('/api/admin/settings', requireAuth, requireAdmin, async (_,res)=>{
  const r=await pool.query('SELECT key,value FROM settings ORDER BY key'); res.json(Object.fromEntries(r.rows.map(x=>[x.key,x.value])));
});
app.put('/api/admin/settings', requireAuth, requireAdmin, async (req,res)=>{
  const entries=Object.entries(req.body||{});
  for(const [key,value] of entries) await pool.query(
    'INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',[key,String(value)]);
  res.json({ok:true});
});

// Orders
app.post('/api/orders', async (req,res)=>{
  const { customer_name,customer_phone,address_text,lat,lng,payment_method,notes,items }=req.body;
  if(!customer_name || !customer_phone || !address_text || !Array.isArray(items) || !items.length)
    return res.status(400).json({error:'أكمل بيانات الطلب وأضف منتجات'});
  const ids=items.map(x=>Number(x.product_id)).filter(Boolean);
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const products=(await client.query(
      `SELECT id,name_ar,price,stock,active FROM products WHERE id=ANY($1::bigint[]) FOR UPDATE`,[ids])).rows;
    let subtotal=0; const normalized=[];
    for(const item of items){
      const p=products.find(x=>Number(x.id)===Number(item.product_id));
      const q=Math.max(1,Math.floor(Number(item.quantity)||1));
      if(!p || !p.active) throw new Error('منتج غير متاح');
      if(p.stock<q) throw new Error(`المخزون غير كافٍ: ${p.name_ar}`);
      const line=Number(p.price)*q; subtotal+=line;
      normalized.push({p,q,line});
    }
    const s=Object.fromEntries((await client.query('SELECT key,value FROM settings')).rows.map(x=>[x.key,x.value]));
    const min=Number(s.minimum_order||0), fee=subtotal>=min?Number(s.delivery_fee||0):Number(s.delivery_fee||0);
    if(subtotal<min) throw new Error(`الحد الأدنى للطلب ${min.toLocaleString()} ${s.currency||'د.ع'}`);
    const total=subtotal+fee;
    const userId=req.user?.id || null;
    const order=(await client.query(
      `INSERT INTO orders(user_id,customer_name,customer_phone,address_text,lat,lng,payment_method,subtotal,delivery_fee,total,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [userId,customer_name,customer_phone,address_text,lat||null,lng||null,payment_method||'cash',subtotal,fee,total,notes||''])).rows[0];
    for(const x of normalized){
      await client.query(
       'INSERT INTO order_items(order_id,product_id,product_name,price,quantity,line_total) VALUES($1,$2,$3,$4,$5,$6)',
       [order.id,x.p.id,x.p.name_ar,x.p.price,x.q,x.line]);
      await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2',[x.q,x.p.id]);
    }
    await client.query('COMMIT');
    res.status(201).json({order});
  }catch(e){ await client.query('ROLLBACK'); res.status(400).json({error:e.message||'تعذر إنشاء الطلب'}); }
  finally{client.release();}
});

app.get('/api/orders/mine', requireAuth, async (req,res)=>{
  const r=await pool.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY id DESC',[req.user.id]);
  res.json(r.rows);
});

app.get('*', (req,res)=>{
  if (req.path.startsWith('/api/')) return res.status(404).json({error:'المسار غير موجود'});
  res.sendFile(path.join(__dirname,'public','index.html'));
});

if (!process.env.VERCEL) {
  async function start(){
    await initializeDatabase();
    app.listen(PORT,()=>console.log(`سلة الفاكهة تعمل على http://localhost:${PORT}`));
  }
  start().catch(e=>{console.error('Startup failed:',e);process.exit(1);});
}

export default app;
