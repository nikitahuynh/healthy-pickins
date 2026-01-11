import React, { useEffect, useState } from 'react';
import './App.css'; // Import the new CSS file
import EcoLogo from './EcoPic4Edited.jpeg';
import topRecipesData from './top_recipes.json';

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

      // 1. Get any recipe that contains AT LEAST ONE of your ingredients
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

      // 2. Rank the results
      
      const rankedData = (data || []).map((recipe) => {
        const user = (allIngredients || []).map((x) => String(x).toLowerCase().trim());
        const recipeIngredients = (recipe.ingredients || []).map((i) => String(i).toLowerCase().trim());

        // Fuzzy "includes" matching: a recipe ingredient matches a required token if it contains it
        const containsUsers = (user_ing) => recipeIngredients.some((ing) => ing.includes(user_ing));

        const matchedUser = user.filter(containsUsers);
        const extraUser = user.filter((user_ing) => !containsUsers(user_ing));

        // Extras = recipe ingredients that don't match any required token
        const missingIngredients = recipeIngredients.filter(
          (ing) => !user.some((user_ing) => ing.includes(user_ing))
        );

        // Backwards-compatible fields (per-ingredient perspective)
        // const matchedRecipeIngredients = matchedUser
        // recipeIngredients.filter((ing) =>
        //   user.some((user_ing) => ing.includes(user_ing))
        // );

        return {
          ...recipe,

          // Requirements perspective
          matchedUser,
          extraUser,
          missingIngredients,
          matchCount: matchedUser.length,
          missingCount: missingIngredients.length,
          isAllRequirementsMet: missingIngredients.length === 0, // ✅ true even with extras
        };
      });

      // ---------- Sorting logic ----------
      rankedData.sort((a, b) => {
        // 1) Perfect matches first
        if (a.isAllRequirementsMet && b.isAllRequirementsMet) {
          const aTotalIng = Array.isArray(a.ingredients) ? a.ingredients.length : 0;
          const bTotalIng = Array.isArray(b.ingredients) ? b.ingredients.length : 0;
          if (bTotalIng !== aTotalIng) {
            return bTotalIng - aTotalIng; // desc
          }
        }
        if (!a.isAllRequirementsMet && b.isAllRequirementsMet) return 1;
        if (a.isAllRequirementsMet && !b.isAllRequirementsMet) return -1;
        // 3) More matches first
        else if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount; // desc
        }
        else {
        // 4) Fewer missing first
          const aMissing = Number.isFinite(a.missingCount) ? a.missingCount : 0;
          const bMissing = Number.isFinite(b.missingCount) ? b.missingCount : 0;
          if (aMissing !== bMissing) {
            return aMissing - bMissing; // asc
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
                const userInventory = [...produce, ...pantry].map(i => i.toLowerCase().trim());
                const recipeIngredients = recipe.ingredients || [];
                const matched = recipeIngredients.filter(ing => userInventory.includes(ing.toLowerCase()));
                const missing = recipeIngredients.filter(ing => !userInventory.includes(ing.toLowerCase()));

                return (
                  <div key={index} className="recipe-card" onClick={() => setSelectedRecipe(recipe)}>
                    <h3>{recipe.title}</h3>
                    
                    <div className="nutrition-bar">
                      <span>🔥 {recipe.calories} kcal</span>
                      <span>🍞 {recipe.carbs}g</span>
                      <span>🍗 {recipe.protein}g</span>
                      <span>🥑 {recipe.fat}g</span>
                    </div>

                    <div className="ingredient-comparison">
                      <div className="ing-column match-col">
                        <strong>Matched:</strong>
                        <ul>{matched.map((ing, i) => <li key={i}>✅ {ing}</li>)}</ul>
                      </div>
                      <div className="ing-column missing-col">
                        <strong>Missing:</strong>
                        <ul>{missing.map((ing, i) => <li key={i}>❌ {ing}</li>)}</ul>
                      </div>
                    </div>
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
            <h2>{selectedRecipe.title}</h2>
            <div className="modal-body">
              <section>
                <h4>Ingredient Details:</h4>
                <p className="ingredient-phrase">{selectedRecipe.ingredient_phrase}</p>
              </section>
              <section>
                <h4>Instructions:</h4>
                <p className="instruction-text">{selectedRecipe.instructions}</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;