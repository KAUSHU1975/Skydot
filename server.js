/**
 * Skydot backend — starter server (Node.js + Express)
 * -----------------------------------------------------
 * This is a REAL, runnable backend skeleton. The index.html demo
 * simulates everything in the browser so you can preview the product
 * instantly; this file is what you deploy to make it actually work
 * for real users, with a real database, a real AI model, and a real
 * ₹99/month payment.
 *
 * Setup:
 *   npm init -y
 *   npm install express bcryptjs jsonwebtoken multer dotenv cors
 *   node server.js
 *
 * You still need to fill in:
 *   - A real database (this uses a local JSON file as a placeholder)
 *   - An AI provider key (OpenAI / Anthropic / etc.) for real replies
 *   - Razorpay (or Stripe) keys for the ₹99/month subscription
 *   - HTTPS + a real domain when you deploy (Render, Railway, VPS, etc.)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serves index.html

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const DB_FILE = path.join(__dirname, 'db.json');
const upload = multer({ dest: path.join(__dirname, 'uploads') });

const FREE_UPLOAD_LIMIT = 5;
const FREE_VOICE_LIMIT = 3;
const PRO_PRICE_INR = 99; // per month

/* ---------- tiny JSON "database" (swap for Postgres/Mongo in production) ---------- */
function readDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }));
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ---------- auth middleware ---------- */
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not logged in.' });
  try {
    req.userEmail = jwt.verify(token, JWT_SECRET).email;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again.' });
  }
}

/* ---------- signup / login ---------- */
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  const db = readDB();
  if (db.users[email]) return res.status(400).json({ error: 'Account already exists.' });
  db.users[email] = {
    email,
    passwordHash: await bcrypt.hash(password, 10),
    name: null,
    welcomed: false,
    plan: 'free',
    uploadsUsed: 0,
    voiceUsed: 0,
  };
  writeDB(db);
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users[email];
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

/* ---------- first-time welcome: save the user's name ---------- */
app.post('/api/set-name', auth, (req, res) => {
  const { name } = req.body;
  const db = readDB();
  db.users[req.userEmail].name = name;
  db.users[req.userEmail].welcomed = true;
  writeDB(db);
  res.json({ ok: true, name });
});

/* ---------- profile / usage ---------- */
app.get('/api/me', auth, (req, res) => {
  const db = readDB();
  const u = db.users[req.userEmail];
  res.json({
    email: u.email, name: u.name, plan: u.plan,
    uploadsUsed: u.uploadsUsed, voiceUsed: u.voiceUsed,
    limits: { uploads: FREE_UPLOAD_LIMIT, voice: FREE_VOICE_LIMIT },
  });
});

/* ---------- chat (plug your AI provider in here) ---------- */
app.post('/api/chat', auth, async (req, res) => {
  const { message } = req.body;

  // TODO: replace this stub with a real call, e.g. the Anthropic API:
  //
  // const r = await fetch('https://api.anthropic.com/v1/messages', {
  //   method: 'POST',
  //   headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
  //   body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: message }] }),
  // });
  // const data = await r.json();
  // return res.json({ reply: data.content[0].text });

  res.json({ reply: `(demo reply) You said: "${message}". Connect a real AI provider in server.js to make this live.` });
});

/* ---------- file upload (enforces the free-plan limit) ---------- */
app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  const db = readDB();
  const u = db.users[req.userEmail];
  if (u.plan !== 'pro' && u.uploadsUsed >= FREE_UPLOAD_LIMIT) {
    return res.status(403).json({ error: 'Free plan upload limit reached. Upgrade to Skydot Pro for unlimited uploads.' });
  }
  u.uploadsUsed += 1;
  writeDB(db);
  res.json({ ok: true, filename: req.file.originalname, uploadsUsed: u.uploadsUsed });
});

/* ---------- voice command usage (enforces the free-plan limit) ---------- */
app.post('/api/voice-command', auth, (req, res) => {
  const db = readDB();
  const u = db.users[req.userEmail];
  if (u.plan !== 'pro' && u.voiceUsed >= FREE_VOICE_LIMIT) {
    return res.status(403).json({ error: 'Free plan voice-command limit reached. Upgrade to Skydot Pro for unlimited voice commands.' });
  }
  u.voiceUsed += 1;
  writeDB(db);
  // Actual speech-to-text should happen client-side (Web Speech API) or
  // via a server-side service (e.g. a cloud speech-to-text API) before
  // this endpoint is called with the transcribed text.
  res.json({ ok: true, voiceUsed: u.voiceUsed });
});

/* ---------- upgrade to Pro — ₹99/month (plug Razorpay/Stripe in here) ---------- */
app.post('/api/create-subscription', auth, async (req, res) => {
  // TODO: create a real order with Razorpay, e.g.:
  //
  // const Razorpay = require('razorpay');
  // const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  // const order = await instance.orders.create({ amount: PRO_PRICE_INR * 100, currency: 'INR', receipt: req.userEmail });
  // res.json({ order }); // then confirm the client-side Razorpay checkout, and verify the payment signature on a webhook before marking the user 'pro'

  res.json({ message: `Stub: create a ₹${PRO_PRICE_INR}/month Razorpay order here, then confirm payment before calling /api/confirm-subscription.` });
});

app.post('/api/confirm-subscription', auth, (req, res) => {
  // Call this ONLY after verifying a real, signed payment confirmation
  // from your payment gateway's webhook — never trust the client alone.
  const db = readDB();
  db.users[req.userEmail].plan = 'pro';
  writeDB(db);
  res.json({ ok: true, plan: 'pro' });
});

app.post('/api/downgrade', auth, (req, res) => {
  const db = readDB();
  db.users[req.userEmail].plan = 'free';
  writeDB(db);
  res.json({ ok: true, plan: 'free' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Skydot server running on http://localhost:${PORT}`));
