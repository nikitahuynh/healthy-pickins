import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // load .env for SUPABASE_DB_PASSWORD
const { Pool } = pkg;

const app = express();
app.use(express.json());

// Postgres / Supabase connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});



// Test route
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM recipes');
    res.json({ count: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Recipe search
app.post('/api/recipes/search', async (req, res) => {
  const { ingredients } = req.body; // e.g., ["onion","garlic"]

  const query = `
    SELECT id, title, ingredients, ingredient_phrase, calories, carbs, protein, fat, instructions
    FROM recipes
    WHERE ingredients::jsonb ?| $1
    LIMIT 30
  `;

  try {
    const { rows } = await pool.query(query, [ingredients]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});