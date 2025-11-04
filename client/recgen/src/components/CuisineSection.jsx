import React from 'react';
import styles from './CuisineSection.module.css';

export default function CuisineSection({
  cuisines,
  cuisineA, setCuisineA,
  fusionEnabled, setFusionEnabled,
  cuisineB, setCuisineB
}) {
  const filteredB = cuisines.filter(c => c !== cuisineA);
  return (
    <section className={styles.section}>
      <h3>Cuisine</h3>
      <div className={styles.row}>
        <div>
          <label>Cuisine A</label>
          <select value={cuisineA} onChange={e => setCuisineA(e.target.value)}>
            {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={styles.inline}>
            <input
              type="checkbox"
              checked={fusionEnabled}
              onChange={(e) => setFusionEnabled(e.target.checked)}
            />
            Add fusion cuisine (optional)
          </label>
          {fusionEnabled && (
            <select value={cuisineB} onChange={e => setCuisineB(e.target.value)}>
              <option value="">Select Cuisine B</option>
              {filteredB.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>
    </section>
  );
}
