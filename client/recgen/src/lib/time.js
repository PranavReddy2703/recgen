export function parseTimeToMinutes(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.toLowerCase();
  if (s.match(/\d+\s*-\s*\d+/)) {
    const r = parseRange(s);
    return r?.avg ?? null;
  }
  let total = 0;
  const hMatch = s.match(/(\d+)\s*hour/);
  const mMatch = s.match(/(\d+)\s*min/);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  if (mMatch) total += parseInt(mMatch[1], 10);
  if (total > 0) return total;
  const justNum = s.match(/^(\d+)\s*$/);
  if (justNum) return parseInt(justNum[1], 10);
  return null;
}

export function parseRange(str) {
  if (!str || typeof str !== 'string') return null;
  const m = str.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return { min, max, avg: Math.round((min + max) / 2) };
}
