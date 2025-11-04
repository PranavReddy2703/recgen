import React from 'react';
import styles from './OptionalFilters.module.css';

export default function OptionalFilters({
  BIG9, DIETS,
  allergens, setAllergens,
  dietary, setDietary
}) {
  const toggle = (value, list, setter) => {
    if (list.includes(value)) setter(list.filter(v => v !== value));
    else setter([...list, value]);
  };

  return (
    <>
      <details className={`${styles.details} ${styles.section}`}>
        <summary>Allergens (optional)</summary>
        <div className={styles.chips}>
          {BIG9.map(a => (
            <button
              type="button"
              key={a}
              onClick={() => toggle(a, allergens, setAllergens)}
              className={`${styles.chip} ${allergens.includes(a) ? styles.active : ''}`}
            >
              {a}
            </button>
          ))}
        </div>
      </details>

      <details className={`${styles.details} ${styles.section}`}>
        <summary>Dietary restrictions (optional)</summary>
        <div className={styles.chips}>
          {DIETS.map(d => (
            <button
              type="button"
              key={d}
              onClick={() => toggle(d, dietary, setDietary)}
              className={`${styles.chip} ${dietary.includes(d) ? styles.active : ''}`}
            >
              {d}
            </button>
          ))}
        </div>
      </details>
    </>
  );
}
