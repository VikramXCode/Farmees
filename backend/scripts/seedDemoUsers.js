// Seed Demo Users for Hackathon Demo
const mongoose = require('mongoose');
const User = require('../models/User');
const Land = require('../models/Land');
const Coordinator = require('../models/Coordinator');
const Worker = require('../models/Worker');
const LabourRequest = require('../models/LabourRequest');

require('dotenv').config();

const DEMO_USERS = [
  {
    name: 'Demo Farmer',
    phone: '9999000001',
    password: 'demo123',
    role: 'farmer',
    isDemo: true,
    district: 'Coimbatore',
    area: 'Pollachi'
  },
  {
    name: 'Demo Coordinator',
    phone: '9999000002', 
    password: 'demo123',
    role: 'coordinator',
    isDemo: true,
    district: 'Coimbatore',
    area: 'Pollachi'
  },
  {
    name: 'Demo Worker',
    phone: '9999000003',
    password: 'demo123',
    role: 'worker',
    isDemo: true,
    district: 'Coimbatore',
    area: 'Pollachi'
  }
];

const DEMO_LANDS = [
  {
    landId: 'demo-land-1',
    userId: null, // Will be set after user creation
    name: 'North Field Demo',
    location: 'Pollachi, Coimbatore',
    soilType: 'Clay Loam',
    currentCrop: 'Rice',
    waterAvailability: 'high',
    size: 2.5,
    isDemo: true,
    soilReport: {
      pH: 6.8,
      nitrogen: 55,
      phosphorus: 28,
      potassium: 210,
      organicMatter: 3.2,
      moisture: 68,
      texture: 'Clay Loam',
      analysisDate: new Date().toISOString()
    },
    weatherHistory: [
      {
        date: new Date().toISOString(),
        temperature: 28,
        humidity: 75,
        rainfall: 2,
        windSpeed: 8,
        conditions: 'partly_cloudy'
      }
    ],
    cropHistory: [
      {
        cropName: 'Rice',
        plantingDate: '2024-11-15',
        harvestDate: '2025-02-15',
        yield: 4500,
        notes: 'Good harvest season'
      }
    ],
    pestDiseaseHistory: [],
    treatmentHistory: [
      {
        date: new Date().toISOString(),
        type: 'fertilizer',
        product: 'NPK 20:10:10',
        quantity: 50,
        unit: 'kg',
        notes: 'Applied during growth stage'
      }
    ],
    marketData: [
      {
        cropName: 'Rice',
        currentPrice: 2850,
        priceHistory: [
          { date: new Date().toISOString(), price: 2850, market: 'Pollachi APMC' }
        ],
        demand: 'high',
        forecast: { nextMonth: 2900, nextQuarter: 3000 }
      }
    ],
    aiContext: {
      lastInteraction: new Date().toISOString(),
      commonQuestions: [],
      recommendedActions: [],
      preferences: {
        communicationStyle: 'simple',
        focusAreas: ['pest_management', 'irrigation'],
        alertLevel: 'medium'
      }
    },
    isActive: true
  }
];

