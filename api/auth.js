const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('./_db');

const SECRET = process.env.JWT_SECRET || 'dukaanbook_secret_change_this';

function verifyToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const user = verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Login karo pehle!' });
    return null;
  }
  return user;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  if (action === 'login' && req.method === 'POST') {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username aur password dalo' });
    }

    try {
      const pool = getPool();
      const [[user]] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      if (!user) return res.status(401).json({ error: 'Galat username ya password' });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Galat username ya password' });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET,
        { expiresIn: '30d' }
      );

      return res.json({ token, username: user.username, role: user.role });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(400).json({ error: 'Invalid auth route' });
};
