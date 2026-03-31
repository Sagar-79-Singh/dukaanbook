// ONE-TIME SETUP ENDPOINT
// Visit: https://yourapp.vercel.app/api/setup?key=dukaanbook_setup_2024
// Ye users create kar dega with proper bcrypt hashes
// IMPORTANT: Iske baad is file ko DELETE kar do ya rename karo!

const bcrypt = require('bcryptjs');
const { getPool } = require('./_db');
const { cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Security key check
  if (req.query.key !== 'dukaanbook_setup_2024') {
    return res.status(403).json({ error: 'Invalid setup key' });
  }

  try {
    const pool = getPool();

    // Create tables if not exist (run schema.sql first ideally)
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','user') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    const adminHash = await bcrypt.hash('admin123', 10);
    const dadHash   = await bcrypt.hash('dad123', 10);

    await pool.query(`INSERT INTO users (username, password_hash, role) VALUES (?,?,?) ON DUPLICATE KEY UPDATE password_hash=?`,
      ['admin', adminHash, 'admin', adminHash]);
    await pool.query(`INSERT INTO users (username, password_hash, role) VALUES (?,?,?) ON DUPLICATE KEY UPDATE password_hash=?`,
      ['dad', dadHash, 'user', dadHash]);

    res.json({
      success: true,
      message: 'Users created! DELETE api/setup.js now!',
      users: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'dad',   password: 'dad123',   role: 'user'  }
      ]
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
