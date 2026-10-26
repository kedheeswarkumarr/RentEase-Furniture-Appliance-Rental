const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'rentease.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL,
 description TEXT NOT NULL, monthly_rent REAL NOT NULL, deposit REAL NOT NULL DEFAULT 0,
 image TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS rentals (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
 product_id INTEGER NOT NULL REFERENCES products(id), months INTEGER NOT NULL,
 delivery_date TEXT NOT NULL, address TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Requested',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS support_requests (
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
 rental_id INTEGER REFERENCES rentals(id), message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'Open', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);

const count = db.prepare('SELECT COUNT(*) n FROM products').get().n;
if (!count) {
 const seed = db.prepare('INSERT INTO products (name,category,description,monthly_rent,deposit,image,stock) VALUES (?,?,?,?,?,?,?)');
 [
 ['Luna 3-Seater Sofa','Furniture','A comfortable neutral sofa for relaxed evenings and compact living rooms.',899,2500,'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85',5],
 ['Nordic Queen Bed','Furniture','A sturdy minimalist bed frame designed for restful everyday living.',1199,3500,'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85',4],
 ['Oak Study Desk','Furniture','A practical desk for study sessions, remote work and creative projects.',399,1000,'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85',8],
 ['Ergo Work Chair','Furniture','Supportive seating for focused work, with a clean modern silhouette.',299,800,'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=85',10],
 ['Frost 240L Refrigerator','Appliances','Reliable everyday cooling with room for weekly groceries.',999,3000,'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=85',3],
 ['Aqua Washing Machine','Appliances','A convenient washing solution for busy homes and shared apartments.',799,2500,'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=85',4],
 ['Vista Smart TV','Appliances','Bring your favourite shows and streaming apps into your living space.',699,2000,'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=85',6],
 ['Breeze Air Cooler','Appliances','A simple cooling companion for warm days and comfortable evenings.',499,1500,'https://images.unsplash.com/photo-1631545806609-3d8f3f4bcb4a?auto=format&fit=crop&w=900&q=85',5]
 ].forEach(p => {
   // Avoid a malformed demo image URL from breaking the page.
   if (p[5].includes('photo-150 চেয়ার')) p[5]='https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=85';
   seed.run(...p);
 });
}
const adminEmail = process.env.ADMIN_EMAIL || 'admin@rentease.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
if (!db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail)) {
 db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
   .run('RentEase Admin', adminEmail, bcrypt.hashSync(adminPassword, 10), 'admin');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
 secret: process.env.SESSION_SECRET || 'dev-only-change-this-session-secret',
 resave: false, saveUninitialized: false,
 cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000*60*60*8 }
}));
app.use(express.static(path.join(__dirname, '..', 'public')));

const safeUser = u => ({id:u.id,name:u.name,email:u.email,role:u.role});
function auth(req,res,next){ if(!req.session.user) return res.status(401).json({error:'Please sign in first.'}); next(); }
function admin(req,res,next){ if(!req.session.user || req.session.user.role!=='admin') return res.status(403).json({error:'Admin access required.'}); next(); }

