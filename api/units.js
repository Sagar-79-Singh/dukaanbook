const { getPool } = require('./_db');
const { requireAuth, cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;
  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query('SELECT * FROM units ORDER BY name');
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const { name, base_unit_id, conversion_qty } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const [r] = await pool.query(
        'INSERT INTO units (name, base_unit_id, conversion_qty) VALUES (?,?,?)',
        [name, base_unit_id || null, conversion_qty || null]
      );
      return res.json({ id: r.insertId, name });
    }
    if (req.method === 'DELETE') {
      const id = req.query.id;
      await pool.query('DELETE FROM units WHERE id=?', [id]);
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
};
