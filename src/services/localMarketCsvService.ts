export interface CsvMarketRecordRaw {
  State: string;
  District: string;
  Market: string;
  Commodity: string;
  Variety?: string;
  Grade?: string;
  Arrival_Date?: string; // dd/mm/yyyy
  Min_x0020_Price?: string; // numbers as string
  Max_x0020_Price?: string;
  Modal_x0020_Price?: string;
}

export interface MarketRecord {
  commodity: string;
  market: string;
  district: string;
  min_price: number | null;
  max_price: number | null;
  modal_price: number | null;
  price_unit: string | null;
  arrival_date: string | null; // ISO yyyy-mm-dd
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ',') {
        row.push(field);
        field = '';
        i++;
        continue;
      }
      if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
        continue;
      }
      if (char === '\r') {
        i++;
        continue;
      }
      field += char;
      i++;
    }
  }
  // last field
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.length > 0);
}

function toIsoDate(dmy?: string | null): string | null {
  if (!dmy) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmy.trim());
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

export function parseKeralaMarketCsv(text: string, commodityFilter?: string): MarketRecord[] {
  const table = parseCsv(text);
  if (!table.length) return [];
  const header = table[0];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const headerNorm = header.map(h => norm(h || ''));
  const findIdx = (...names: string[]) => {
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

  const toNum = (v?: string): number | null => {
    if (!v) return null;
    const cleaned = v.replace(/[,\s₹]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const out: MarketRecord[] = [];
  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    const state = row[iState]?.trim();
    if (state !== 'Kerala') continue;
    const commodity = row[iCommodity]?.trim() || 'Unknown';
    if (commodityFilter && commodity.toLowerCase().indexOf(commodityFilter.toLowerCase()) === -1) continue;

  const minV = iMin !== -1 ? toNum(row[iMin]) : null;
  const maxV = iMax !== -1 ? toNum(row[iMax]) : null;
  const modalV = iModal !== -1 ? toNum(row[iModal]) : null;

    out.push({
      commodity,
      market: row[iMarket]?.trim() || 'Unknown',
      district: row[iDistrict]?.trim() || 'Unknown',
      min_price: Number.isFinite(minV as number) ? (minV as number) : null,
      max_price: Number.isFinite(maxV as number) ? (maxV as number) : null,
      modal_price: Number.isFinite(modalV as number) ? (modalV as number) : null,
      price_unit: 'per quintal',
      arrival_date: toIsoDate(row[iArrival]?.trim())
    });
  }
  return out;
}
