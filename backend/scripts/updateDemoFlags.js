// Force update isDemo flag for demo users
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function updateDemoFlags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease');
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
