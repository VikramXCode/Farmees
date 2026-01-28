import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Officer from '../models/Officer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmease';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const file = path.join(__dirname, 'seed_officers.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    let inserted = 0;
    for (const o of data) {
      const exists = await Officer.findOne({ name: o.name, email: o.email }).lean();
      if (!exists) {
        await Officer.create(o);
        inserted++;
      }
    }
    console.log(`Seeded officers: ${inserted} new, total now ${await Officer.countDocuments()}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed officers error', err);
    process.exit(1);
  }
}

run();

