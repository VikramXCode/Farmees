// Demo Mode Middleware
// Detects if user is a demo user and injects demo data

const DEMO_WEATHER = {
  success: true,
  weather: {
    location: 'Pollachi, Coimbatore',
    coordinates: { lat: 10.6593, lon: 77.0068 },
    current: {
      temperature: 28,
      feelsLike: 30,
      humidity: 75,
      pressure: 1012,
      windSpeed: 8,
      windDirection: 180,
      visibility: 10000,
      uvIndex: 6,
      condition: 'Clouds',
      description: 'Partly cloudy',
      icon: '03d',
      cloudiness: 40,
      sunrise: new Date().toISOString(),
      sunset: new Date().toISOString(),
      timestamp: new Date().toISOString()
    }
  },
  metadata: { keyUsed: 'demo', timestamp: new Date().toISOString() }
};

const DEMO_MARKET_DATA = [
  {
    crop: 'Rice',
    market: 'Pollachi APMC',
    district: 'Coimbatore',
    currentPrice: 2850,
    previousPrice: 2800,
    trend: 'up',
    change: '+1.8%',
    demand: 'high',
    forecast: 'Price expected to rise',
    volume: 1250,
    avgPrice: 2825,
    priceHistory: [2750, 2780, 2800, 2825, 2850]
  },
  {
    crop: 'Coconut',
    market: 'Pollachi Market',
    district: 'Coimbatore',
    currentPrice: 18500,
    previousPrice: 19200,
    trend: 'down',
    change: '-3.6%',
    demand: 'medium',
    forecast: 'Stable expected',
    volume: 850,
    avgPrice: 18800,
    priceHistory: [19500, 19200, 19000, 18700, 18500]
  }
];

const DEMO_CROP_RECOMMENDATION = {
  success: true,
  recommendation: `Based on your soil analysis and current market conditions in Pollachi, here are my recommendations:

**Recommended Crops:**

1. **Rice (Paddy)** - HIGHLY SUITABLE
   - Your clay loam soil with pH 6.8 is ideal
   - High water availability matches crop needs
   - Current market price: ₹2,850/quintal (trending up)
   - Expected yield: 4-5 tonnes/hectare

2. **Sugarcane** - SUITABLE
   - Good for your soil type
   - Requires consistent water (you have high availability)
   - Market demand is steady
   - Long-term crop (12-14 months)

3. **Cotton** - MODERATELY SUITABLE
   - Clay loam supports cotton well
   - Current market conditions favorable
   - Requires pest management attention

**Soil Improvement Tips:**
- Your nitrogen level (55 ppm) is adequate
- Phosphorus (28 ppm) and Potassium (210 ppm) are excellent
- Maintain organic matter through composting

**Next Steps:**
1. If continuing with rice, prepare land in next 2 weeks
2. Apply basal fertilizer (NPK 20:10:10) before sowing
3. Monitor weather for optimal planting window`,
  landData: { id: 'demo-land-1', name: 'North Field Demo' },
  soilData: { ph: 6.8, nitrogen: 55, phosphorus: 28, potassium: 210 },
  metadata: { keyUsed: 'demo', model: 'demo-ai', timestamp: new Date().toISOString() }
};

const DEMO_DISEASE_ANALYSIS = {
  diseaseSuggestions: [
    {
      diseaseName: 'Brown Spot (Bipolaris oryzae)',
      probability: 0.82,
      symptoms: ['Brown oval spots on leaves', 'Yellow halo around spots', 'Leaf wilting'],
      treatment: [
        'Apply Mancozeb 75% WP @ 2g/liter',
        'Ensure proper drainage',
        'Remove infected leaves',
        'Spray at 10-day intervals'
      ],
      prevention: [
        'Use disease-resistant varieties',
        'Maintain proper spacing',
        'Avoid excess nitrogen',
        'Ensure good air circulation'
      ]
    }
  ],
  plantSuggestions: [
    { name: 'Rice (Oryza sativa)', probability: 0.95, description: 'Paddy plant' }
  ]
};

