import mongoose from 'mongoose';
import Land from '../models/Land.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmees';

async function checkLandData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const lands = await Land.find({ isActive: true }).select('landId name location postalCode district country');
    
    console.log('\n📊 Found', lands.length, 'active lands:\n');
    
    lands.forEach((land, index) => {
      console.log(`${index + 1}. ${land.name} (${land.landId})`);
      console.log(`   📍 Location: ${land.location || '(empty)'}`);
      console.log(`   📮 Postal Code: ${land.postalCode || '❌ MISSING'}`);
      console.log(`   🏛️  District: ${land.district || '❌ MISSING'}`);
      console.log(`   🌍 Country: ${land.country || '❌ MISSING'}`);
      console.log('');
    });

    const missingPostalCode = lands.filter(l => !l.postalCode);
    if (missingPostalCode.length > 0) {
      console.log(`⚠️  ${missingPostalCode.length} land(s) are missing postal code data`);
      console.log('   These lands were created before postal code feature was added.');
      console.log('   Solution: Edit these lands and add postal code to update them.\n');
    } else {
      console.log('✅ All lands have postal code data!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkLandData();
