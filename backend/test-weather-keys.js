import { getEnvKeys } from './utils/apiKeys.js';
import dotenv from 'dotenv';

dotenv.config();

const keys = getEnvKeys('OPENWEATHER');
console.log('Raw keys count:', keys.length);
console.log('Keys:', keys.map(k => k.slice(0, 6) + '...' + k.slice(-4)));

const isPlaceholder = (k) => /your[_-]?openweather[_-]?key/i.test(k);
const filtered = keys.filter(k => !isPlaceholder(k));

console.log('\nFiltered keys count:', filtered.length);
console.log('Filtered:', filtered.map(k => k.slice(0, 6) + '...' + k.slice(-4)));
console.log('\nKeys are valid:', filtered.length > 0);