const DEMO_AI_CHAT_RESPONSES = [
  {
    question: 'irrigation',
    response: `For your rice field with high water availability, here's my irrigation advice:

**Current Stage Irrigation:**
- Rice needs standing water of 5-7 cm during vegetative stage
- Maintain consistent water level during flowering
- Drain 10 days before harvest

**Water Management:**
- Your clay loam soil retains water well
- Check water level daily in morning
- Ensure proper field bunding to prevent leakage

**Best Practices:**
- Use alternate wetting and drying (AWD) to save 25% water
- Monitor for pests in standing water
- Maintain drainage channels around field`
  },
  {
    question: 'pest',
    response: `Common rice pests in Pollachi region and management:

**Stem Borer (Major threat):**
- Symptoms: Dead heart, white ear head
- Control: Pheromone traps, Chlorpyriphos 20% EC
- Apply at tillering stage

**Brown Plant Hopper:**
- Symptoms: Hopperburn, yellowing
- Control: Imidacloprid 200 SL @ 0.5 ml/liter
- Monitor field edges regularly

**Leaf Folder:**
- Symptoms: Folded leaves, feeding marks
- Control: Neem oil spray, Cartap hydrochloride

**Prevention:**
- Remove alternate hosts near field
- Maintain proper spacing
- Use light traps at night`
  },
  {
    question: 'fertilizer',
    response: `Fertilizer schedule for your rice field:

**Basal Application (Before sowing):**
- Urea: 50 kg/acre
- DAP: 100 kg/acre
- Potash: 25 kg/acre
- Zinc Sulphate: 10 kg/acre

**Top Dressing:**
Week 3: Urea 50 kg/acre
Week 6: Urea 50 kg/acre
Week 9: Complex fertilizer 50 kg/acre

**Organic Additions:**
- Farmyard manure: 5 tonnes/acre before planting
- Green manure: Dhaincha cultivation recommended

**Your Soil Status:**
- N: 55 ppm (Good) - Reduce urea by 20%
- P: 28 ppm (Excellent) - Reduce DAP
- K: 210 ppm (Excellent) - Potash sufficient`
  }
];

const DEMO_PEST_ALERTS = [
  {
    id: 'pest-alert-1',
    type: 'warning',
    title: 'Stem Borer Activity Detected',
    description: 'High stem borer activity reported in Pollachi region. Immediate preventive action recommended.',
    severity: 'high',
    crop: 'Rice',
    location: 'Pollachi, Coimbatore',
    reportedDate: new Date().toISOString(),
    actionRequired: 'Install pheromone traps, monitor daily',
    affectedArea: '15km radius'
  },
  {
    id: 'pest-alert-2',
    type: 'info',
    title: 'Brown Plant Hopper - Low Risk',
    description: 'Minimal BPH activity. Continue regular monitoring.',
    severity: 'low',
    crop: 'Rice',
    location: 'Coimbatore district',
    reportedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    actionRequired: 'Weekly monitoring sufficient',
    affectedArea: '30km radius'
  }
];

const DEMO_SOIL_REPORT = {
  success: true,
  report: {
    landId: 'demo-land-1',
    pH: 6.8,
    nitrogen: 55,
    phosphorus: 28,
    potassium: 210,
    organicMatter: 3.2,
    moisture: 68,
    texture: 'Clay Loam',
    analysisDate: new Date().toISOString(),
    recommendations: [
      'Soil pH is optimal for rice cultivation',
      'Nitrogen levels are adequate - reduce urea application by 20%',
      'Excellent phosphorus and potassium levels',
      'High organic matter content - continue composting practices',
      'Good moisture retention - ideal for paddy'
    ],
    nutrients: {
      macronutrients: {
        nitrogen: { value: 55, unit: 'ppm', status: 'adequate', ideal: '40-60 ppm' },
        phosphorus: { value: 28, unit: 'ppm', status: 'excellent', ideal: '15-25 ppm' },
        potassium: { value: 210, unit: 'ppm', status: 'excellent', ideal: '150-200 ppm' }
      },
      micronutrients: {
        iron: { value: 4.5, unit: 'ppm', status: 'adequate' },
        zinc: { value: 0.8, unit: 'ppm', status: 'adequate' },
        copper: { value: 0.3, unit: 'ppm', status: 'adequate' }
      }
    }
  }
};

