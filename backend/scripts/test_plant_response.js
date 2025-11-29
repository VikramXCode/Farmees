// Quick test harness to simulate Plant.id v3 response normalization
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, 'sample_plant_v3.json'), 'utf8');
const data = JSON.parse(raw);

function formatTreatment(t) {
  if (!t) return '';
  if (typeof t === 'string') return t;
  if (typeof t === 'object') {
    const parts = [];
    for (const key of Object.keys(t)) {
      const val = t[key];
      if (Array.isArray(val)) parts.push(`${key}: ${val.join(' ')}`);
      else parts.push(`${key}: ${String(val)}`);
    }
    return parts.join('\n');
  }
  return String(t);
}

function normalize(data) {
  let diseaseSuggestions = [];
  let plantSuggestions = [];

  if (data && data.result && data.result.disease && Array.isArray(data.result.disease.suggestions)) {
    diseaseSuggestions = data.result.disease.suggestions.map((sugg) => ({
      diseaseName: sugg.name || (sugg.details && sugg.details.local_name) || 'Unknown disease',
      probability: Math.round((sugg.probability || 0) * 100),
      description: (sugg.details && sugg.details.description) || '',
      treatment: formatTreatment(sugg.details && sugg.details.treatment),
      cause: (sugg.details && sugg.details.cause) || '',
      localNames: (sugg.details && sugg.details.local_name) || (sugg.details && sugg.details.common_names) || [],
      details: sugg
    }));
  } else if (data && data.health_assessment && Array.isArray(data.health_assessment.diseases)) {
    diseaseSuggestions = data.health_assessment.diseases.map((d) => ({
      diseaseName: d.name || (d.classification && d.classification.scientific_name) || 'Unknown disease',
      probability: Math.round((d.probability || 0) * 100),
      description: d.description || d.details || '',
      treatment: formatTreatment(d.treatment || d.details && d.details.treatment),
      cause: d.cause || '',
      localNames: d.local_name || d.common_names || [],
      details: d
    }));
  }

  if (data && Array.isArray(data.suggestions)) {
    plantSuggestions = data.suggestions.map((s) => ({
      name: s.name || s.plant_name || 'Unknown',
      probability: Math.round((s.probability || 0) * 100),
      details: s
    }));
  }

  return { diseaseSuggestions, plantSuggestions };
}

const normalized = normalize(data);
console.log('Normalized:', JSON.stringify(normalized, null, 2));

// Pick top
const diseases = (normalized.diseaseSuggestions || []).slice().sort((a,b) => (b.probability||0)-(a.probability||0));
if (diseases.length>0) console.log('\nTop disease:', JSON.stringify(diseases[0], null, 2));
else {
  const plants = (normalized.plantSuggestions||[]).slice().sort((a,b) => (b.probability||0)-(a.probability||0));
  console.log('\nTop plant:', plants[0] ? JSON.stringify(plants[0], null, 2) : 'none');
}
