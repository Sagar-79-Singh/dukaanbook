const { getPool } = require('./_db');
const { requireAuth, cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const pool = getPool();
  const { type } = req.query;

  try {

    // ================= SALES =================
    if (type === 'sale') {

      if (req.method === 'GET') {
        const { from, to, customer_id } = req.query;
        let q = `SELECT s.*, c.name as customer_display FROM sales s LEFT JOIN customers c ON s.customer_id=c.id WHERE 1=1`;
        const params = [];

        if (from) { q += ' AND s.sale_date >= ?'; params.push(from); }
        if (to) { q += ' AND s.sale_date <= ?'; params.push(to); }
        if (customer_id) { q += ' AND s.customer_id = ?'; params.push(customer_id); }

        q += ' ORDER BY s.sale_date DESC, s.id DESC';

        const [rows] = await pool.query(q, params);
        return res.json(rows);
      }

      if (req.method === 'DELETE') {
        if (user.role !== 'admin') return res.status(403).json({ error: 'Sirf admin delete kar sakta hai!' });
        await pool.query('DELETE FROM sales WHERE id=?', [req.query.id]);
        return res.json({ ok: true });
      }

      if (req.method === 'POST') {
        const { sale_date, customer_id, customer_name, items, paid_amount, notes } = req.body;
        if (!items || !items.length) return res.status(400).json({ error: 'Items required' });

        const conn = await pool.getConnection();

        try {
          await conn.beginTransaction();

          for (const item of items) {
            if (item.item_id) {
              const [[st]] = await conn.query('SELECT current_stock, name FROM items WHERE id=?', [item.item_id]);
              if (st && parseFloat(st.current_stock) < parseFloat(item.qty)) {
                await conn.rollback();
                conn.release();
                return res.status(400).json({
                  error: `"${st.name}" ka stock kam hai! Available: ${st.current_stock}, Maanga: ${item.qty}`
                });
              }
            }
          }

          const total = items.reduce((s, i) => s + (i.qty * i.rate), 0);
          const paid = parseFloat(paid_amount) || 0;
          const mode = paid >= total ? 'cash' : paid > 0 ? 'partial' : 'credit';

          const [sr] = await conn.query(
            'INSERT INTO sales (sale_date,customer_id,customer_name,total_amount,paid_amount,payment_mode,notes) VALUES (?,?,?,?,?,?,?)',
            [sale_date, customer_id||null, customer_name||null, total, paid, mode, notes||null]
          );

          const saleId = sr.insertId;

          for (const item of items) {
            await conn.query(
              'INSERT INTO sale_items (sale_id,item_id,item_name,qty,unit_name,rate) VALUES (?,?,?,?,?,?)',
              [saleId, item.item_id||null, item.item_name, item.qty, item.unit_name||'', item.rate]
            );

            if (item.item_id) {
              await conn.query('UPDATE items SET current_stock = current_stock - ? WHERE id=?', [item.qty, item.item_id]);
            }
          }

          await conn.commit();
          return res.json({ id: saleId, total });

        } catch (e) {
          await conn.rollback();
          throw e;
        } finally {
          conn.release();
        }
      }
    }

    // ================= PURCHASE =================
    if (type === 'purchase') {

      if (req.method === 'GET') {
        const { from, to, supplier_id } = req.query;
        let q = `SELECT p.*, s.name as supplier_display FROM purchases p LEFT JOIN suppliers s ON p.supplier_id=s.id WHERE 1=1`;
        const params = [];

        if (from) { q += ' AND p.purchase_date >= ?'; params.push(from); }
        if (to) { q += ' AND p.purchase_date <= ?'; params.push(to); }
        if (supplier_id) { q += ' AND p.supplier_id = ?'; params.push(supplier_id); }

        q += ' ORDER BY p.purchase_date DESC, p.id DESC';

        const [rows] = await pool.query(q, params);
        return res.json(rows);
      }

      if (req.method === 'DELETE') {
        if (user.role !== 'admin') return res.status(403).json({ error: 'Sirf admin delete kar sakta hai!' });
        await pool.query('DELETE FROM purchases WHERE id=?', [req.query.id]);
        return res.json({ ok: true });
      }

      if (req.method === 'POST') {
        const { purchase_date, supplier_id, supplier_name, items, paid_amount, notes } = req.body;
        if (!items || !items.length) return res.status(400).json({ error: 'Items required' });

        const conn = await pool.getConnection();

        try {
          await conn.beginTransaction();

          const total = items.reduce((s, i) => s + (i.qty * i.rate), 0);
          const paid = parseFloat(paid_amount) || 0;
          const mode = paid >= total ? 'cash' : paid > 0 ? 'partial' : 'credit';

          const [pr] = await conn.query(
            'INSERT INTO purchases (purchase_date,supplier_id,supplier_name,total_amount,paid_amount,payment_mode,notes) VALUES (?,?,?,?,?,?,?)',
            [purchase_date, supplier_id||null, supplier_name||null, total, paid, mode, notes||null]
          );

          const purchaseId = pr.insertId;

          for (const item of items) {
            await conn.query(
              'INSERT INTO purchase_items (purchase_id,item_id,item_name,qty,unit_name,rate) VALUES (?,?,?,?,?,?)',
              [purchaseId, item.item_id||null, item.item_name, item.qty, item.unit_name||'', item.rate]
            );

            if (item.item_id) {
              await conn.query('UPDATE items SET current_stock = current_stock + ? WHERE id=?', [item.qty, item.item_id]);
            }
          }

          await conn.commit();
          return res.json({ id: purchaseId, total });

        } catch (e) {
          await conn.rollback();
          throw e;
        } finally {
          conn.release();
        }
      }
    }

    // ================= PAYMENT =================
    if (type === 'payment' && req.method === 'POST') {

      const { type: paymentType, party_id, amount, date, notes } = req.body;

      if (!party_id || !amount || !paymentType) {
        return res.status(400).json({ error: 'Required fields missing' });
      }

      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();
        const amt = parseFloat(amount);

        if (paymentType === 'received') {
          const [[c]] = await conn.query('SELECT balance FROM customers WHERE id=?', [party_id]);
          const newBal = (parseFloat(c.balance) || 0) - amt;

          await conn.query('UPDATE customers SET balance=? WHERE id=?', [newBal, party_id]);

          await conn.query(
            'INSERT INTO ledger_entries (entry_date,party_type,party_id,entry_type,debit,credit,balance,notes) VALUES (?,?,?,?,?,?,?,?)',
            [date, 'customer', party_id, 'payment_received', 0, amt, newBal, notes||null]
          );

        } else {
          const [[s]] = await conn.query('SELECT balance FROM suppliers WHERE id=?', [party_id]);
          const newBal = (parseFloat(s.balance) || 0) - amt;

          await conn.query('UPDATE suppliers SET balance=? WHERE id=?', [newBal, party_id]);

          await conn.query(
            'INSERT INTO ledger_entries (entry_date,party_type,party_id,entry_type,debit,credit,balance,notes) VALUES (?,?,?,?,?,?,?,?)',
            [date, 'supplier', party_id, 'payment_made', amt, 0, newBal, notes||null]
          );
        }

        await conn.commit();
        return res.json({ ok: true });

      } catch (e) {
        await conn.rollback();
        return res.status(500).json({ error: e.message });
      } finally {
        conn.release();
      }
    }

    res.status(400).json({ error: 'Invalid transaction type' });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
