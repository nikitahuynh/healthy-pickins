import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';
import EcoLogo from './EcoPic3.jpeg';

// --- SUPABASE INITIALIZATION ---
const supabaseUrl = 'https://pbfmfpoctekrcmjzjuhw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZm1mcG9jdGVrcmNtanpqdWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwOTMwMTIsImV4cCI6MjA4MzY2OTAxMn0.WJFR8Kfk-rf7e6OZ_VP6HWs2fOK8pjnFHVUJcC7ib6o';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [produceInput, setProduceInput] = useState('');
  const [pantryInput, setPantryInput] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [produce, setProduce] = useState(() => {
    const saved = localStorage.getItem('ingredients');
    return saved ? (JSON.parse(saved).produce || []) : [];
  });

  const [pantry, setPantry] = useState(() => {
    const saved = localStorage.getItem('ingredients');
    return saved ? (JSON.parse(saved).pantry || []) : [];
  });

  const [mealTypes, setMealTypes] = useState(() => {
    const saved = localStorage.getItem('ingredients');
    return saved ? (JSON.parse(saved).mealTypes || { breakfast: false, lunch: false, dinner: false, snack: false }) : { breakfast: false, lunch: false, dinner: false, snack: false };
  });

  const [showRecipes, setShowRecipes] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    localStorage.setItem('ingredients', JSON.stringify({ produce, pantry, mealTypes }));
  }, [produce, pantry, mealTypes]);

  const addProduce = () => {
    if (!produceInput.trim()) return;
    setProduce([...produce, produceInput.trim()]);
    setProduceInput('');
  };

  const addPantry = () => {
    if (!pantryInput.trim()) return;
    setPantry([...pantry, pantryInput.trim()]);
    setPantryInput('');
  };

  const toggleMealType = (key) => {
    setMealTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- UPDATED FETCH LOGIC ---
  const handleFindRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      const allIngredients = [...produce, ...pantry]
        .map(i => i.toLowerCase().trim())
        .filter(i => i !== '');

      if (allIngredients.length === 0) {
        setError("Please add at least one ingredient.");
        setLoading(false);
        return;
      }

      // .cs (contains) for jsonb needs the value to look like a JSON array: ["item"]
      // We escape the double quotes so Supabase sends valid JSON to the database
      const orQuery = allIngredients
        .map(ing => `ingredients.cs.["${ing}"]`)
        .join(',');

      const { data, error: sbError } = await supabase
        .from('recipes')
        .select('*')
        .or(orQuery);

      if (sbError) throw sbError;

      // Sorting the results so recipes with the MOST matches appear first
      const userIngredients = allIngredients;
      const sortedData = (data || []).sort((a, b) => {
        const matchA = a.ingredients?.filter(i => userIngredients.includes(i.toLowerCase())).length || 0;
        const matchB = b.ingredients?.filter(i => userIngredients.includes(i.toLowerCase())).length || 0;
        return matchB - matchA;
      });

      setRecipes(sortedData);
      setShowRecipes(true);
      setCurrentPage(0);
    } catch (err) {
      console.error('Supabase Error:', err);
      setError(`Database Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

// end findrecipes

  const totalPages = Math.ceil(recipes.length / itemsPerPage);
  const currentRecipes = recipes.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="App">
      <img src={EcoLogo} alt="Logo" className="logo" />
      <h1>Eco-Friendly Recipe Generator</h1>

      <div className="meal-type-row">
        <span className="meal-type-label">Meal types:</span>
        {Object.keys(mealTypes).map(type => (
          <label key={type} className="checkbox-label">
            <input type="checkbox" checked={mealTypes[type]} onChange={() => toggleMealType(type)} /> {type}
          </label>
        ))}
      </div>

      <section>
        <h2 className="produce-title">Produce</h2>
        <div className="input-group">
          <input value={produceInput} onChange={(e) => setProduceInput(e.target.value)} placeholder="e.g. Spinach" onKeyDown={(e) => e.key === 'Enter' && addProduce()} />
          <button onClick={addProduce}>Add</button>
          <button onClick={() => setProduce([])}>Clear</button>
        </div>
        <ul className="item-list">
          {produce.map((item, i) => (
            <li key={i} className="item-row">
              <button onClick={() => setProduce(produce.filter((_, idx) => idx !== i))}>✕</button> {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="pantry-title">Pantry</h2>
        <div className="input-group">
          <input value={pantryInput} onChange={(e) => setPantryInput(e.target.value)} placeholder="e.g. Olive Oil" onKeyDown={(e) => e.key === 'Enter' && addPantry()} />
          <button onClick={addPantry}>Add</button>
          <button onClick={() => setPantry([])}>Clear</button>
        </div>
        <ul className="item-list">
          {pantry.map((item, i) => (
            <li key={i} className="item-row">
              <button onClick={() => setPantry(pantry.filter((_, idx) => idx !== i))}>✕</button> {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="btn-group">
        <button onClick={handleFindRecipes} className="btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Find Recipes'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {showRecipes && (
        <section className="recipe-section">
          <h2>Matches Found ({recipes.length})</h2>
          <div className="recipe-container">
            {currentRecipes.length > 0 ? (
              currentRecipes.map((recipe, index) => (
                <div key={index} className="recipe-card">
                  {/* UPDATED: Using 'title' instead of 'name' */}
                  <h3>{recipe.title}</h3>
                  
                  <div className="nutrition-bar">
                    <span>🔥 {recipe.calories} kcal</span>
                    <span>🍞 {recipe.carbs}g carbs</span>
                    <span>🍗 {recipe.protein}g protein</span>
                    <span>🥑 {recipe.fat}g fat</span>
                  </div>

                  <div className="recipe-grid">
                    {/* UPDATED: Displaying 'ingredient_phrase' or 'ingredients' */}
                    <div>
                      <strong>Ingredients:</strong>
                      <p className="ingredient-list">{recipe.ingredients?.join(', ')}</p>
                    </div>
                    <div>
                      <strong>Instructions:</strong>
                      <p className="instruction-text">{recipe.instructions}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No recipes found matching your ingredients.</p>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>Prev</button>
                <span>{currentPage + 1} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1}>Next</button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;