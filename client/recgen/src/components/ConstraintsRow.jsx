import React from 'react';
import styles from './ConstraintsRow.module.css';

export default function ConstraintsRow({ maxTimeMin, setMaxTimeMin, difficulty, setDifficulty }) {
  return (
    <div className={styles.row}>
      <div className={styles.field}>
        <label>Ready in (mins)</label>
        <div className={styles.inputWrapper}>
          <input
            type="number"
            className={styles.input} // Use the specific 'input' class
            min={5}
            max={240}
            value={maxTimeMin}
            onChange={(e) => setMaxTimeMin(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.field}>
        <label>Cooking level</label>
        <div className={styles.inputWrapper}>
          <select 
            className={styles.select} // Use the specific 'select' class
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
      </div>
    </div>
  );
}