import React, { useState } from 'react';
import IngredientsInput from './components/IngredientsInput';
import ConstraintsRow from './components/ConstraintsRow';
import CuisineSection from './components/CuisineSection';
import OptionalFilters from './components/OptionalFilters';
import RecipeView from './components/RecipeView';
import styles from './App.module.css';

const DEFAULT_CUISINES = [
  'Indian',
  'Italian',
  'Mexican',
  'Chinese',
  'Thai',
  'Japanese',
  'Mediterranean',
  'Middle Eastern',
  'French',
  'American',
  'Korean',
  'Spanish',
];
const BIG9 = [
  'Gluten',
  'Peanuts',
  'Tree nuts',
  'Dairy',
  'Egg',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
];
const DIETS = [
  'Vegan',
  'Vegetarian',
  'Halal',
  'Kosher',
  'Gluten-free',
  'Dairy-free',
];

export default function App() {
  const [ingredients, setIngredients] = useState([]);
  const [maxTimeMin, setMaxTimeMin] = useState(30);
  const [difficulty, setDifficulty] = useState('Beginner');
  const [cuisineA, setCuisineA] = useState('Indian');
  const [fusionEnabled, setFusionEnabled] = useState(false);
  const [cuisineB, setCuisineB] = useState('');
  const [allergens, setAllergens] = useState([]);
  const [dietary, setDietary] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recipeJson, setRecipeJson] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecipeJson(null);
    try {
      const payload = {
        ingredients,
        maxTimeMin: Number(maxTimeMin),
        difficulty,
        allergens,
        dietary,
        cuisineA,
        cuisineB:
          fusionEnabled && cuisineB && cuisineB !== cuisineA ? cuisineB : null,
        servings: 2,
      };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setRecipeJson(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const ingredientConflicts = new Set();
  if (recipeJson?.recipe?.ingredients?.length && allergens.length) {
    recipeJson.recipe.ingredients.forEach((it) => {
      const nm = (it.name || '').toLowerCase();
      allergens.forEach((a) => {
        const al = a.toLowerCase();
        if (nm.includes(al)) ingredientConflicts.add(it.name);
      });
    });
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>RecGen</h1>
      <p className={styles.p}>
        Turn what’s on hand into detailed, safe, and creative recipes.
      </p>

      <form onSubmit={submit} className={styles.grid}>
        <div>
          <div className={styles.card}>
            <IngredientsInput
              ingredients={ingredients}
              setIngredients={setIngredients}
              allergens={allergens}
            />
          </div>

          <div className={styles.card}>
            <ConstraintsRow
              maxTimeMin={maxTimeMin}
              setMaxTimeMin={setMaxTimeMin}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
            />
          </div>

          <div className={styles.card}>
            <CuisineSection
              cuisines={DEFAULT_CUISINES}
              cuisineA={cuisineA}
              setCuisineA={setCuisineA}
              fusionEnabled={fusionEnabled}
              setFusionEnabled={setFusionEnabled}
              cuisineB={cuisineB}
              setCuisineB={setCuisineB}
            />
          </div>

          <div className={styles.card}>
            <OptionalFilters
              BIG9={BIG9}
              DIETS={DIETS}
              allergens={allergens}
              setAllergens={setAllergens}
              dietary={dietary}
              setDietary={setDietary}
            />
          </div>

          <button
            type="submit"
            className={styles.btn}
            disabled={loading || ingredients.length === 0}
          >
            {loading ? 'Generating…' : 'Generate recipe'}
          </button>
          {ingredients.length === 0 && (
            <p className={styles.small} style={{ marginTop: 8 }}>
              Add at least one ingredient to continue.
            </p>
          )}
          {error && <p style={{ color: 'crimson', marginTop: 8 }}>{error}</p>}
        </div>

        <div>
          {!recipeJson ? (
            <div className={styles.preview}>
              <h3>Preview</h3>
              <p>
                Generated recipe will appear here with steps, timers,
                substitutions, nutrition, and safety notes.
              </p>
            </div>
          ) : (
            <RecipeView
              data={recipeJson}
              allergensSelected={allergens}
              ingredientConflicts={ingredientConflicts}
            />
          )}
        </div>
      </form>
    </div>
  );
}
