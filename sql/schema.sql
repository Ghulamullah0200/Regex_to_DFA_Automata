CREATE TABLE IF NOT EXISTS regex_conversions (
  id SERIAL PRIMARY KEY,
  regex_text TEXT NOT NULL,
  alphabet TEXT NOT NULL,
  dfa_state_count INTEGER NOT NULL,
  transition_count INTEGER NOT NULL,
  final_states TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
