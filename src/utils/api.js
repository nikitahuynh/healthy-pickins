
const BASE_URL = process.env.REACT_APP_API_URL || ''; // optional, set in .env

export async function searchRecipes(ingredients) {
  try {
    const res = await fetch(`${BASE_URL}/api/recipes/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error: ${errorText}`);
    }

    return res.json(); // array of recipes
  } catch (err) {
    console.error('searchRecipes error:', err);
    throw err;
  }
}