app.get('/api/me',(req,res)=>res.json({user:req.session.user || null}));
app.post('/api/register',(req,res)=>{
 const name=String(req.body.name||'').trim(), email=String(req.body.email||'').trim().toLowerCase(), password=String(req.body.password||'');
 if(name.length<2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length<8) return res.status(400).json({error:'Enter your name, a valid email, and a password with at least 8 characters.'});
 try {
  const info=db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name,email,bcrypt.hashSync(password,10));
  const user=db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  req.session.user=safeUser(user); res.status(201).json({user:req.session.user});
 } catch(e){res.status(409).json({error:'An account with this email already exists.'});}
});
app.post('/api/login',(req,res)=>{
 const email=String(req.body.email||'').trim().toLowerCase(), password=String(req.body.password||'');
 const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
 if(!user || !bcrypt.compareSync(password,user.password_hash)) return res.status(401).json({error:'Incorrect email or password.'});
 req.session.regenerate(err=>{if(err)return res.status(500).json({error:'Could not start session.'});req.session.user=safeUser(user);res.json({user:req.session.user});});
});
app.post('/api/logout',(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get('/api/products',(req,res)=>{
 const {category,search}=req.query;
 let sql='SELECT * FROM products WHERE active=1', args=[];
 if(category && category!=='All'){sql+=' AND category=?';args.push(category);}
 if(search){sql+=' AND (name LIKE ? OR description LIKE ?)';args.push('%'+search+'%','%'+search+'%');}
 res.json(db.prepare(sql+' ORDER BY id DESC').all(...args));
});
app.get('/api/products/:id',(req,res)=>{
 const p=db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(Number(req.params.id));
 if(!p)return res.status(404).json({error:'Product not found.'});res.json(p);
});
app.post('/api/rentals',auth,(req,res)=>{
 const productId=Number(req.body.productId), months=Number(req.body.months), date=String(req.body.deliveryDate||''), address=String(req.body.address||'').trim();
 const p=db.prepare('SELECT * FROM products WHERE id=? AND active=1').get(productId);
 if(!p)return res.status(404).json({error:'This product is unavailable.'});
 if(![1,3,6,12].includes(months) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || address.length<8) return res.status(400).json({error:'Choose a rental duration, delivery date and complete address.'});
 if(p.stock<1)return res.status(409).json({error:'This item is currently out of stock.'});
 const result=db.prepare('INSERT INTO rentals(user_id,product_id,months,delivery_date,address) VALUES(?,?,?,?,?)').run(req.session.user.id,productId,months,date,address);
 res.status(201).json({id:result.lastInsertRowid,message:'Rental request submitted.'});
});
app.get('/api/rentals',auth,(req,res)=>{
 const sql=`SELECT r.*,p.name product_name,p.image,p.monthly_rent,p.deposit FROM rentals r JOIN products p ON p.id=r.product_id ${req.session.user.role==='admin'?'':'WHERE r.user_id=?'} ORDER BY r.id DESC`;
 res.json(req.session.user.role==='admin'?db.prepare(sql).all():db.prepare(sql).all(req.session.user.id));
});
app.post('/api/support',auth,(req,res)=>{
 const message=String(req.body.message||'').trim(), rentalId=req.body.rentalId?Number(req.body.rentalId):null;
 if(message.length<8)return res.status(400).json({error:'Please describe your issue in at least 8 characters.'});
 if(rentalId){const r=db.prepare('SELECT id,user_id FROM rentals WHERE id=?').get(rentalId);if(!r || (r.user_id!==req.session.user.id && req.session.user.role!=='admin'))return res.status(404).json({error:'Rental not found.'});}
 const info=db.prepare('INSERT INTO support_requests(user_id,rental_id,message) VALUES(?,?,?)').run(req.session.user.id,rentalId,message);
 res.status(201).json({id:info.lastInsertRowid,message:'Support request submitted.'});
});
app.get('/api/support',admin,(req,res)=>res.json(db.prepare(`SELECT s.*,u.name user_name,u.email FROM support_requests s JOIN users u ON u.id=s.user_id ORDER BY s.id DESC`).all()));
app.patch('/api/support/:id',admin,(req,res)=>{
 const status=String(req.body.status||'');
 if(!['Open','In progress','Resolved'].includes(status))return res.status(400).json({error:'Invalid support status.'});
 const result=db.prepare('UPDATE support_requests SET status=? WHERE id=?').run(status,Number(req.params.id));
 if(!result.changes)return res.status(404).json({error:'Request not found.'});res.json({ok:true});
});
app.get('/api/admin/summary',admin,(req,res)=>{
 res.json({
 users:db.prepare("SELECT COUNT(*) n FROM users WHERE role='customer'").get().n,
 products:db.prepare('SELECT COUNT(*) n FROM products WHERE active=1').get().n,
 rentals:db.prepare('SELECT COUNT(*) n FROM rentals').get().n,
 pending:db.prepare("SELECT COUNT(*) n FROM rentals WHERE status='Requested'").get().n,
 revenue:db.prepare("SELECT COALESCE(SUM(p.monthly_rent*r.months),0) n FROM rentals r JOIN products p ON p.id=r.product_id WHERE r.status!='Cancelled'").get().n
 });
});
app.get('/api/admin/products',admin,(req,res)=>res.json(db.prepare('SELECT * FROM products ORDER BY id DESC').all()));
app.post('/api/admin/products',admin,(req,res)=>{
 const p=req.body;
 const name=String(p.name||'').trim(),category=String(p.category||''),description=String(p.description||'').trim(),image=String(p.image||'').trim(),rent=Number(p.monthly_rent),deposit=Number(p.deposit||0),stock=Number(p.stock||1);
 if(name.length<2 || !['Furniture','Appliances'].includes(category) || !description || !image || !Number.isFinite(rent)||rent<=0||deposit<0||!Number.isInteger(stock)||stock<0)return res.status(400).json({error:'Please complete all product fields with valid values.'});
 const info=db.prepare('INSERT INTO products(name,category,description,monthly_rent,deposit,image,stock) VALUES(?,?,?,?,?,?,?)').run(name,category,description,rent,deposit,image,stock);
 res.status(201).json({id:info.lastInsertRowid});
});
app.patch('/api/admin/products/:id',admin,(req,res)=>{
 const p=req.body, id=Number(req.params.id);
 if(p.active!==undefined){db.prepare('UPDATE products SET active=? WHERE id=?').run(p.active?1:0,id);}
 if(p.stock!==undefined){const stock=Number(p.stock);if(!Number.isInteger(stock)||stock<0)return res.status(400).json({error:'Stock must be zero or more.'});db.prepare('UPDATE products SET stock=? WHERE id=?').run(stock,id);}
 if(p.monthly_rent!==undefined){const rent=Number(p.monthly_rent);if(!Number.isFinite(rent)||rent<=0)return res.status(400).json({error:'Rent must be positive.'});db.prepare('UPDATE products SET monthly_rent=? WHERE id=?').run(rent,id);}
 res.json({ok:true});
});
app.patch('/api/admin/rentals/:id',admin,(req,res)=>{
 const status=String(req.body.status||'');
 if(!['Requested','Confirmed','Out for delivery','Active','Return scheduled','Completed','Cancelled'].includes(status))return res.status(400).json({error:'Invalid rental status.'});
 const result=db.prepare('UPDATE rentals SET status=? WHERE id=?').run(status,Number(req.params.id));
 if(!result.changes)return res.status(404).json({error:'Rental not found.'});res.json({ok:true});
});
app.get('/api/admin/users',admin,(req,res)=>res.json(db.prepare("SELECT id,name,email,role,created_at FROM users ORDER BY id DESC").all()));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'..','public','index.html')));
app.listen(PORT,()=>console.log(`RentEase running at http://localhost:${PORT}`));