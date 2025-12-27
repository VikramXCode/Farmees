const mongoose = require('mongoose');
const User = require('./models/User');

async function checkDemoUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmease');
    console.log('✓ Connected to MongoDB\n');
    
    const demoPhones = ['9999000001', '9999000002', '9999000003'];
    
    for (const phone of demoPhones) {
      const user = await User.findOne({ phone });
      if (user) {
        console.log(`Phone: ${phone}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  isDemo: ${user.isDemo}`);
        console.log(`  District: ${user.district}`);
        console.log(`  Area: ${user.area}`);
        console.log('');
      } else {
        console.log(`❌ User ${phone} not found\n`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDemoUsers();
