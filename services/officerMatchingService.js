import Officer from '../models/Officer.js';

async function matchOfficer({ district, state }) {
  const criteria = { isActive: true };
  const officers = await Officer.find(criteria).lean();

  let best = null;
  let bestScore = -1;

  for (const o of officers) {
    let score = 0;
    if (o.district && district && o.district.toLowerCase() === district.toLowerCase()) score += 3;
    if (o.coverage?.districts?.some(d => d.toLowerCase() === district?.toLowerCase())) score += 2;
    if (o.state && state && o.state.toLowerCase() === state.toLowerCase()) score += 1;
    if (o.coverage?.states?.some(s => s.toLowerCase() === state?.toLowerCase())) score += 1;

    if (score > bestScore) {
      best = o;
      bestScore = score;
    }
  }

  // Fallback: any active officer
  if (!best && officers.length) best = officers[0];
  return best;
}

export { matchOfficer };
