CREATE TABLE IF NOT EXISTS analyze_logs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  elapsed_ms INT,
  scores JSONB,
  spans JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
