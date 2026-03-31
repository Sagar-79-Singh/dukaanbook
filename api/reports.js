const { getPool } = require('./_db');
const { requireAuth, cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;
  if (req.method !== 'GET') return res.status(405).end();

  const { type, from, to } = req.query;
  const pool = getPool();

  try {
    if (type === 'dashboard') {
      const today = new Date().toISOString().split('T')[0];
      const [[ts]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as count FROM sales WHERE sale_date=?', [today]);
      const [[tp]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) as total FROM purchases WHERE purchase_date=?', [today]);
      const [[tr]] = await pool.query('SELECT COALESCE(SUM(balance),0) as total FROM customers WHERE balance > 0');
      const [[tpay]] = await pool.query('SELECT COALESCE(SUM(balance),0) as total FROM suppliers WHERE balance > 0');
      const [[sv]] = await pool.query('SELECT COALESCE(SUM(current_stock * purchase_price),0) as total FROM items');
      const [[ls]] = await pool.query('SELECT COUNT(*) as count FROM items WHERE current_stock <= low_stock_alert AND low_stock_alert > 0');
      return res.json({
        today_sales: ts, today_purchases: tp,
        total_receivable: tr.total, total_payable: tpay.total,
        stock_value: sv.total, low_stock_count: ls.count
      });
    }

    if (type === 'stock') {
      const [rows] = await pool.query(`
        SELECT i.id, i.name, g.name as group_name,
          u.name as unit_name, bu.name as base_unit_name,
          u.conversion_qty, u.base_unit_id,
          i.current_stock, i.purchase_price, i.sale_price, i.low_stock_alert,
          (i.current_stock * i.purchase_price) as stock_value
        FROM items i
        LEFT JOIN groups_master g ON i.group_id = g.id
        LEFT JOIN units u ON i.unit_id = u.id
        LEFT JOIN units bu ON u.base_unit_id = bu.id
        ORDER BY g.name, i.name
      `);
      return res.json(rows);
    }

    res.status(400).json({ error: 'Invalid report type' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
