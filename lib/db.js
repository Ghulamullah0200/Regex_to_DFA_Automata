let neonDriver = null;
let sqlClient = null;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  if (!sqlClient) {
    if (!neonDriver) {
      try {
        neonDriver = require('@neondatabase/serverless').neon;
      } catch (error) {
        throw new Error('Install dependencies first: npm install. Missing @neondatabase/serverless.');
      }
    }
    sqlClient = neonDriver(databaseUrl);
  }
  return sqlClient;
}

async function ensureSchema() {
  const sql = getSql();
  if (!sql) return false;
  await sql`
    CREATE TABLE IF NOT EXISTS regex_conversions (
      id SERIAL PRIMARY KEY,
      regex_text TEXT NOT NULL,
      alphabet TEXT NOT NULL,
      dfa_state_count INTEGER NOT NULL,
      transition_count INTEGER NOT NULL,
      final_states TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return true;
}

async function saveConversion(result) {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  const finalStates = result.states.filter(s => s.isFinal).map(s => s.name).join(', ');
  const rows = await sql`
    INSERT INTO regex_conversions
      (regex_text, alphabet, dfa_state_count, transition_count, final_states)
    VALUES
      (${result.regex}, ${result.alphabet.join(', ')}, ${result.states.length}, ${result.transitions.length}, ${finalStates || 'None'})
    RETURNING id, created_at
  `;
  return rows[0];
}

async function listConversions(limit = 10) {
  const sql = getSql();
  if (!sql) return [];
  await ensureSchema();
  return sql`
    SELECT id, regex_text, alphabet, dfa_state_count, transition_count, final_states, created_at
    FROM regex_conversions
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

module.exports = { ensureSchema, saveConversion, listConversions, hasDatabase: () => Boolean(getSql()) };
