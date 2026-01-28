import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, 'sample_pest_response.json');
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);

let pestSuggestions = [];
if (data) {
  if (Array.isArray(data.results) && data.results.length > 0) {
    pestSuggestions = data.results.map((r) => ({
      name: r.name || (r.species && r.species.scientificName) || r.common_name || 'Unknown',
      probability: Math.round((r.score || r.probability || 0) * 100),
      details: r
    }));
  } else if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
    pestSuggestions = data.suggestions.map((s) => ({
      name: s.name || s.common_name || 'Unknown',
      probability: Math.round((s.probability || s.score || 0) * 100),
      details: s
    }));
  } else if (data.prediction || data.top) {
    const p = data.prediction || data.top;
    pestSuggestions.push({
      name: p.name || p.label || 'Unknown',
      probability: Math.round((p.score || p.probability || 0) * 100),
      details: p
    });
  }
}

console.log('pestSuggestions:', JSON.stringify(pestSuggestions, null, 2));
if (pestSuggestions.length > 0) {
  const top = pestSuggestions.sort((a, b) => b.probability - a.probability)[0];
  console.log('Top pest:', top);
} else {
  console.log('No suggestions parsed');
}