async function seedDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease');
    console.log('✓ Connected to MongoDB');

    // Clear demo data (preserve demo users so their _id stays stable across reseeds)
    await LabourRequest.deleteMany({ isDemo: true });
    await Land.deleteMany({ isDemo: true });
    await Coordinator.deleteMany({ isDemo: true });
    await Worker.deleteMany({ isDemo: true });
    console.log('✓ Cleared existing demo data (preserved demo users)');

    // Upsert demo users by phone (keeps the same _id if they already exist)
    const createdUsers = [];
    for (const userData of DEMO_USERS) {
      let user = await User.findOne({ phone: userData.phone });
      if (!user) {
        user = new User(userData);
      } else {
        user.name = userData.name;
        user.phone = userData.phone;
        user.role = userData.role;
        user.isDemo = true;
        user.district = userData.district;
        user.area = userData.area;
        // Keep demo credentials consistent
        user.password = userData.password;
      }
      await user.save();
      createdUsers.push(user);
      console.log(`✓ Upserted demo user: ${user.name} (${user.phone})`);
    }

    // Find demo farmer
    const demoFarmer = createdUsers.find(u => u.role === 'farmer' && u.phone === '9999000001');
    
    // Create demo lands for farmer
    if (demoFarmer) {
      for (const landData of DEMO_LANDS) {
        landData.userId = demoFarmer._id.toString();
        const land = new Land(landData);
        await land.save();
        console.log(`✓ Created demo land: ${land.name}`);
      }
    }

    // Create demo coordinator profile
    const demoCoordinator = createdUsers.find(u => u.phone === '9999000002');
    if (demoCoordinator) {
      const coordinator = new Coordinator({
        userId: demoCoordinator._id.toString(),
        name: demoCoordinator.name,
        phone: demoCoordinator.phone,
        location: {
          district: 'Coimbatore',
          area: 'Pollachi',
          coordinates: { lat: 10.6593, lng: 77.0068 }
        },
        serviceRadius: 25,
        skillsOffered: ['land_preparation', 'sowing', 'weeding', 'harvesting'],
        workerCount: 5,
        reliabilityScore: 95,
        totalRequestsHandled: 50,
        successfulCompletions: 48,
        replacementsProvided: 2,
        failedCommitments: 0,
        isActive: true,
        isVerified: true,
        isDemo: true
      });
      await coordinator.save();
      console.log(`✓ Created demo coordinator profile`);

      // Create demo workers for coordinator
      const demoWorkerNames = ['Demo Worker', 'Ravi Kumar', 'Muthu', 'Selvam', 'Ganesh', 'Prakash', 'Dinesh', 'Rajesh'];
      const createdWorkers = [];
      for (let i = 0; i < 8; i++) {
        const worker = new Worker({
          coordinatorId: coordinator._id,
          name: demoWorkerNames[i],
          phone: i === 0 ? '9999000003' : `999900${1000 + i}`,
          skills: [
            { type: 'land_preparation', experienceYears: 3 + Math.floor(i / 2) },
            { type: 'sowing', experienceYears: 3 + Math.floor(i / 2) },
            { type: 'weeding', experienceYears: 2 + Math.floor(i / 2) },
            { type: 'harvesting', experienceYears: 4 + Math.floor(i / 3) }
          ],
          availability: {
            monday: true, tuesday: true, wednesday: true,
            thursday: true, friday: true, saturday: true, sunday: i % 2 === 0
          },
          isStandby: i >= 6, // Last 2 are standby workers
          reliabilityScore: 75 + i * 3,
          totalAssignments: 20 + i * 5,
          completedAssignments: 18 + i * 4,
          isActive: true,
          isDemo: true
        });
        await worker.save();
        createdWorkers.push(worker);
      }
      console.log(`✓ Created 8 demo workers for coordinator`);
    }

    // Create demo labour requests for farmer
    if (demoFarmer && demoCoordinator) {
      const landForRequest = await Land.findOne({ userId: demoFarmer._id.toString(), isDemo: true });
      
      if (landForRequest) {
        // Request 1: Pending - Just created by farmer, waiting for coordinator
        const pendingRequest = new LabourRequest({
          farmerId: demoFarmer._id,
          landId: landForRequest.landId,
          workType: 'harvesting',
          workersNeeded: 3,
          workDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          estimatedDuration: 3,
          wageOffered: 600,
          foodProvided: true,
          transportProvided: false,
          location: {
            district: 'Coimbatore',
            area: 'Pollachi',
            coordinates: { lat: 10.6593, lng: 77.0068 }
          },
          coordinatorId: demoCoordinator._id,
          status: 'pending',
          requirements: {
            experience: 'any',
            skills: ['harvesting', 'threshing']
          },
          isDemo: true
        });
        await pendingRequest.save();
        console.log(`✓ Created demo labour request #1 (pending - awaiting coordinator)`);

        // Request 2: Accepted - Coordinator accepted, now matching workers
        const acceptedRequest = new LabourRequest({
          farmerId: demoFarmer._id,
          landId: landForRequest.landId,
          workType: 'sowing',
          workersNeeded: 2,
          workDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          estimatedDuration: 2,
          wageOffered: 550,
          foodProvided: true,
          transportProvided: true,
          location: {
            district: 'Coimbatore',
            area: 'Pollachi',
            coordinates: { lat: 10.6593, lng: 77.0068 }
          },
          coordinatorId: demoCoordinator._id,
          status: 'accepted',
          coordinatorAcceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          requirements: {
            experience: 'intermediate',
            skills: ['sowing']
          },
          isDemo: true
        });
        await acceptedRequest.save();
        console.log(`✓ Created demo labour request #2 (accepted - coordinator matching workers)`);

        // Request 3: Confirmed - Workers assigned and confirmed
        // First get workers from demo coordinator
        const confirmedRequest = new LabourRequest({
          farmerId: demoFarmer._id,
          landId: landForRequest.landId,
          workType: 'weeding',
          workersNeeded: 4,
          workDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
          estimatedDuration: 2,
          wageOffered: 500,
          foodProvided: true,
          transportProvided: false,
          location: {
            district: 'Coimbatore',
            area: 'Pollachi',
            coordinates: { lat: 10.6593, lng: 77.0068 }
          },
          coordinatorId: demoCoordinator._id,
          status: 'assigned',
          coordinatorAcceptedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          assignedWorkers: [], // Will populate after creating workers
          requirements: {
            experience: 'any',
            skills: ['weeding']
          },
          isDemo: true
        });
        await confirmedRequest.save();
        console.log(`✓ Created demo labour request #3 (assigned - workers assigned)`);

        // Now assign workers to the assigned request
        // Find the coordinator model instance
        const coordinatorProfile = await Coordinator.findOne({ 
          userId: demoCoordinator._id.toString(), 
          isDemo: true 
        });
        
        if (coordinatorProfile) {
          const demoWorkers = await Worker.find({ 
            coordinatorId: coordinatorProfile._id, 
            isDemo: true 
          }).limit(4);
          
          if (demoWorkers.length >= 4) {
            for (let i = 0; i < 4; i++) {
              confirmedRequest.assignedWorkers.push({
                workerId: demoWorkers[i]._id,
                assignedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                status: 'confirmed'
              });
            }
            await confirmedRequest.save();
            console.log(`✓ Assigned 4 workers (${demoWorkers.slice(0, 4).map(w => w.name).join(', ')}) to labour request #3`);
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('DEMO USERS CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nDemo Credentials:');
    console.log('─────────────────────────────────────');
    console.log('1. FARMER');
    console.log('   Phone: 9999000001');
    console.log('   Password: demo123');
    console.log('\n2. COORDINATOR');
    console.log('   Phone: 9999000002');
    console.log('   Password: demo123');
    console.log('\n3. WORKER (Worker Dashboard)');
    console.log('   Phone: 9999000003');
    console.log('   Password: demo123');
    console.log('   - Has worker dashboard with assignments');
    console.log('   - Assigned to weeding work (4 workers total)');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo users:', error);
    process.exit(1);
  }
}

seedDemoUsers();
