import React, { useEffect, useState } from 'react';

import EcoLogo from './EcoPic2.webp';

// 1. Import your local JSON file directly
import topRecipesData from './top_recipes.json';

function App() {
  // --- EXISTING STATE ---
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

  // --- NEW STATE FOR RECIPE VIEWER ---
  const [showRecipes, setShowRecipes] = useState(false); // Controls if the section is visible
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // Persist ingredients
  useEffect(() => {
    const payload = { produce, pantry, mealTypes };
    localStorage.setItem('ingredients', JSON.stringify(payload));
  }, [produce, pantry, mealTypes]);

  // Handlers
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

  // --- TRIGGER FIND RECIPES ---
  const handleFindRecipes = () => {
    setShowRecipes(true);
    setCurrentPage(0); // Reset to page 1 whenever searching
  };

  // Pagination Logic using the imported JSON data
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

  const saveToServer = async () => {
    const payload = { mealTypes: selectedMealTypes, produce, pantry, savedAt: new Date().toISOString() };
    try {
      const res = await fetch('/api/save-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) alert('Failed to save to server');
      else alert('Saved to server ✔️');
    } catch (err) { alert('Network error'); }
  };

  return (
    // <div className="App" style={{ padding: '1rem', fontFamily: "'Poppins', sans-serif"}}>
    <div className="App" style={{ padding: '1rem', fontFamily: "'Poppins', sans-serif", position: 'relative' }}>

      {/* for image */}
      <img 
        src={EcoLogo} 
        alt="Eco Meals Logo" 
        style={{ 
          position: 'absolute', 
          top: '25px', 
          right: '25px', 
          width: '400px', // Adjust size as needed
          height: 'auto',
          borderRadius: '8px' // Optional: rounds the corners of your JPEG
        }} 
      />

      <h1 style={{ color: 'forestgreen' }}>Eco-Friendly Recipe Generator</h1>

      {/* MEAL TYPE ROW */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontWeight: 600 }}>Meal type:</span>

        <label>
          <input
            type="checkbox"
            checked={mealTypes.breakfast}
            onChange={() => toggleMealType('breakfast')}
          />{' '}
          Breakfast
        </label>
        <label>
          <input
            type="checkbox"
            checked={mealTypes.lunch}
            onChange={() => toggleMealType('lunch')}
          />{' '}
          Lunch
        </label>
        <label>
          <input
            type="checkbox"
            checked={mealTypes.dinner}
            onChange={() => toggleMealType('dinner')}
          />{' '}
          Dinner
        </label>
        <label>
          <input
            type="checkbox"
            checked={mealTypes.snack}
            onChange={() => toggleMealType('snack')}
          />{' '}
          Snack
        </label>

        {/* Small indicator of selection */}
        <span style={{ marginCenter: 'auto', color: '#555' }}>
          Selected: {selectedMealTypes.length ? selectedMealTypes.join(', ') : 'none'}
        </span>
      </div>

      {/* PRODUCE SECTION */}
      <section style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: 'blue' }}>Produce</h2>
        <div className="input-group" style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            id="produce-input"
            placeholder="Enter a produce item"
            value={produceInput}
            onChange={(e) => setProduceInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addProduce()}
          />
          <button id="add-produce-button" onClick={addProduce}>
            Add Produce
          </button>
          <button id="clear-produce-button" onClick={clearProduce}>
            Clear Produce
          </button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {produce.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.5rem', marginTop: '4px' }}>
              <button onClick={() => removeProduceItem(i)}>✕</button> {item}
            </li>
          ))}
        </ul>
      </section>

      {/* PANTRY SECTION */}
      <section style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: 'darkmagenta' }}>Pantry Items</h2>
        <div className="input-group" style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            id="pantry-input"
            placeholder="Enter a pantry item"
            value={pantryInput}
            onChange={(e) => setPantryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPantry()}
          />
          <button id="add-pantry-button" onClick={addPantry}>
            Add Pantry Item
          </button>
          <button id="clear-pantry-button" onClick={clearPantry}>
            Clear Pantry
          </button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pantry.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.5rem', marginTop: '4px' }}>
              <button onClick={() => removePantryItem(i)}>✕</button> {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <button onClick={handleFindRecipes} style={{ background: '#007bff', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
          Find Recipes
        </button>
        <button onClick={downloadJSON}>Download JSON</button>
        <button onClick={saveToServer}>Save to Server</button>
      </div>

      {/* RECIPE VIEWER (Only shows if showRecipes is true) */}
      {showRecipes && (
        <section style={{ borderTop: '2px solid #eee', paddingTop: '1rem' }}>
          <h2>Top Recipes</h2>
          <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', background: '#f9f9f9' }}>
            {currentRecipes.map((recipe, index) => (
              <div key={index} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
                <h3 style={{ color: '#333', marginTop: 0 }}>{recipe.name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <strong style={{ color: 'green' }}>Have:</strong>
                    <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem' }}>
                      {recipe.ingredientsHave?.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong style={{ color: 'red' }}>Still Need:</strong>
                    <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem' }}>
                      {recipe.ingredientsNeed?.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
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