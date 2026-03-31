const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('./_db');
const { cors, SECRET } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username aur password dalo' });

  try {
    const pool = getPool();
    const [[user]] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ error: 'Galat username ya password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Galat username ya password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '30d' });
    res.json({ token, username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
