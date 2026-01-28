function getEnvKeys(base) {
  const keys = [];
  const csv = process.env[`${base}_API_KEYS`];
  if (csv) {
    for (const k of csv.split(',').map(s => s.trim()).filter(Boolean)) keys.push(k);
  }
  // Indexed variants e.g. PLANT_ID_API_KEY_1, _2, ...
  for (let i = 1; i <= 20; i++) {
    const v = process.env[`${base}_API_KEY_${i}`];
    if (v && v.trim()) keys.push(v.trim());
  }
  // Single key fallback e.g. PLANT_ID_API_KEY (also allow comma-separated here)
  const single = process.env[`${base}_API_KEY`];
  if (single && single.trim()) {
    const val = single.trim();
    if (val.includes(',')) {
      for (const k of val.split(',').map(s => s.trim()).filter(Boolean)) keys.push(k);
    } else {
      keys.push(val);
    }
  }

  // De-duplicate while preserving order
  const seen = new Set();
  return keys.filter(k => (seen.has(k) ? false : (seen.add(k), true)));
}

function shouldRotate(status, bodyText = '') {
  const s = Number(status) || 0;
  const t = String(bodyText || '').toLowerCase();
  if ([401, 403, 429, 402].includes(s)) return true;
  return (
    t.includes('rate limit') ||
    t.includes('quota') ||
    t.includes('exceed') ||
    t.includes('exceeded') ||
    t.includes('limit') ||
    t.includes('billing') ||
    t.includes('usage cap') ||
    t.includes('too many requests')
  );
}

module.exports = { getEnvKeys, shouldRotate };
