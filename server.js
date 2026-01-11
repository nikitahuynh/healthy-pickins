import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  user: 'postgres',                           // supabase DB user
  host: 'pbfmfpoctekrcmjzjuhw.supabase.co',  // supabase host
  database: 'postgres',                       // supabase database
  password: process.env.SUPABASE_DB_PASSWORD,// use env variable
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// Simple test route
app.get('/api/test', async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) FROM recipes');
  res.json({ count: result.rows[0].count });
});

// search endpoint
app.post('/api/recipes/search', async (req, res) => {
  const { ingredients } = req.body; // ["onion","garlic"]

  // sql query
  const query = `
    SELECT id, title, ingredients,  instructions
    FROM recipes
    WHERE ingredients ?| $1
    LIMIT 50;
  `;

  try {
    const { rows } = await pool.query(query, [ingredients]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
