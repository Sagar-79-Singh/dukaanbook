const { getPool } = require('./_db');
const { requireAuth, cors } = require('./_auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const user = requireAuth(req, res); if (!user) return;
  if (req.method !== 'GET') return res.status(405).end();

  const { type, id } = req.query;
  if (!type || !id) return res.status(400).json({ error: 'type and id required' });

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM ledger_entries WHERE party_type=? AND party_id=? ORDER BY entry_date ASC, id ASC',
      [type, id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
