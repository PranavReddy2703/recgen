import React from 'react';
import { copyJsonToClipboard, downloadJson } from '../lib/download';
import { parseTimeToMinutes, parseRange } from '../lib/time';
import styles from './RecipeView.module.css';

export default function RecipeView({ data, allergensSelected = [], ingredientConflicts = new Set() }) {
  const r = data?.recipe;
  if (!r) return null;

  const totalTimeMin =
    typeof r.total_time === 'string' ? parseTimeToMinutes(r.total_time) : null;

  const stepsWithMinutes = (r.instructions || []).map(s => {
    const t = s.timer || '';
    const range = parseRange(t);
    return { ...s, minutesParsed: range?.avg ?? parseTimeToMinutes(t) };
  });

  const cumulative = stepsWithMinutes.reduce((sum, s) => sum + (s.minutesParsed || 0), 0);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2>{r.name}</h2>
        {r.description ? <p>{r.description}</p> : null}
        <p className={styles.meta}>
          <span className={styles.badge}>{r.servings ?? '-'} servings</span>
          <span className={styles.badge}>{r.total_time ?? '-'}</span>
          <span className={styles.badge}>{r.difficulty ?? '-'}</span>
        </p>
      </header>

      <section className={styles.section}>
        <h3>Ingredients</h3>
        <ul className={styles.list}>
          {(r.ingredients || []).map((ing, i) => {
            const conflict = ingredientConflicts.has(ing.name);
            return (
              <li key={i}>
                {ing.quantity ? `${ing.quantity} ` : ''}{ing.name}
                {conflict ? <em style={{ color: '#c00' }}> — allergen conflict</em> : null}
                {ing.substitutions?.length ? (
                  <em style={{ color: '#666' }}> — substitutions: {ing.substitutions.join(', ')}</em>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Instructions</h3>
        {totalTimeMin ? (
          <div className={styles.progress} aria-label="Estimated total step time vs. total time">
            <div className={styles.fill} style={{ width: `${Math.min(100, (cumulative / totalTimeMin) * 100)}%` }} />
          </div>
        ) : null}
        <ol className={styles.list}>
          {stepsWithMinutes.map((s) => (
            <li key={s.step} style={{ marginBottom: 6 }}>
              <input type="checkbox" aria-label={`Mark step ${s.step} done`} />{' '}
              {s.instruction}
              {s.timer ? ` (${s.timer})` : ''}
            </li>
          ))}
        </ol>
      </section>

      {r.safety_notes?.length ? (
        <section className={styles.section}>
          <h3>Safety notes</h3>
          <ul className={styles.list}>{r.safety_notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </section>
      ) : null}

      {r.nutrition ? (
        <section className={styles.section}>
          <h3>Nutrition</h3>
          <p className={styles.meta}>
            {r.nutrition.calories != null ? `${r.nutrition.calories} kcal` : '—'} •{' '}
            {r.nutrition.protein ?? '—'} protein • {r.nutrition.carbohydrates ?? '—'} carbs •{' '}
            {r.nutrition.fat ?? '—'} fat • {r.nutrition.fiber ?? '—'} fiber
          </p>
        </section>
      ) : null}

      {r.gaps_to_buy?.length ? (
        <section className={styles.section}>
          <h3>Gaps to buy</h3>
          <ul className={styles.list}>{r.gaps_to_buy.map((g, i) => <li key={i}>{g}</li>)}</ul>
        </section>
      ) : null}

      {r.dietary_tags?.length ? (
        <section className={styles.section}>
          <h3>Dietary</h3>
          <div className={styles.chips}>
            {r.dietary_tags.map((tag, i) => (
              <span key={i} className={styles.chip}>{tag}</span>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.toolbar}>
        <button type="button" className={styles.btn} onClick={() => copyJsonToClipboard(data)}>Copy JSON</button>
        <button
          type="button"
          className={styles.btn}
          onClick={() => downloadJson(data, (r.name || 'recipe').replace(/\s+/g,'_') + '.json')}
        >
          Download JSON
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => window.print()}>
          Print
        </button>
      </section>
    </article>
  );
}
