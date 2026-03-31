const { getPool } = require('./_db');
const { requireAuth, cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;
  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query('SELECT * FROM customers ORDER BY name');
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const { name, phone, address } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const [r] = await pool.query('INSERT INTO customers (name,phone,address) VALUES (?,?,?)', [name, phone||null, address||null]);
      return res.json({ id: r.insertId });
    }
    if (req.method === 'PUT') {
      const { name, phone, address } = req.body;
      await pool.query('UPDATE customers SET name=?,phone=?,address=? WHERE id=?', [name, phone||null, address||null, req.query.id]);
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM customers WHERE id=?', [req.query.id]);
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
};
