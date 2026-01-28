import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) { console.error('Uploads dir does not exist'); return; }
  const files = fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'));
  if (files.length === 0) { console.error('No files in uploads dir'); return; }
  const file = path.join(uploadsDir, files[0]);
  console.log('Using file:', file);

  const form = new FormData();
  form.append('image', fs.createReadStream(file));

  try {
    const res = await fetch('http://localhost:3001/api/pests/identify', { method: 'POST', body: form });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (e) {
    console.error('Request failed', e);
  }
}

run();

