const { getPool } = require('./_db');
const { requireAuth, cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;
  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const [rows] = await pool.query(`
        SELECT i.*,
          g.name as group_name,
          u.name as unit_name,
          bu.name as base_unit_name,
          u.conversion_qty, u.base_unit_id
        FROM items i
        LEFT JOIN groups_master g ON i.group_id = g.id
        LEFT JOIN units u ON i.unit_id = u.id
        LEFT JOIN units bu ON u.base_unit_id = bu.id
        ORDER BY i.name
      `);
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { name, group_id, unit_id, purchase_price, sale_price, opening_stock, low_stock_alert } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      const stock = parseFloat(opening_stock) || 0;
      const [r] = await pool.query(
        'INSERT INTO items (name,group_id,unit_id,purchase_price,sale_price,opening_stock,current_stock,low_stock_alert) VALUES (?,?,?,?,?,?,?,?)',
        [name, group_id||null, unit_id||null, purchase_price||0, sale_price||0, stock, stock, low_stock_alert||0]
      );
      return res.json({ id: r.insertId });
    }

    if (req.method === 'PUT') {
      const id = req.query.id;
      const { name, group_id, unit_id, purchase_price, sale_price, low_stock_alert } = req.body;
      await pool.query(
        'UPDATE items SET name=?,group_id=?,unit_id=?,purchase_price=?,sale_price=?,low_stock_alert=? WHERE id=?',
        [name, group_id||null, unit_id||null, purchase_price||0, sale_price||0, low_stock_alert||0, id]
      );
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM items WHERE id=?', [req.query.id]);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
};
