import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDemoUser, DEMO_MARKET_DATA } from '../middleware/demoMode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();


// Fallback market data - use DEMO_MARKET_DATA as fallback for all users
// when CSV file is not available
const fallbackKeralaMarketData = DEMO_MARKET_DATA;

function parseCsv(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(field); field = ''; i++; continue; }
      if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      field += ch; i++;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 0);
}

function toIso(dmy) {
  if (!dmy) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dmy).trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeRecords(rows, commodityFilter) {
  if (!rows.length) return [];
  const header = rows[0];
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const headerNorm = header.map(h => norm(h));
  const findIdx = (...names) => {
    for (const n of names) {
      const i = headerNorm.findIndex(h => h === norm(n));
      if (i !== -1) return i;
    }
    return -1;
  };
  const iState = findIdx('State');
  const iDistrict = findIdx('District');
  const iMarket = findIdx('Market');
  const iCommodity = findIdx('Commodity');
  const iArrival = findIdx('Arrival_Date', 'arrival_date', 'Date');
  const iMin = findIdx('Min_x0020_Price', 'Min Price', 'Min_Price', 'min_price', 'Minimum Price', 'minimum_price');
  const iMax = findIdx('Max_x0020_Price', 'Max Price', 'Max_Price', 'max_price', 'Maximum Price', 'maximum_price');
  const iModal = findIdx('Modal_x0020_Price', 'Modal Price', 'Modal_Price', 'modal_price');

  const toNum = v => {
    if (v == null) return null;
    const cleaned = String(v).replace(/[,\s₹]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const state = row[iState]?.trim();
    if (state !== 'Kerala') continue;
    const commodity = (row[iCommodity] || '').trim() || 'Unknown';
    if (commodityFilter && !commodity.toLowerCase().includes(String(commodityFilter).toLowerCase())) continue;

    const rec = {
      commodity,
      market: (row[iMarket] || 'Unknown').trim(),
      district: (row[iDistrict] || 'Unknown').trim(),
      min_price: iMin !== -1 ? toNum(row[iMin]) : null,
      max_price: iMax !== -1 ? toNum(row[iMax]) : null,
      modal_price: iModal !== -1 ? toNum(row[iModal]) : null,
      price_unit: 'per quintal',
      arrival_date: toIso(row[iArrival])
    };
    out.push(rec);
  }
  return out;
}

router.get('/kerala', async (req, res) => {
  try {
    // Check if demo mode
    if (req.isDemo) {
      return res.json({ success: true, data: DEMO_MARKET_DATA });
    }

    const csvPath = process.env.MARKET_CSV_PATH || path.join(__dirname, '..', 'data', 'today_market.csv');
    const commodityFilter = req.query.commodity;

    if (!fs.existsSync(csvPath)) {
      const filteredFallback = filterFallbackData(fallbackKeralaMarketData, commodityFilter);
      return res.json({ count: filteredFallback.length, records: filteredFallback, source: 'fallback' });
    }
    const text = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCsv(text);
    const records = normalizeRecords(rows, commodityFilter);
    if (!records.length) {
      const filteredFallback = filterFallbackData(fallbackKeralaMarketData, commodityFilter);
      return res.json({ count: filteredFallback.length, records: filteredFallback, source: 'fallback' });
    }
    res.json({ count: records.length, records, source: 'csv' });
  } catch (err) {
    console.error('Error serving market CSV:', err);
    res.status(500).json({ error: 'Failed to read market CSV' });
  }
});

function filterFallbackData(records, commodityFilter) {
  const list = commodityFilter
    ? records.filter(item => String(item.commodity || '').toLowerCase().includes(String(commodityFilter).toLowerCase()))
    : records;
  return list.map(item => ({ ...item }));
}

export default router;

