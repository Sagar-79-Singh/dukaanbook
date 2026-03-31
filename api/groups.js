const { getPool } = require('./_db');
const { requireAuth, cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;
  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query('SELECT * FROM groups_master ORDER BY name');
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const { name } = req.body;
      const [r] = await pool.query('INSERT INTO groups_master (name) VALUES (?)', [name]);
      return res.json({ id: r.insertId, name });
    }
    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM groups_master WHERE id=?', [req.query.id]);
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
};
