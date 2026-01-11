import React, { useEffect, useState } from 'react';
import './App.css'; // Import the new CSS file
import EcoLogo from './EcoPic4Edited.jpeg';
import { createClient } from '@supabase/supabase-js';
// import topRecipesData from './top_recipes.json';

const supabaseUrl = 'https://pbfmfpoctekrcmjzjuhw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZm1mcG9jdGVrcmNtanpqdWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwOTMwMTIsImV4cCI6MjA4MzY2OTAxMn0.WJFR8Kfk-rf7e6OZ_VP6HWs2fOK8pjnFHVUJcC7ib6o';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [produceInput, setProduceInput] = useState('');
  const [pantryInput, setPantryInput] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null); // State for the popup

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

  // --- FETCH AND RANK LOGIC ---
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

      // Get any recipe that contains AT LEAST ONE of your ingredients
      const orQuery = allIngredients
        .map(ing => `ingredients.cs.["${ing}"]`)
        .join(',');

      let query = supabase.from('recipes').select('*').or(orQuery);

      const selectedMeals = Object.entries(mealTypes)
        .filter(([_, active]) => active)
        .map(([name]) => name);

      if (selectedMeals.length > 0) {
        query = query.in('meal_type', selectedMeals);
      }

      const { data, error: sbError } = await query;
      if (sbError) throw sbError;

      // computing individual recipe rankings
      const rankedData = (data || []).map((recipe) => {
        const user = (allIngredients || []).map((x) => String(x).toLowerCase().trim());
        const recipeIngredients = (recipe.ingredients || []).map((i) => String(i).toLowerCase().trim());

        const hasIngredient = (user_ing, recipe_ing) => 
          recipe_ing.includes(user_ing) || user_ing.includes(recipe_ing);

        const recipeContainsUserIng = (user_ing) => 
          recipeIngredients.some((recipe_ing) => hasIngredient(user_ing, recipe_ing));

        const matchedUser = user.filter(recipeContainsUserIng);
        const extraUser = user.filter((user_ing) => !recipeContainsUserIng(user_ing));

        const missingIngredients = recipeIngredients.filter(
          (recipe_ing) => !user.some((user_ing) => hasIngredient(user_ing, recipe_ing))
        );

        return {
          ...recipe,

          // ranking variables
          matchedUser,
          extraUser,
          missingIngredients,
          matchCount: matchedUser.length,
          missingCount: missingIngredients.length,
          perfectRecipe: missingIngredients.length === 0 && matchedUser.length > 0, // ✅ true even with extras
        };
      });


      // sorting logic
      rankedData.sort((a, b) => {
        // perfect matches first
        if (a.perfectRecipe && b.perfectRecipe) { // both perfect
          const aTotalIng = Array.isArray(a.ingredients) ? a.ingredients.length : 0;
          const bTotalIng = Array.isArray(b.ingredients) ? b.ingredients.length : 0;
          if (bTotalIng !== aTotalIng) {
            return aTotalIng - bTotalIng; // fewer perfect match ingredients first
          }
        }
        if (!a.perfectRecipe && b.perfectRecipe) return 1; // b perfect
        if (a.perfectRecipe && !b.perfectRecipe) return -1; // a perfect
        // no perfect, more matches first
        else if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount; 
        }
        else {
        // fewer missing recipe ingredients first
          const aMissing = Number.isFinite(a.missingCount) ? a.missingCount : 0;
          const bMissing = Number.isFinite(b.missingCount) ? b.missingCount : 0;
          if (aMissing !== bMissing) {
            return aMissing - bMissing; // fewer missing first
          }
        }
        return 0;
      });
      setRecipes(rankedData);
      setShowRecipes(true);
      setCurrentPage(0);

    } catch (err) {
      console.error('Supabase Error:', err);
      setError(`Database Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="input-sections">
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
      </div>

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
              currentRecipes.map((recipe, index) => {
                // USE THE PRE-COMPUTED RANKING DATA!
                const matched = recipe.matchedUser || [];
                const missing = recipe.missingIngredients || [];

                return (
                  <div key={index} className="recipe-card" onClick={() => setSelectedRecipe(recipe)}>
                    <h3>{recipe.title}</h3>

                    <div className="nutrition-bar">
                      <span> 🔥 calories: {recipe.calories.toFixed(2)}kcal |</span>
                      <span> 🍞 carbs: {recipe.carbs.toFixed(2)}g |</span>
                      <span> 🍗 protein: {recipe.protein.toFixed(2)}g |</span>
                      <span> 🥑 fat: {recipe.fat.toFixed(2)}g</span>
                    </div>

                    <div className="ingredient-comparison">
                      <div className="ing-column match-col">
                        <strong>Matched ({matched.length}):</strong>
                        <ul>{matched.map((ing, i) => <li key={i}>✅ {ing}</li>)}</ul>
                      </div>
                      <div className="ing-column missing-col">
                        <strong>Missing ({missing.length}):</strong>
                        <ul>{missing.map((ing, i) => <li key={i}>❌ {ing}</li>)}</ul>
                      </div>
                    </div>

                    {recipe.perfectRecipe && <p className="perfect-badge">🌟 Perfect Match!</p>}
                    <p className="click-hint">Click for full recipe</p>
                  </div>
                );
              })
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

      {/* POPUP MODAL */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedRecipe(null)}>✕</button>

            <h2 className="modal-title">{selectedRecipe.title}</h2>

            <div className="modal-body">
              <section className="modal-section">
                <h4>Ingredient Details</h4>
                <div className="ingredient-two-col">
                  {/* We split by comma or newline, then map to individual items */}
                  {String(selectedRecipe.ingredient_phrase || "")
                    .split(/,|\n/)
                    .filter(item => item.trim() !== "")
                    .map((phrase, i) => (
                      <div key={i} className="ingredient-line">• {phrase.trim()}</div>
                    ))
                  }
                </div>
              </section>

              <section className="modal-section">
                <h4>Instructions</h4>
                <div className="instruction-steps">
                  {/* Split by period followed by a space to create new steps */}
                  {String(selectedRecipe.instructions || "")
                    .split(/\. /)
                    .filter(step => step.trim() !== "")
                    .map((step, i) => (
                      <div key={i} className="instruction-step">
                        {/* i + 1 ensures we start at 1 instead of 0 */}
                        <span className="step-number">{i + 1}) </span>
                        <span className="step-text">
                          {step.trim()}{!step.endsWith('.') && '.'}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;