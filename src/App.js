import React, { useEffect, useState } from 'react';
import './App.css'; // Import the new CSS file
import EcoLogo from './EcoPic3.jpeg';
import topRecipesData from './top_recipes.json';

function App() {
  const [produceInput, setProduceInput] = useState('');
  const [pantryInput, setPantryInput] = useState('');
  const [mealTypes, setMealTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('ingredients');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.mealTypes || { breakfast: false, lunch: false, dinner: false, snack: false };
    } catch {
      return { breakfast: false, lunch: false, dinner: false, snack: false };
    }
  });

  const [produce, setProduce] = useState(() => {
    try {
      const saved = localStorage.getItem('ingredients');
      return saved ? JSON.parse(saved).produce || [] : [];
    } catch { return []; }
  });

  const [pantry, setPantry] = useState(() => {
    try {
      const saved = localStorage.getItem('ingredients');
      return saved ? JSON.parse(saved).pantry || [] : [];
    } catch { return []; }
  });

  const [showRecipes, setShowRecipes] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    const payload = { produce, pantry, mealTypes };
    localStorage.setItem('ingredients', JSON.stringify(payload));
  }, [produce, pantry, mealTypes]);

  const addProduce = () => {
    const trimmed = produceInput.trim();
    if (!trimmed) return;
    setProduce((prev) => [...prev, trimmed]);
    setProduceInput('');
  };

  const addPantry = () => {
    const trimmed = pantryInput.trim();
    if (!trimmed) return;
    setPantry((prev) => [...prev, trimmed]);
    setPantryInput('');
  };

  const clearProduce = () => setProduce([]);
  const clearPantry = () => setPantry([]);
  const removeProduceItem = (idx) => setProduce((prev) => prev.filter((_, i) => i !== idx));
  const removePantryItem = (idx) => setPantry((prev) => prev.filter((_, i) => i !== idx));

  const toggleMealType = (key) => {
    setMealTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedMealTypes = Object.entries(mealTypes)
    .filter(([_, val]) => val)
    .map(([key]) => key);

  const handleFindRecipes = () => {
    setShowRecipes(true);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(topRecipesData.length / itemsPerPage);
  const currentRecipes = topRecipesData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const downloadJSON = () => {
    const data = { produce, pantry, mealTypes: selectedMealTypes, savedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ingredients.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <img src={EcoLogo} alt="Eco Meals Logo" className="logo" />

      <h1>Eco-Friendly Recipe Generator</h1>

      <div className="meal-type-row">
        <span className="meal-type-label">Meal type:</span>
        <label>
          <input type="checkbox" checked={mealTypes.breakfast} onChange={() => toggleMealType('breakfast')} /> Breakfast
        </label>
        <label>
          <input type="checkbox" checked={mealTypes.lunch} onChange={() => toggleMealType('lunch')} /> Lunch
        </label>
        <label>
          <input type="checkbox" checked={mealTypes.dinner} onChange={() => toggleMealType('dinner')} /> Dinner
        </label>
        <label>
          <input type="checkbox" checked={mealTypes.snack} onChange={() => toggleMealType('snack')} /> Snack
        </label>

        <span className="selection-indicator">
          Selected: {selectedMealTypes.length ? selectedMealTypes.join(', ') : 'none'}
        </span>
      </div>

      <section>
        <h2 className="produce-title">Produce</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter a produce item"
            value={produceInput}
            onChange={(e) => setProduceInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addProduce()}
          />
          <button onClick={addProduce}>Add Produce</button>
          <button onClick={clearProduce}>Clear Produce</button>
        </div>
        <ul className="item-list">
          {produce.map((item, i) => (
            <li key={i} className="item-row">
              <button onClick={() => removeProduceItem(i)}>✕</button> {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="pantry-title">Pantry Items</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter a pantry item"
            value={pantryInput}
            onChange={(e) => setPantryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPantry()}
          />
          <button onClick={addPantry}>Add Pantry Item</button>
          <button onClick={clearPantry}>Clear Pantry</button>
        </div>
        <ul className="item-list">
          {pantry.map((item, i) => (
            <li key={i} className="item-row">
              <button onClick={() => removePantryItem(i)}>✕</button> {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="btn-group">
        <button onClick={handleFindRecipes} className="btn-primary">Find Recipes</button>
        <button onClick={downloadJSON}>Download JSON</button>
      </div>

      {showRecipes && (
        <section className="recipe-section">
          <h2>Top Recipes</h2>
          <div className="recipe-container">
            {currentRecipes.map((recipe, index) => (
              <div key={index} className="recipe-card">
                <h3>{recipe.name}</h3>
                <div className="recipe-grid">
                  <div>
                    <strong className="have-text">Have:</strong>
                    <ul className="recipe-list">
                      {recipe.ingredientsHave?.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong className="need-text">Still Need:</strong>
                    <ul className="recipe-list">
                      {recipe.ingredientsNeed?.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}

            <div className="pagination">
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>← Previous</button>
              <span>Page {currentPage + 1} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>Next →</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;