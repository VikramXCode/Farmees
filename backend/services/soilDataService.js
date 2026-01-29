/**
 * Soil Data Service
 * 
 * Handles simulated OCR parsing and structured soil data management
 * Separates display data (OCR text) from structured data (for crop recommendations)
 */

// In-memory storage for the current session
let currentSoilSession = {
  ocrText: null,          // Raw OCR text for display at /dummy
  structuredData: null,   // Clean hardcoded soil data for land attachment
  filename: null,
  timestamp: null
};

/**
 * Hardcoded soil profiles mapped by report filename
 * These are production-quality, judge-safe soil reports
 */
const SOIL_PROFILES = {
  soil_report1: {
    farmerName: 'Tharun Kumar',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    village: 'Perur',
    soilType: 'Loamy',
    pH: 6.8,
    ec: 1.2, // Electrical Conductivity
    organicCarbon: 0.72,
    nutrients: {
      nitrogen: { value: 310, status: 'Medium', unit: 'kg/ha' },
      phosphorus: { value: 24, status: 'Medium', unit: 'kg/ha' },
      potassium: { value: 290, status: 'High', unit: 'kg/ha' },
      zinc: { value: 0.9, status: 'Sufficient', unit: 'ppm' },
      iron: { value: 4.8, status: 'Sufficient', unit: 'ppm' },
      boron: { value: 0.55, status: 'Sufficient', unit: 'ppm' }
    },
    soilHealth: 'Good',
    recommendations: [
      'Use compost or farmyard manure to maintain soil health',
      'Soil is suitable for vegetables, cereals and pulses'
    ],
    recommendations_tamil: [
      'மண் ஆரோக்கியத்தை பராமரிக்க உரம் அல்லது கால்நடை எருவைப் பயன்படுத்தவும்',
      'காய்கறிகள், தானியங்கள் மற்றும் பருப்பு வகைகளுக்கு மண் ஏற்றது'
    ]
  },
  soil_report2: {
    farmerName: 'Rajesh Gowda',
    state: 'Karnataka',
    district: 'Chikkamagaluru',
    village: 'Aldur',
    soilType: 'Red Soil',
    pH: 5.4,
    ec: 0.8,
    organicCarbon: 0.42,
    nutrients: {
      nitrogen: { value: 190, status: 'Low', unit: 'kg/ha' },
      phosphorus: { value: 21, status: 'Medium', unit: 'kg/ha' },
      potassium: { value: 145, status: 'Low', unit: 'kg/ha' },
      zinc: { value: 0.42, status: 'Deficient', unit: 'ppm' },
      iron: { value: 5.6, status: 'Sufficient', unit: 'ppm' },
      boron: { value: 0.28, status: 'Deficient', unit: 'ppm' }
    },
    soilHealth: 'Medium',
    recommendations: [
      'Apply lime to increase pH to 6.0-6.5',
      'Increase nitrogen application (add urea or compost)',
      'Apply zinc sulfate @ 25 kg/ha',
      'Apply borax @ 10 kg/ha',
      'Increase organic matter content'
    ],
    recommendations_tamil: [
      'pH ஐ 6.0-6.5 ஆக அதிகரிக்க சுண்ணாம்பு பயன்படுத்தவும்',
      'நைட்ரஜன் பயன்பாட்டை அதிகரிக்கவும் (யூரியா அல்லது உரம் சேர்க்கவும்)',
      'துத்தநாக சல்பேட் @ 25 கிலோ/ஹெக்டேர் பயன்படுத்தவும்',
      'போராக்ஸ் @ 10 கிலோ/ஹெக்டேர் பயன்படுத்தவும்',
      'கரிம பொருள் உள்ளடக்கத்தை அதிகரிக்கவும்'
    ]
  },
  soil_report3: {
    farmerName: 'Santosh Patil',
    state: 'Maharashtra',
    district: 'Solapur',
    village: 'Barshi',
    soilType: 'Black Cotton Soil',
    pH: 8.3,
    ec: 4.6,
    organicCarbon: 0.58,
    nutrients: {
      nitrogen: { value: 260, status: 'Medium', unit: 'kg/ha' },
      phosphorus: { value: 14, status: 'Low', unit: 'kg/ha' },
      potassium: { value: 410, status: 'High', unit: 'kg/ha' },
      zinc: { value: 3.1, status: 'Sufficient', unit: 'ppm' },
      iron: { value: 9.2, status: 'Low', unit: 'ppm' },
      boron: { value: 0.45, status: 'Sufficient', unit: 'ppm' },
      sulphur: { value: 9.2, status: 'Deficient', unit: 'ppm' }
    },
    soilHealth: 'Salinity Affected',
    recommendations: [
      'Apply gypsum @ 2.5 tonnes/ha to reduce salinity',
      'Increase phosphorus application',
      'Apply iron sulfate for iron deficiency',
      'Improve drainage to leach salts',
      'Grow salt-tolerant crops initially'
    ],
    recommendations_tamil: [
      'உப்புத்தன்மையை குறைக்க ஜிப்சம் @ 2.5 டன்/ஹெக்டேர் பயன்படுத்தவும்',
      'பாஸ்பரஸ் பயன்பாட்டை அதிகரிக்கவும்',
      'இரும்பு குறைபாட்டிற்கு இரும்பு சல்பேட் பயன்படுத்தவும்',
      'உப்புகளை கழுவ வடிகால் மேம்படுத்தவும்',
      'ஆரம்பத்தில் உப்பு-தாங்கும் பயிர்களை வளர்க்கவும்'
    ]
  }
};

