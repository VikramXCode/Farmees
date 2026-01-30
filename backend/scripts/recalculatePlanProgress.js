import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import FarmingPlan from '../models/FarmingPlan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';

async function recalculateAllPlans() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Fetching all farming plans...');
    const plans = await FarmingPlan.find({});
    console.log(`Found ${plans.length} plans to recalculate`);

    let successCount = 0;
    let errorCount = 0;

    for (const plan of plans) {
      try {
        console.log(`\n🔄 Recalculating: ${plan.planName} (ID: ${plan._id})`);
        console.log(`   Current progress: ${plan.progress.percentage}%`);
        console.log(`   Activities: ${plan.activities.length} total, ${plan.activities.filter(a => a.status === 'completed').length} completed`);
        
        const newProgress = await plan.calculateProgress();
        
        console.log(`   ✅ New progress: ${newProgress}%`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error recalculating plan ${plan._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Recalculation Summary:');
    console.log(`   Total plans: ${plans.length}`);
    console.log(`   ✅ Successfully recalculated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

    console.log('\n✅ Done! Disconnecting...');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

recalculateAllPlans();
