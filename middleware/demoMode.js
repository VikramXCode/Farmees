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
    commodity: 'Rice',
    market: 'Pollachi APMC',
    district: 'Coimbatore',
    min_price: 2750,
    max_price: 2950,
    modal_price: 2850,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Coconut',
    market: 'Pollachi Market',
    district: 'Coimbatore',
    min_price: 18000,
    max_price: 19000,
    modal_price: 18500,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Turmeric',
    market: 'Pollachi',
    district: 'Coimbatore',
    min_price: 12500,
    max_price: 13200,
    modal_price: 12800,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Cotton',
    market: 'Udumalaipettai',
    district: 'Coimbatore',
    min_price: 6200,
    max_price: 6700,
    modal_price: 6450,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Groundnut',
    market: 'Pollachi',
    district: 'Coimbatore',
    min_price: 5800,
    max_price: 6200,
    modal_price: 6000,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Banana',
    market: 'Kinathukadavu',
    district: 'Coimbatore',
    min_price: 1200,
    max_price: 1800,
    modal_price: 1500,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Sugarcane',
    market: 'Pollachi',
    district: 'Coimbatore',
    min_price: 2800,
    max_price: 3200,
    modal_price: 3000,
    price_unit: 'per ton',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Tomato',
    market: 'Coimbatore',
    district: 'Coimbatore',
    min_price: 800,
    max_price: 1200,
    modal_price: 1000,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Onion',
    market: 'Coimbatore',
    district: 'Coimbatore',
    min_price: 1500,
    max_price: 2000,
    modal_price: 1750,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
  },
  {
    commodity: 'Potato',
    market: 'Coimbatore',
    district: 'Coimbatore',
    min_price: 1800,
    max_price: 2200,
    modal_price: 2000,
    price_unit: 'per quintal',
    arrival_date: new Date().toISOString().split('T')[0]
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
    farmer: 'Ravi Kumar',
    location: 'Erode Town, Erode',
    pest: 'Stem Borer',
    severity: 'high',
    probability: 85,
    riskLevel: 'Critical',
    description: 'Heavy stem borer infestation observed in rice fields. Dead hearts visible in 30% of plants. Immediate action required.',
    distance: '2.5 km',
    timestamp: new Date().toISOString(),
    affected_area: '2 acres',
    latitude: 11.3410,
    longitude: 77.7172,
    crop: 'Rice',
    recommendations: ['Apply Cartap Hydrochloride 4G @ 25kg/ha', 'Remove and destroy affected tillers', 'Use pheromone traps']
  },
  {
    id: 'pest-alert-2',
    farmer: 'Selvam K',
    location: 'Bhavani, Erode',
    pest: 'Brown Plant Hopper',
    severity: 'high',
    probability: 78,
    riskLevel: 'High',
    description: 'BPH outbreak reported. Plants showing hopperburn symptoms. Multiple farms affected in 5km radius.',
    distance: '3.8 km',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    affected_area: '5 acres',
    latitude: 11.4500,
    longitude: 77.6833,
    crop: 'Rice',
    recommendations: ['Drain water from fields', 'Apply Imidacloprid 17.8 SL', 'Avoid excess nitrogen fertilizer']
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

const DEMO_USER_LANDS = [
  {
    id: 'user-land-1',
    name: 'North Field Demo',
    currentCrop: 'Rice',
    postalCode: '638001',
    location: { latitude: 11.3410, longitude: 77.7172 }
  },
  {
    id: 'user-land-2',
    name: 'South Paddy Field',
    currentCrop: 'Rice',
    postalCode: '638002',
    location: { latitude: 11.3320, longitude: 77.7250 }
  },
  {
    id: 'user-land-3',
    name: 'West Sugarcane Plot',
    currentCrop: 'Sugarcane',
    postalCode: '638003',
    location: { latitude: 11.3500, longitude: 77.7050 }
  },
  {
    id: 'user-land-4',
    name: 'East Coconut Grove',
    currentCrop: 'Coconut',
    postalCode: '638004',
    location: { latitude: 11.3550, longitude: 77.7350 }
  },
  {
    id: 'user-land-5',
    name: 'Central Vegetable Garden',
    currentCrop: 'Vegetables',
    postalCode: '638005',
    location: { latitude: 11.3380, longitude: 77.7200 }
  },
  {
    id: 'user-land-6',
    name: 'Hill View Banana Farm',
    currentCrop: 'Banana',
    postalCode: '638006',
    location: { latitude: 11.3250, longitude: 77.7400 }
  },
  {
    id: 'user-land-7',
    name: 'River Side Turmeric',
    currentCrop: 'Turmeric',
    postalCode: '638007',
    location: { latitude: 11.3600, longitude: 77.7000 }
  },
  {
    id: 'user-land-8',
    name: 'Groundnut Field',
    currentCrop: 'Groundnut',
    postalCode: '638008',
    location: { latitude: 11.3200, longitude: 77.7150 }
  },
  {
    id: 'user-land-9',
    name: 'Cotton Plantation',
    currentCrop: 'Cotton',
    postalCode: '638009',
    location: { latitude: 11.3450, longitude: 77.6950 }
  },
  {
    id: 'user-land-10',
    name: 'Mixed Crop Field',
    currentCrop: 'Rice',
    postalCode: '638010',
    location: { latitude: 11.3350, longitude: 77.7450 }
  }
];

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
  userLands: DEMO_USER_LANDS,
  farmers: [
    {
      id: 'farmer-1',
      name: 'Ravi Kumar',
      district: 'Erode',
      area: 'Erode Town',
      distance: '2.5 km',
      crops: ['Rice', 'Sugarcane'],
      location: { latitude: 11.3410, longitude: 77.7172 },
      isUserLand: false
    },
    {
      id: 'farmer-2',
      name: 'Selvi Murugan',
      district: 'Erode',
      area: 'Bhavani',
      distance: '5.8 km',
      crops: ['Coconut', 'Banana'],
      location: { latitude: 11.4500, longitude: 77.6833 },
      isUserLand: false
    },
    {
      id: 'farmer-3',
      name: 'Kumar Raj',
      district: 'Erode',
      area: 'Gobichettipalayam',
      distance: '12.3 km',
      crops: ['Cotton', 'Groundnut'],
      location: { latitude: 11.4550, longitude: 77.4400 },
      isUserLand: false
    },
    {
      id: 'farmer-4',
      name: 'Lakshmi Devi',
      district: 'Erode',
      area: 'Perundurai',
      distance: '3.2 km',
      crops: ['Turmeric', 'Ginger'],
      location: { latitude: 11.2750, longitude: 77.5900 },
      isUserLand: false
    },
    {
      id: 'farmer-5',
      name: 'Anand Prakash',
      district: 'Erode',
      area: 'Sathyamangalam',
      distance: '18.5 km',
      crops: ['Tea', 'Coffee'],
      location: { latitude: 11.5050, longitude: 77.2380 },
      isUserLand: false
    },
    {
      id: 'farmer-6',
      name: 'Murugan S',
      district: 'Erode',
      area: 'Modakurichi',
      distance: '6.2 km',
      crops: ['Rice', 'Vegetables'],
      location: { latitude: 11.3200, longitude: 77.8100 },
      isUserLand: false
    },
    {
      id: 'farmer-7',
      name: 'Selvam K',
      district: 'Erode',
      area: 'Erode Town',
      distance: '1.8 km',
      crops: ['Rice', 'Groundnut'],
      location: { latitude: 11.3480, longitude: 77.7250 },
      isUserLand: false
    },
    {
      id: 'farmer-8',
      name: 'Anitha R',
      district: 'Erode',
      area: 'Kodumudi',
      distance: '4.1 km',
      crops: ['Groundnut', 'Sesame'],
      location: { latitude: 11.0770, longitude: 77.8870 },
      isUserLand: false
    },
    {
      id: 'farmer-9',
      name: 'Prakash M',
      district: 'Erode',
      area: 'Anthiyur',
      distance: '15.2 km',
      crops: ['Coconut', 'Arecanut'],
      location: { latitude: 11.5700, longitude: 77.5900 },
      isUserLand: false
    },
    {
      id: 'farmer-10',
      name: 'Devi Lakshmi',
      district: 'Erode',
      area: 'Erode Town',
      distance: '2.9 km',
      crops: ['Rice', 'Banana'],
      location: { latitude: 11.3350, longitude: 77.7100 },
      isUserLand: false
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

export {
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