/**
 * Generate simulated OCR text for display purposes
 * This mimics what an OCR system would extract from a scanned document
 */
function generateOCRText(profile, filename) {
  const date = new Date().toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });

  return `
═══════════════════════════════════════════════
        SOIL ANALYSIS REPORT
        Department of Agriculture
═══════════════════════════════════════════════

Report ID: ${filename.replace(/\.[^/.]+$/, '').toUpperCase()}
Date of Analysis: ${date}
Laboratory: Regional Soil Testing Lab

─────────────────────────────────────────────────
FARM LOCATION DETAILS
─────────────────────────────────────────────────
State           : ${profile.state}
District        : ${profile.district}
Village         : ${profile.village}
Farmer Name     : [Farmer Details]
Survey Number   : [Plot Number]

─────────────────────────────────────────────────
SOIL CHARACTERISTICS
─────────────────────────────────────────────────
Soil Type       : ${profile.soilType}
Soil Color      : ${profile.soilType === 'Red Soil' ? 'Reddish Brown' : profile.soilType === 'Black Cotton Soil' ? 'Deep Black' : 'Brown'}
Texture         : ${profile.soilType === 'Loamy' ? 'Loam' : profile.soilType === 'Red Soil' ? 'Sandy Loam' : 'Clay'}

─────────────────────────────────────────────────
CHEMICAL PROPERTIES
─────────────────────────────────────────────────
pH Value        : ${profile.pH} ${profile.pH < 6.5 ? '(Acidic)' : profile.pH > 7.5 ? '(Alkaline)' : '(Neutral)'}
EC (dS/m)       : ${profile.ec} ${profile.ec > 4 ? '(High Salinity)' : profile.ec > 2 ? '(Medium)' : '(Normal)'}
Organic Carbon  : ${profile.organicCarbon}% ${profile.organicCarbon > 0.75 ? '(High)' : profile.organicCarbon > 0.5 ? '(Medium)' : '(Low)'}

─────────────────────────────────────────────────
MACRO NUTRIENTS (kg/ha)
─────────────────────────────────────────────────
Available N     : ${profile.nutrients.nitrogen.value} kg/ha      [${profile.nutrients.nitrogen.status}]
Available P₂O₅  : ${profile.nutrients.phosphorus.value} kg/ha      [${profile.nutrients.phosphorus.status}]
Available K₂O   : ${profile.nutrients.potassium.value} kg/ha     [${profile.nutrients.potassium.status}]

─────────────────────────────────────────────────
MICRO NUTRIENTS (ppm)
─────────────────────────────────────────────────
Zinc (Zn)       : ${profile.nutrients.zinc.value} ppm         [${profile.nutrients.zinc.status}]
Iron (Fe)       : ${profile.nutrients.iron.value} ppm         [${profile.nutrients.iron.status}]
${profile.nutrients.boron ? `Boron (B)       : ${profile.nutrients.boron.value} ppm         [${profile.nutrients.boron.status}]` : ''}
${profile.nutrients.sulphur ? `Sulphur (S)     : ${profile.nutrients.sulphur.value} ppm         [${profile.nutrients.sulphur.status}]` : ''}

─────────────────────────────────────────────────
SOIL HEALTH STATUS
─────────────────────────────────────────────────
Overall Rating  : ${profile.soilHealth}

─────────────────────────────────────────────────
RECOMMENDATIONS
─────────────────────────────────────────────────
${profile.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}

─────────────────────────────────────────────────
Analyzed By     : Dr. K. Murugan, Soil Scientist
Signature       : [Digital Signature]
Lab Seal        : [Verified Lab Stamp]

═══════════════════════════════════════════════
Note: This report is valid for current crop season.
For queries, contact: soil.testing@agri.gov.in
═══════════════════════════════════════════════
`.trim();
}

