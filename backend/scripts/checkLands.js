import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Land from '../models/Land.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';

async function checkLands() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected successfully\n');

    // Get all lands
    const lands = await Land.find({}).sort({ createdAt: -1 }).limit(10);
    
    console.log(`📊 Total lands found: ${lands.length}\n`);
    
    if (lands.length === 0) {
      console.log('⚠️  No lands found in database');
    } else {
      console.log('📍 Recent lands:');
      console.log('═'.repeat(80));
      
      lands.forEach((land, index) => {
        console.log(`\n${index + 1}. Land ID: ${land.landId}`);
        console.log(`   Name: ${land.name}`);
        console.log(`   User ID: ${land.userId}`);
        console.log(`   Location: ${land.location || '(empty)'}`);
        console.log(`   Soil Type: ${land.soilType || '(empty)'}`);
        console.log(`   Current Crop: ${land.currentCrop || '(empty)'}`);
        console.log(`   Water Availability: ${land.waterAvailability}`);
        console.log(`   Postal Code: ${land.postalCode || '(none)'}`);
        console.log(`   Is Active: ${land.isActive}`);
        console.log(`   Is Demo: ${land.isDemo || false}`);
        console.log(`   Created: ${land.createdAt}`);
        console.log(`   Updated: ${land.updatedAt}`);
      });
      
      console.log('\n' + '═'.repeat(80));
      
      // Group by user
      const userGroups = lands.reduce((acc, land) => {
        acc[land.userId] = (acc[land.userId] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Lands per user:');
      Object.entries(userGroups).forEach(([userId, count]) => {
        console.log(`   User ${userId}: ${count} land(s)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

checkLands();
