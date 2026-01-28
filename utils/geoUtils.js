// Geographic Utilities and Data

// Center points for districts and major towns in Tamil Nadu
const TAMILNADU_LOCATIONS = {
  'chennai': [13.0837, 80.2702],
  'coimbatore': [11.0018, 76.9628],
  'cuddalore': [11.7564, 79.7635],
  'dharmapuri': [12.1348, 78.1590],
  'dindigul': [10.3656, 77.9693],
  'erode': [11.3306, 77.7277],
  'hosur': [12.7329, 77.8309],
  'kanchipuram': [12.8364, 79.7053],
  'karaikudi': [10.0728, 78.7795],
  'karur': [10.9596, 78.0808],
  'kanyakumari': [8.1880, 77.4290],
  'nagercoil': [8.1880, 77.4290],
  'kumbakonam': [10.9604, 79.3821],
  'madurai': [9.9261, 78.1141],
  'salem': [11.6552, 78.1582],
  'sivakasi': [9.4508, 77.7977],
  'thanjavur': [10.7860, 79.1382],
  'thoothukudi': [8.8053, 78.1453],
  'tiruchirappalli': [10.8071, 78.6881],
  'trichy': [10.8071, 78.6881],
  'tirunelveli': [8.7284, 77.7113],
  'tiruppur': [11.1018, 77.3452],
  'vellore': [12.9072, 79.1310],
  'villupuram': [11.9543, 79.5135],
  'virudhunagar': [9.5680, 77.9624],
  'namakkal': [11.2189, 78.1674],
  'perambalur': [11.2342, 78.8805],
  'pudukkottai': [10.3796, 78.8208],
  'ramanathapuram': [9.3638, 78.8396],
  'sivaganga': [9.8457, 78.4800],
  'theni': [10.0104, 77.4768],
  'thiruvarur': [10.7687, 79.6436],
  'thiruvallur': [13.1430, 79.9074],
  'tiruvannamalai': [12.2330, 79.0667],
  'nilgiris': [11.4116, 76.6976],
  'ooty': [11.4116, 76.6976],
  'nagapattinam': [10.7672, 79.8449],
};

const TAMILNADU_BOUNDS = {
  north: 13.59,
  south: 8.07,
  east: 80.35,
  west: 76.24,
};

const normalizeKey = (value) => (value ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

/**
 * Finds coordinates for a given location query (district/area)
 * @param {...string} locations - List of location names to try
 * @returns {[number, number]|null} [lat, lon] or null
 */
function getCoordinates(...locations) {
  for (const loc of locations) {
    const key = normalizeKey(loc);
    if (!key) continue;
    if (TAMILNADU_LOCATIONS[key]) return [...TAMILNADU_LOCATIONS[key]];
  }
  // Fuzzy search
  for (const loc of locations) {
    const key = normalizeKey(loc);
    if (!key) continue;
    const match = Object.entries(TAMILNADU_LOCATIONS).find(([stored]) => stored.includes(key) || key.includes(stored));
    if (match) return [...match[1]];
  }
  return null;
}

/**
 * Clamps coordinates to Tamil Nadu bounds
 */
function clampToBounds([lat, lon]) {
  return [
    Math.min(Math.max(lat, TAMILNADU_BOUNDS.south), TAMILNADU_BOUNDS.north),
    Math.min(Math.max(lon, TAMILNADU_BOUNDS.west), TAMILNADU_BOUNDS.east)
  ];
}

/**
 * Applies random jitter to coordinates to fuzz exact location
 * @param {[number, number]} coords - Base [lat, lon]
 * @param {number} radiusKm - Max radius in km
 * @returns {[number, number]} New [lat, lon]
 */
function fuzzCoordinates([lat, lon], radiusKm = 2) {
  // 1 deg lat ~ 111km. 1 deg lon ~ 111km * cos(lat)
  const r = radiusKm / 111;
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t) / Math.cos(lat * Math.PI / 180);

  return clampToBounds([lat + x, lon + y]);
}

export {
  getCoordinates,
  fuzzCoordinates,
  TAMILNADU_LOCATIONS
};

