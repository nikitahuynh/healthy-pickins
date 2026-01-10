import React, { useEffect, useState } from 'react';

function App() {
  // Inputs
  const [produceInput, setProduceInput] = useState('');
  const [pantryInput, setPantryInput] = useState('');

  // Meal types (load from localStorage on first render)
  const [mealTypes, setMealTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('ingredients');
      const parsed = saved ? JSON.parse(saved) : null;
      // Store as an object for easy checkbox control
      return parsed?.mealTypes || {
        breakfast: false,
        lunch: false,
        dinner: false,
        snack: false,
      };
    } catch {
      return {
        breakfast: false,
        lunch: false,
        dinner: false,
        snack: false,
      };
    }
  });

  // Lists (load from localStorage on first render)
  const [produce, setProduce] = useState(() => {
    try {
      const saved = localStorage.getItem('ingredients');
      return saved ? JSON.parse(saved).produce || [] : [];
    } catch {
      return [];
    }
  });

  const [pantry, setPantry] = useState(() => {
    try {
      const saved = localStorage.getItem('ingredients');
      return saved ? JSON.parse(saved).pantry || [] : [];
    } catch {
      return [];
    }
  });

  // Persist combined data whenever any part changes
  useEffect(() => {
    const payload = { produce, pantry, mealTypes };
    localStorage.setItem('ingredients', JSON.stringify(payload));
  }, [produce, pantry, mealTypes]);

  // Add handlers
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

  // Clear handlers
  const clearProduce = () => setProduce([]);
  const clearPantry = () => setPantry([]);

  // Remove individual items by index
  const removeProduceItem = (idx) => {
    setProduce((prev) => prev.filter((_, i) => i !== idx));
  };

  const removePantryItem = (idx) => {
    setPantry((prev) => prev.filter((_, i) => i !== idx));
  };

  // Selected meal types (array)
  const selectedMealTypes = Object.entries(mealTypes)
    .filter(([_, val]) => val)
    .map(([key]) => key); // e.g., ["breakfast","snack"]

  // Download a single JSON file (produce first, then pantry)
  const downloadJSON = () => {
    const data = {
      // Ordering keys like this ensures JSON.stringify writes produce first.
      produce,
      pantry,
      mealTypes: selectedMealTypes, // record selections
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ingredients.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save to server (Express backend) to append to meals.json
  const saveToServer = async () => {
    const payload = {
      mealTypes: selectedMealTypes,
      produce,
      pantry,
      savedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/save-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        alert('Failed to save to server: ' + msg);
      } else {
        alert('Saved to server ✔️');
      }
    } catch (err) {
      alert('Network error saving to server: ' + String(err));
    }
  };

  // Toggle meal type checkbox
  const toggleMealType = (key) => {
    setMealTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="App" style={{ padding: '1rem', fontFamily: 'system-ui' }}>
      <h1>Hello Kaelyn</h1>

      {/* MEAL TYPE ROW (top) */}
      <div
        id="meal-type-row"
        style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}
      >
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
        <span style={{ marginLeft: 'auto', color: '#555' }}>
          Selected: {selectedMealTypes.length ? selectedMealTypes.join(', ') : 'none'}
        </span>
      </div>

      {/* PRODUCE (first) */}
      <section style={{ marginBottom: '1rem' }}>
        <h2>Produce</h2>
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

        <ul
          id="produce-list"
          style={{ marginTop: '0.75rem', listStyle: 'none', paddingLeft: 0 }}
        >
          {produce.map((item, i) => (
            <li
              key={`produce-${item}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem',
              }}
            >
              
              <button
                onClick={() => removeProduceItem(i)}
                aria-label={`Remove ${item} from produce`}
                title="Remove"
              >
                ✕
              </button>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* PANTRY (second) */}
      <section style={{ marginBottom: '1rem' }}>
        <h2>Pantry Items</h2>
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

        <ul
          id="pantry-list"
          style={{ marginTop: '0.75rem', listStyle: 'none', paddingLeft: 0 }}
        >
          {pantry.map((item, i) => (
            <li
              key={`pantry-${item}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem',
              }}
            >
              <button
                onClick={() => removePantryItem(i)}
                aria-label={`Remove ${item} from pantry`}
                title="Remove"
              >
                ✕
              </button>
              <span>{item}</span>

            </li>
          ))}
        </ul>
      </section>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button id="search-recipes-btn" className="primary-btn">
          Find Recipes
        </button>
        <button onClick={downloadJSON}>Download JSON</button>
        <button onClick={saveToServer}>Save to Server</button>
      </div>
    </div>
  );
}

export default App;