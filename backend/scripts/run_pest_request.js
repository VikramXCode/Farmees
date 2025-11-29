const fs = require('fs');
const path = require('path');

async function run() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
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
