const { convertRegexToDfa, RegexSyntaxError } = require('../lib/regexToDfa');
const { saveConversion, hasDatabase } = require('../lib/db');

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') return JSON.parse(req.body);
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST method is allowed.' });

  try {
    const body = await readJson(req);
    const regex = body.regex;
    const result = convertRegexToDfa(regex);

    let dbRecord = null;
    let databaseSaved = false;
    let databaseMessage = 'DATABASE_URL is not configured. Conversion worked, but SQL logging is disabled.';

    try {
      if (hasDatabase()) {
        dbRecord = await saveConversion(result);
        databaseSaved = true;
        databaseMessage = 'Conversion saved in SQL database.';
      }
    } catch (dbError) {
      databaseMessage = `Conversion worked, but SQL save failed: ${dbError.message}`;
    }

    return res.status(200).json({
      ok: true,
      result,
      database: {
        saved: databaseSaved,
        message: databaseMessage,
        record: dbRecord,
      },
    });
  } catch (error) {
    const status = error instanceof RegexSyntaxError || error instanceof SyntaxError ? 400 : 500;
    return res.status(status).json({ ok: false, error: error.message || 'Something went wrong.' });
  }
};
