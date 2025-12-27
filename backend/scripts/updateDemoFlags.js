// Force update isDemo flag for demo users
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateDemoFlags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease');
    console.log('✓ Connected to MongoDB\n');
    
    const demoPhones = ['9999000001', '9999000002', '9999000003'];
    
    console.log('Updating isDemo flag for demo users...\n');
    
    const result = await User.updateMany(
      { phone: { $in: demoPhones } },
      { $set: { isDemo: true } }
    );
    
    console.log(`✓ Updated ${result.modifiedCount} users\n`);
    
    // Verify
    for (const phone of demoPhones) {
      const user = await User.findOne({ phone });
      if (user) {
        console.log(`${phone}: isDemo = ${user.isDemo} ✓`);
      } else {
        console.log(`${phone}: User not found ❌`);
      }
    }
    
    console.log('\n✅ All demo users have isDemo: true');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateDemoFlags();
