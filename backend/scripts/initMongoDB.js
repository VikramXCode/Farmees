// MongoDB Initialization Script for FarmEase
const mongoose = require('mongoose');

// Import models
const Land = require('../models/Land');
const AIInteraction = require('../models/AIInteraction');
const LandRecommendation = require('../models/LandRecommendation');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Initialize collections with sample data
const initializeCollections = async () => {
  try {
    // Clear existing data (optional - remove in production)
    await Land.deleteMany({});
    await AIInteraction.deleteMany({});
    await LandRecommendation.deleteMany({});

    // Create sample land data
    const sampleLands = [
      {
        landId: 'land-1',
        userId: 'user-1',
        name: 'North Field',
        location: 'Kochi, Kerala',
        soilType: 'Clay Loam',
        currentCrop: 'Rice',
        waterAvailability: 'high',
        soilReport: {
          pH: 6.5,
          nitrogen: 45,
          phosphorus: 25,
          potassium: 180,
          organicMatter: 2.8,
          moisture: 65,
          texture: 'Clay Loam',
          analysisDate: new Date(),
        },
        weatherHistory: [
          {
            date: new Date(),
            temperature: 28,
            humidity: 75,
            rainfall: 2,
            windSpeed: 8,
            conditions: 'partly_cloudy',
          },
        ],
        cropHistory: [
          {
            cropName: 'Rice',
            plantingDate: new Date('2024-01-15'),
            harvestDate: new Date('2024-04-15'),
            yield: 4500,
            notes: 'Good harvest season',
          },
        ],
        pestDiseaseHistory: [
          {
            date: new Date(),
            type: 'pest',
            name: 'Stem Borer',
            severity: 'low',
            treatment: 'Neem oil spray',
            status: 'resolved',
          },
        ],
        treatmentHistory: [
          {
            date: new Date(),
            type: 'fertilizer',
            product: 'NPK 20:10:10',
            quantity: 50,
            unit: 'kg',
            notes: 'Applied during flowering stage',
          },
        ],
        marketData: [
          {
            cropName: 'Rice',
            currentPrice: 2850,
            priceHistory: [
              {
                date: new Date(),
                price: 2850,
                market: 'Kochi APMC',
              },
            ],
            demand: 'high',
            forecast: {
              nextMonth: 2900,
              nextQuarter: 3000,
            },
          },
        ],
        aiContext: {
          lastInteraction: new Date(),
          commonQuestions: [
            'When should I fertilize?',
            'What pests should I watch for?',
            'How is the weather affecting my crop?',
          ],
          recommendedActions: [
            {
              action: 'Apply nitrogen fertilizer',
              priority: 'high',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
          ],
          preferences: {
            communicationStyle: 'simple',
            focusAreas: ['pest_management', 'fertilization'],
            alertLevel: 'medium',
          },
        },
        isActive: true,
      },
      {
        landId: 'land-2',
        userId: 'user-1',
        name: 'South Field',
        location: 'Thrissur, Kerala',
        soilType: 'Sandy Clay',
        currentCrop: 'Coconut',
        waterAvailability: 'medium',
        soilReport: {
          pH: 7.2,
          nitrogen: 35,
          phosphorus: 30,
          potassium: 220,
          organicMatter: 3.2,
          moisture: 55,
          texture: 'Sandy Clay',
          analysisDate: new Date(),
        },
        weatherHistory: [
          {
            date: new Date(),
            temperature: 30,
            humidity: 70,
            rainfall: 0,
            windSpeed: 12,
            conditions: 'sunny',
          },
        ],
        cropHistory: [
          {
            cropName: 'Coconut',
            plantingDate: new Date('2020-06-01'),
            yield: 1200,
            notes: 'Mature coconut plantation',
          },
        ],
        pestDiseaseHistory: [],
        treatmentHistory: [
          {
            date: new Date(),
            type: 'fertilizer',
            product: 'Potash',
            quantity: 25,
            unit: 'kg',
            notes: 'Applied around palm base',
          },
        ],
        marketData: [
          {
            cropName: 'Coconut',
            currentPrice: 18500,
            priceHistory: [
              {
                date: new Date(),
                price: 18500,
                market: 'Thrissur APMC',
              },
            ],
            demand: 'medium',
            forecast: {
              nextMonth: 19000,
              nextQuarter: 19500,
            },
          },
        ],
        aiContext: {
          lastInteraction: new Date(),
          commonQuestions: [
            'When to harvest coconuts?',
            'How to prevent coconut diseases?',
            'What fertilizer for coconut?',
          ],
          recommendedActions: [
            {
              action: 'Harvest mature coconuts',
              priority: 'medium',
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
          ],
          preferences: {
            communicationStyle: 'detailed',
            focusAreas: ['harvesting', 'disease_prevention'],
            alertLevel: 'low',
          },
        },
        isActive: true,
      },
    ];

    // Insert sample lands
    const createdLands = await Land.insertMany(sampleLands);
    console.log(`Created ${createdLands.length} sample lands`);

    // Create sample AI interactions
    const sampleInteractions = [
      {
        landId: 'land-1',
        userId: 'user-1',
        timestamp: new Date(),
        userMessage: 'When should I fertilize my rice field?',
        aiResponse: 'Based on your soil analysis, apply NPK 20:10:10 fertilizer in the morning when soil moisture is optimal.',
        context: {
          selectedLand: 'North Field',
          weatherData: { temperature: 28, humidity: 75 },
          recentActivities: ['fertilizer'],
        },
      },
      {
        landId: 'land-2',
        userId: 'user-1',
        timestamp: new Date(),
        userMessage: 'How is the weather affecting my coconut plantation?',
        aiResponse: 'Current sunny weather with 30°C temperature is good for coconut growth. Ensure adequate irrigation.',
        context: {
          selectedLand: 'South Field',
          weatherData: { temperature: 30, humidity: 70 },
          recentActivities: ['fertilizer'],
        },
      },
    ];

    const createdInteractions = await AIInteraction.insertMany(sampleInteractions);
    console.log(`Created ${createdInteractions.length} sample AI interactions`);

    // Create sample recommendations
    const sampleRecommendations = [
      {
        landId: 'land-1',
        userId: 'user-1',
        type: 'fertilizer',
        recommendation: 'Apply nitrogen fertilizer for rice growth',
        confidence: 85,
        reasoning: 'Soil nitrogen levels are low (45 ppm)',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
      {
        landId: 'land-2',
        userId: 'user-1',
        type: 'harvest',
        recommendation: 'Harvest mature coconuts',
        confidence: 90,
        reasoning: 'Coconuts are ready for harvest based on age and season',
        priority: 'medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
    ];

    const createdRecommendations = await LandRecommendation.insertMany(sampleRecommendations);
    console.log(`Created ${createdRecommendations.length} sample recommendations`);

    console.log('MongoDB collections initialized successfully!');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await initializeCollections();
  process.exit(0);
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { connectDB, initializeCollections };