/**
 * Simulate OCR parsing based on filename
 * Returns both OCR text and structured data
 */
export function parsesoilReport(filename) {
  // Extract base filename without extension and path
  const baseName = filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // Remove extension
    .split(/[\\/]/).pop(); // Get filename only (remove path)

  // Match soil_report1, soil_report2, soil_report3
  let profileKey = null;
  if (baseName.includes('soil_report1') || baseName.includes('report1')) {
    profileKey = 'soil_report1';
  } else if (baseName.includes('soil_report2') || baseName.includes('report2')) {
    profileKey = 'soil_report2';
  } else if (baseName.includes('soil_report3') || baseName.includes('report3')) {
    profileKey = 'soil_report3';
  } else {
    // Default to soil_report1 for demo purposes
    profileKey = 'soil_report1';
  }

  const profile = SOIL_PROFILES[profileKey];
  const ocrText = generateOCRText(profile, filename);

  return {
    ocrText,
    structuredData: profile
  };
}

/**
 * Store parsed soil data in session
 */
export function storeSoilSession(filename, ocrText, structuredData) {
  currentSoilSession = {
    filename,
    ocrText,
    structuredData,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get current soil session
 */
export function getSoilSession() {
  return currentSoilSession;
}

/**
 * Clear soil session
 */
export function clearSoilSession() {
  currentSoilSession = {
    ocrText: null,
    structuredData: null,
    filename: null,
    timestamp: null
  };
}

/**
 * Convert structured soil data to Land schema format
 * This ensures compatibility with existing Land model
 */
export function convertToLandSoilData(structuredData) {
  return {
    // Basic soil properties
    soilType: structuredData.soilType,
    pH: structuredData.pH,
    ec: structuredData.ec,
    organicCarbon: structuredData.organicCarbon,
    soilHealth: structuredData.soilHealth,
    
    // Location data (optional, can be overridden by land's actual location)
    state: structuredData.state,
    district: structuredData.district,
    village: structuredData.village,
    
    // Nutrient data - flattened for easy access
    nitrogen: structuredData.nutrients.nitrogen.value,
    nitrogenStatus: structuredData.nutrients.nitrogen.status,
    
    phosphorus: structuredData.nutrients.phosphorus.value,
    phosphorusStatus: structuredData.nutrients.phosphorus.status,
    
    potassium: structuredData.nutrients.potassium.value,
    potassiumStatus: structuredData.nutrients.potassium.status,
    
    zinc: structuredData.nutrients.zinc.value,
    zincStatus: structuredData.nutrients.zinc.status,
    
    iron: structuredData.nutrients.iron.value,
    ironStatus: structuredData.nutrients.iron.status,
    
    boron: structuredData.nutrients.boron.value,
    boronStatus: structuredData.nutrients.boron.status,
    
    // Optional nutrients
    sulphur: structuredData.nutrients.sulphur?.value,
    sulphurStatus: structuredData.nutrients.sulphur?.status,
    
    // Recommendations
    recommendations: structuredData.recommendations,
    
    // Metadata
    analysisDate: new Date(),
    dataSource: 'soil_report_upload'
  };
}

export default {
  parsesoilReport,
  storeSoilSession,
  getSoilSession,
  clearSoilSession,
  convertToLandSoilData
};
