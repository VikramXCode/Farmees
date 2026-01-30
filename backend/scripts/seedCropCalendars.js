import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CropCalendar from '../models/CropCalendar.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';

/**
 * Seed Crop Calendar Data
 * Initial templates for common crops in Tamil Nadu
 */
const cropCalendars = [
  {
    cropName: 'onion',
    cropNameTamil: 'வெங்காயம்',
    totalDurationDays: 120,
    seasons: ['all'],
    region: 'Tamil Nadu',
    isActive: true,
    activities: [
      {
        activityType: 'land_preparation',
        daysFromStart: 0,
        durationDays: 3,
        reasonEnglish: 'Clear field and prepare soil for planting. Remove weeds and old crop residue.',
        reasonTamil: 'வயலை சுத்தம் செய்து நடவுக்கு மண் தயார் செய்யவும். களை மற்றும் பழைய பயிர் எச்சங்களை அகற்றவும்.',
        estimatedCostMin: 2000,
        estimatedCostMax: 3000,
        isOptional: false
      },
      {
        activityType: 'ploughing',
        daysFromStart: 3,
        durationDays: 2,
        reasonEnglish: 'Plough the field 15-20 cm deep to loosen soil and improve drainage.',
        reasonTamil: 'மண்ணை தளர்த்தி வடிகால் மேம்படுத்த 15-20 செமீ ஆழத்தில் உழவு செய்யவும்.',
        estimatedCostMin: 3000,
        estimatedCostMax: 4000,
        isOptional: false
      },
      {
        activityType: 'seed_sowing',
        daysFromStart: 35,
        durationDays: 3,
        reasonEnglish: 'Transplant onion seedlings when they are 6-8 weeks old. Plant at 15x10 cm spacing.',
        reasonTamil: '6-8 வார வெங்காய நாற்றுகளை 15x10 செமீ இடைவெளியில் நடவும்.',
        estimatedCostMin: 5000,
        estimatedCostMax: 8000,
        isOptional: false
      },
      {
        activityType: 'irrigation',
        daysFromStart: 40,
        durationDays: 1,
        reasonEnglish: 'Water regularly to keep soil moist but not waterlogged. Critical for bulb formation.',
        reasonTamil: 'மண் ஈரமாக இருக்க தவறாமல் நீர்ப்பாசனம் செய்யவும். குமிழ் உருவாக்கத்திற்கு முக்கியம்.',
        estimatedCostMin: 500,
        estimatedCostMax: 1000,
        isOptional: false,
        recurringCount: 10,
        recurringFrequency: 'weekly'
      },
      {
        activityType: 'fertilizer_application',
        daysFromStart: 45,
        durationDays: 1,
        reasonEnglish: 'Apply NPK fertilizer 19:19:19 at 25 kg per acre. Mix vermicompost for better results.',
        reasonTamil: 'ஒரு ஏக்கருக்கு 19:19:19 NPK உரம் 25 கிலோ இடவும். சிறந்த முடிவுக்கு மண்புழு உரம் கலக்கவும்.',
        estimatedCostMin: 2000,
        estimatedCostMax: 3000,
        isOptional: false
      },
      {
        activityType: 'weeding',
        daysFromStart: 50,
        durationDays: 2,
        reasonEnglish: 'Remove weeds manually or use mulch. Weeds compete for nutrients and water.',
        reasonTamil: 'களை கையால் நீக்கவும் அல்லது வைக்கோல் மூடி பயன்படுத்தவும். ஊட்டச்சத்து போட்டியைத் தவிர்க்கவும்.',
        estimatedCostMin: 1500,
        estimatedCostMax: 2500,
        isOptional: false,
        recurringCount: 2,
        recurringFrequency: 'monthly'
      },
      {
        activityType: 'pest_control',
        daysFromStart: 60,
        durationDays: 1,
        reasonEnglish: 'Spray neem oil for thrips control. Check for purple blotch disease.',
        reasonTamil: 'த்ரிப்ஸ் கட்டுப்பாட்டிற்கு வேப்ப எண்ணெய் தெளிக்கவும். ஊதா புள்ளி நோய் உள்ளதா என சரிபார்க்கவும்.',
        estimatedCostMin: 1000,
        estimatedCostMax: 2000,
        isOptional: false,
        recurringCount: 3,
        recurringFrequency: 'biweekly'
      },
      {
        activityType: 'harvesting',
        daysFromStart: 115,
        durationDays: 5,
        reasonEnglish: 'Harvest when 50% of tops fall over. Cure for 2 weeks before storage.',
        reasonTamil: '50% தண்டுகள் சாயும் போது அறுவடை செய்யவும். சேமிப்பிற்கு முன் 2 வாரம் காயவிடவும்.',
        estimatedCostMin: 4000,
        estimatedCostMax: 6000,
        isOptional: false
      }
    ]
  },
  {
    cropName: 'coconut',
    cropNameTamil: 'தேங்காய்',
    totalDurationDays: 365,
    seasons: ['all'],
    region: 'Tamil Nadu',
    isActive: true,
    activities: [
      {
        activityType: 'irrigation',
        daysFromStart: 0,
        durationDays: 1,
        reasonEnglish: 'Water coconut palms regularly, especially during dry season. Each tree needs 30-40 liters.',
        reasonTamil: 'தேங்காய் மரங்களுக்கு தவறாமல் நீர்ப்பாசனம் செய்யவும். ஒரு மரத்திற்கு 30-40 லிட்டர் தேவை.',
        estimatedCostMin: 1000,
        estimatedCostMax: 2000,
        isOptional: false,
        recurringCount: 12,
        recurringFrequency: 'monthly'
      },
      {
        activityType: 'fertilizer_application',
        daysFromStart: 30,
        durationDays: 1,
        reasonEnglish: 'Apply 500g urea, 1kg superphosphate, and 2kg potash per tree yearly. Split into 4 doses.',
        reasonTamil: 'ஒரு மரத்திற்கு வருடத்திற்கு 500கிராம் யூரியா, 1கிலோ சூப்பர் பாஸ்பேட், 2கிலோ பொட்டாஷ் இடவும். 4 முறையாக பிரிக்கவும்.',
        estimatedCostMin: 3000,
        estimatedCostMax: 5000,
        isOptional: false,
        recurringCount: 4,
        recurringFrequency: 'monthly'
      },
      {
        activityType: 'weeding',
        daysFromStart: 15,
        durationDays: 2,
        reasonEnglish: 'Remove weeds around coconut base in 2 meter radius. Use mulch to prevent regrowth.',
        reasonTamil: 'தேங்காய் மரத்தைச் சுற்றி 2 மீட்டர் சுற்றளவில் களை எடுக்கவும். வைக்கோல் மூடி போடவும்.',
        estimatedCostMin: 2000,
        estimatedCostMax: 3000,
        isOptional: false,
        recurringCount: 6,
        recurringFrequency: 'biweekly'
      },
      {
        activityType: 'pest_control',
        daysFromStart: 60,
        durationDays: 1,
        reasonEnglish: 'Check for rhinoceros beetle. Set beetle traps. Spray neem for red palm weevil.',
        reasonTamil: 'காண்டாமிருகப் பூச்சி உள்ளதா என சரிபார்க்கவும். பூச்சிப்பொறி வைக்கவும். சிவப்பு துளைப்பானுக்கு வேப்ப எண்ணெய்.',
        estimatedCostMin: 1500,
        estimatedCostMax: 3000,
        isOptional: false,
        recurringCount: 4,
        recurringFrequency: 'monthly'
      },
      {
        activityType: 'harvesting',
        daysFromStart: 30,
        durationDays: 1,
        reasonEnglish: 'Harvest mature coconuts every 45-60 days. Each tree yields 60-80 nuts per year.',
        reasonTamil: 'முதிர்ந்த தேங்காய்களை 45-60 நாட்களுக்கு ஒருமுறை அறுவடை செய்யவும். ஒரு மரத்திற்கு வருடத்திற்கு 60-80 காய்கள்.',
        estimatedCostMin: 2000,
        estimatedCostMax: 4000,
        isOptional: false,
        recurringCount: 6,
        recurringFrequency: 'biweekly'
      }
    ]
  },
  {
    cropName: 'rice',
    cropNameTamil: 'நெல்',
    totalDurationDays: 120,
    seasons: ['kharif', 'rabi'],
    region: 'Tamil Nadu',
    isActive: true,
    activities: [
      {
        activityType: 'land_preparation',
        daysFromStart: 0,
        durationDays: 3,
        reasonEnglish: 'Level the field properly. Good leveling saves water and ensures uniform crop.',
        reasonTamil: 'வயலை சரியாக சமன் செய்யவும். நல்ல சமன் நீர் சேமிக்கிறது மற்றும் சீரான பயிர் வளர்ச்சி.',
        estimatedCostMin: 2500,
        estimatedCostMax: 4000,
        isOptional: false
      },
      {
        activityType: 'ploughing',
        daysFromStart: 3,
        durationDays: 2,
        reasonEnglish: 'Wet plough 2-3 times to achieve puddled condition for rice.',
        reasonTamil: 'நெல் வயலை சேற்று நிலைக்கு கொண்டுவர 2-3 முறை ஈர உழவு செய்யவும்.',
        estimatedCostMin: 3000,
        estimatedCostMax: 5000,
        isOptional: false
      },
      {
        activityType: 'seed_sowing',
        daysFromStart: 25,
        durationDays: 3,
        reasonEnglish: 'Transplant 25-30 day old seedlings at 20x15 cm spacing. Plant 2-3 seedlings per hill.',
        reasonTamil: '25-30 நாள் நாற்றுகளை 20x15 செமீ இடைவெளியில் நடவும். ஒரு குழியில் 2-3 நாற்றுகள்.',
        estimatedCostMin: 5000,
        estimatedCostMax: 7000,
        isOptional: false
      },
      {
        activityType: 'irrigation',
        daysFromStart: 30,
        durationDays: 1,
        reasonEnglish: 'Maintain 2-5 cm water level during growth. Drain 10 days before harvest.',
        reasonTamil: 'வளர்ச்சி காலத்தில் 2-5 செமீ நீர் மட்டம் வைக்கவும். அறுவடைக்கு 10 நாட்கள் முன் வடிக்கவும்.',
        estimatedCostMin: 800,
        estimatedCostMax: 1500,
        isOptional: false,
        recurringCount: 15,
        recurringFrequency: 'weekly'
      },
      {
        activityType: 'fertilizer_application',
        daysFromStart: 35,
        durationDays: 1,
        reasonEnglish: 'Apply DAP 50kg + Urea 25kg per acre as basal dose. Top dress urea in 2 splits.',
        reasonTamil: 'ஏக்கருக்கு DAP 50கிலோ + யூரியா 25கிலோ அடியுரமாக. யூரியா 2 முறையாக மேலுரமாக.',
        estimatedCostMin: 3000,
        estimatedCostMax: 4000,
        isOptional: false
      },
      {
        activityType: 'weeding',
        daysFromStart: 40,
        durationDays: 2,
        reasonEnglish: 'Hand weeding or use cono weeder. Remove weeds to reduce competition.',
        reasonTamil: 'கை களையெடுப்பு அல்லது கோனோ களையெடுப்பான் பயன்படுத்தவும். போட்டியை குறைக்க களை அகற்றவும்.',
        estimatedCostMin: 2000,
        estimatedCostMax: 3500,
        isOptional: false,
        recurringCount: 2,
        recurringFrequency: 'biweekly'
      },
      {
        activityType: 'pest_control',
        daysFromStart: 50,
        durationDays: 1,
        reasonEnglish: 'Monitor for stem borer, leaf folder, and blast disease. Use IPM methods first.',
        reasonTamil: 'தண்டு துளைப்பான், இலை சுருட்டுப்புழு மற்றும் பூஞ்சை நோய் கண்காணிக்கவும். IPM முறைகள் முதலில்.',
        estimatedCostMin: 1500,
        estimatedCostMax: 2500,
        isOptional: false,
        recurringCount: 2,
        recurringFrequency: 'biweekly'
      },
      {
        activityType: 'harvesting',
        daysFromStart: 115,
        durationDays: 3,
        reasonEnglish: 'Harvest when 80% grains turn golden. Thresh within 2-3 days to prevent loss.',
        reasonTamil: '80% தானியங்கள் தங்க நிறமாகும் போது அறுவடை செய்யவும். இழப்பைத் தவிர்க்க 2-3 நாட்களில் மிதிக்கவும்.',
        estimatedCostMin: 5000,
        estimatedCostMax: 8000,
        isOptional: false
      }
    ]
  }
];

async function seedCropCalendars() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('Clearing existing crop calendars...');
    await CropCalendar.deleteMany({});
    console.log('✅ Cleared existing data');
    
    console.log('Seeding crop calendars...');
    for (const calendar of cropCalendars) {
      await CropCalendar.create(calendar);
      console.log(`✅ Added ${calendar.cropNameTamil} (${calendar.cropName})`);
    }
    
    console.log('\n✅ Seed completed successfully!');
    console.log(`Total crop calendars: ${cropCalendars.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedCropCalendars();
