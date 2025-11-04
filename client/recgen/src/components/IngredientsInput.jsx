import React, { useState } from 'react';
import styles from './IngredientsInput.module.css';

export default function IngredientsInput({ ingredients, setIngredients, allergens }) {
  const [input, setInput] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');

  const add = () => {
    const name = input.trim();
    if (!name) return;
    const item = { name };
    if (qty) item.quantity = qty;
    if (unit) item.unit = unit;
    setIngredients(prev => [...prev, item]);
    setInput('');
    setQty('');
    setUnit('');
  };

  const remove = (idx) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <section className={styles.section}>
      <h3>Ingredients on hand</h3>
      <div className={styles.row}>
        <input
          placeholder="e.g., chicken breast"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <input
          placeholder="qty (optional)"
          value={qty}
          onChange={e => setQty(e.target.value)}
        />
        <input
          placeholder="unit (optional)"
          value={unit}
          onChange={e => setUnit(e.target.value)}
        />
        <button type="button" className={styles.btnSecondary} onClick={add}>Add</button>
      </div>

      <div className={styles.pills}>
        {ingredients.map((ing, idx) => {
          const conflict = allergens?.some(a => (ing.name || '').toLowerCase().includes(a.toLowerCase()));
          return (
            <span key={idx} className={`${styles.pill} ${conflict ? styles.conflict : ''}`}>
              {ing.quantity ? `${ing.quantity} ` : ''}{ing.unit ? `${(ing.unit)} ` : ''}{ing.name}
              {conflict ? <em style={{ color: '#c00', marginLeft: 6 }}>(conflict)</em> : null}
              <button type="button" className={styles.remove} onClick={() => remove(idx)} aria-label="remove">×</button>
            </span>
          );
        })}
      </div>
    </section>
  );
}
