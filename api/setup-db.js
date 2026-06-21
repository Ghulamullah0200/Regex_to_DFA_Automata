const { ensureSchema, hasDatabase } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Use GET or POST to initialize database.' });
  }

  if (!hasDatabase()) {
    return res.status(200).json({ ok: false, message: 'DATABASE_URL is not configured.' });
  }

  try {
    await ensureSchema();
    return res.status(200).json({ ok: true, message: 'SQL table regex_conversions is ready.' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};
