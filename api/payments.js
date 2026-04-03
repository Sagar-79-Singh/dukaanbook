const { getPool } = require('./_db');
const { requireAuth, cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;
  if (req.method !== 'POST') return res.status(405).end();

  const pool = getPool();
  const { type, party_id, amount, date, notes } = req.body;
  if (!party_id || !amount || !type) return res.status(400).json({ error: 'Required fields missing' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const amt = parseFloat(amount);

    if (type === 'received') {
      // Customer paying us — reduces their balance
      const [[c]] = await conn.query('SELECT balance FROM customers WHERE id=?', [party_id]);
      const newBal = (parseFloat(c.balance) || 0) - amt;
      await conn.query('UPDATE customers SET balance=? WHERE id=?', [newBal, party_id]);
      await conn.query(
        'INSERT INTO ledger_entries (entry_date,party_type,party_id,entry_type,debit,credit,balance,notes) VALUES (?,?,?,?,?,?,?,?)',
        [date, 'customer', party_id, 'payment_received', 0, amt, newBal, notes||null]
      );
    } else {
      // We paying supplier — reduces their balance
      const [[s]] = await conn.query('SELECT balance FROM suppliers WHERE id=?', [party_id]);
      const newBal = (parseFloat(s.balance) || 0) - amt;
      await conn.query('UPDATE suppliers SET balance=? WHERE id=?', [newBal, party_id]);
      await conn.query(
        'INSERT INTO ledger_entries (entry_date,party_type,party_id,entry_type,debit,credit,balance,notes) VALUES (?,?,?,?,?,?,?,?)',
        [date, 'supplier', party_id, 'payment_made', amt, 0, newBal, notes||null]
      );
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
};