const DEMO_CONNECT_DATA = {
  officers: [
    {
      id: 'officer-1',
      name: 'Dr. Murugan',
      designation: 'Agricultural Officer',
      department: 'Department of Agriculture',
      district: 'Coimbatore',
      phone: '9876543210',
      email: 'murugan.agri@tn.gov.in',
      specialization: ['Crop Management', 'Soil Health'],
      availability: 'Mon-Fri, 9 AM - 5 PM'
    },
    {
      id: 'officer-2',
      name: 'Mrs. Lakshmi Priya',
      designation: 'Horticulture Officer',
      department: 'Horticulture Department',
      district: 'Coimbatore',
      phone: '9876543211',
      email: 'lakshmi.horti@tn.gov.in',
      specialization: ['Pest Management', 'Organic Farming'],
      availability: 'Mon-Sat, 9 AM - 4 PM'
    }
  ],
  experts: [
    {
      id: 'expert-1',
      name: 'Prof. Selvam',
      institution: 'Tamil Nadu Agricultural University',
      specialization: 'Rice Cultivation',
      consultationFee: 'Free for farmers',
      contact: '0422-6611200'
    }
  ],
  farmers: [
    {
      id: 'farmer-1',
      name: 'Ravi Kumar',
      district: 'Coimbatore',
      area: 'Pollachi',
      distance: '2.5 km',
      crops: ['Rice', 'Sugarcane'],
      location: { latitude: 10.6693, longitude: 77.0168 }
    },
    {
      id: 'farmer-2',
      name: 'Selvi Murugan',
      district: 'Coimbatore',
      area: 'Kinathukadavu',
      distance: '5.8 km',
      crops: ['Coconut', 'Banana'],
      location: { latitude: 10.7793, longitude: 77.0368 }
    },
    {
      id: 'farmer-3',
      name: 'Kumar Raj',
      district: 'Coimbatore',
      area: 'Udumalaipettai',
      distance: '12.3 km',
      crops: ['Cotton', 'Groundnut'],
      location: { latitude: 10.5893, longitude: 77.2468 }
    },
    {
      id: 'farmer-4',
      name: 'Lakshmi Devi',
      district: 'Coimbatore',
      area: 'Pollachi',
      distance: '3.2 km',
      crops: ['Turmeric', 'Ginger'],
      location: { latitude: 10.6493, longitude: 76.9968 }
    },
    {
      id: 'farmer-5',
      name: 'Anand Prakash',
      district: 'Coimbatore',
      area: 'Anaimalai',
      distance: '18.5 km',
      crops: ['Tea', 'Coffee'],
      location: { latitude: 10.5293, longitude: 76.9368 }
    }
  ]
};

function isDemoUser(req) {
  return req.user && req.user.isDemo === true;
}

function demoModeMiddleware(req, res, next) {
  // Check if user is demo user via header or request body
  const isDemoHeader = req.headers['x-demo-mode'] === 'true';
  const isDemoBody = req.body && req.body.isDemo === true;
  
  if (isDemoHeader || isDemoBody || (req.user && req.user.isDemo === true)) {
    req.isDemo = true;
    req.demoData = {
      weather: DEMO_WEATHER,
      market: DEMO_MARKET_DATA,
      recommendation: DEMO_CROP_RECOMMENDATION,
      disease: DEMO_DISEASE_ANALYSIS,
      aiChat: DEMO_AI_CHAT_RESPONSES,
      pestAlerts: DEMO_PEST_ALERTS,
      soilReport: DEMO_SOIL_REPORT,
      connect: DEMO_CONNECT_DATA
    };
  } else {
    req.isDemo = false;
  }
  next();
}

// Helper to attach user to request (call after authentication)
function attachDemoFlag(req, user) {
  if (user && user.isDemo) {
    req.user = user;
    req.isDemo = true;
  }
}

module.exports = {
  demoModeMiddleware,
  attachDemoFlag,
  isDemoUser,
  DEMO_WEATHER,
  DEMO_MARKET_DATA,
  DEMO_CROP_RECOMMENDATION,
  DEMO_DISEASE_ANALYSIS,
  DEMO_AI_CHAT_RESPONSES,
  DEMO_PEST_ALERTS,
  DEMO_SOIL_REPORT,
  DEMO_CONNECT_DATA
};
