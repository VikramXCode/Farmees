import axios from 'axios';

// Prefer Vite-exposed env variable in the browser build, fallback to process.env on the server
const API_KEY = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_DATA_GOV_API_KEY
  ? (import.meta as any).env.VITE_DATA_GOV_API_KEY
  : (process.env as any)?.REACT_APP_DATA_GOV_API_KEY;
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

export interface MarketRecord {
  commodity: string;
  market: string;
  district: string;
  min_price: number | null;
  max_price: number | null;
  modal_price: number | null;
  price_unit: string | null;
  arrival_date: string | null;
}

function mapApiRecord(rec: any): MarketRecord {
  console.log('Mapping record:', rec); // Debug log
  return {
    commodity: rec.commodity || rec.name || rec.crop || 'Unknown',
    market: rec.market || rec.market_center || rec.market_name || rec.mandi || 'Unknown',
    district: rec.district || rec.district_name || rec.dist || 'Unknown',
    min_price: rec.min_price || rec.minprice || rec.minimum_price ? Number(rec.min_price || rec.minprice || rec.minimum_price) : null,
    max_price: rec.max_price || rec.maxprice || rec.maximum_price ? Number(rec.max_price || rec.maxprice || rec.maximum_price) : null,
    modal_price: rec.modal_price || rec.modalprice || rec.price ? Number(rec.modal_price || rec.modalprice || rec.price) : null,
    price_unit: rec.price_unit || rec.unit || rec.units || 'per quintal',
    arrival_date: rec.arrival_date || rec.date || rec.reported_date || null,
  };
}

export async function fetchKeralaMarketData(commodity?: string, limit = 50): Promise<MarketRecord[]> {
  if (!API_KEY) {
    throw new Error('Data.gov.in API key not found in environment variables');
  }

  const params: any = {
    'api-key': API_KEY,
    format: 'json',
    limit,
    // filter for Kerala state only (use filters[...] format expected by this resource)
    'filters[state]': 'Kerala',
    // sort by arrival date descending to get latest (Data.gov.in may accept sort and sort_by)
    sort: 'desc',
    sort_by: 'arrival_date',
    offset: 0,
  };

  if (commodity) {
    params['filters[commodity]'] = commodity;
  }

  try {
    console.log('Fetching market data with params:', params);
    const resp = await axios.get(BASE_URL, { params });
    console.log('API Response status:', resp.status);
    console.log('API Response data:', resp.data);
    
    const data = resp.data;
    
    // Handle different response formats
    let records = [];
    if (data && Array.isArray(data.records)) {
      records = data.records;
    } else if (data && Array.isArray(data)) {
      records = data;
    } else if (data && data.result && Array.isArray(data.result.records)) {
      records = data.result.records;
    } else {
      console.warn('Unexpected API response format:', data);
      return [];
    }
    
    console.log('Found records:', records.length);
    const mapped = records.map(mapApiRecord);
    console.log('Mapped records:', mapped.slice(0, 3)); // Log first 3 for debugging
    
    return mapped;
  } catch (err: any) {
    console.error('Error fetching market data:', err);
    console.error('Error response:', err.response?.data);
    console.error('Error status:', err.response?.status);
    throw new Error(`Failed to fetch market data: ${err.message}`);
  }
}

// Fetch Kerala market data from our backend CSV endpoint
export async function fetchKeralaMarketDataBackend(commodity?: string): Promise<MarketRecord[]> {
  try {
    const params: any = {};
    if (commodity) params.commodity = commodity;
    const base = (typeof window !== 'undefined') ? '' : 'http://localhost:3001';
    const url = `${base}/api/market/kerala`;
    const resp = await axios.get(url, { params });
    const data = resp.data;
    if (data && Array.isArray(data.records)) {
      return data.records as MarketRecord[];
    }
    return [];
  } catch (err: any) {
    console.error('Error fetching backend market data:', err);
    throw new Error(`Failed to fetch backend market data: ${err.message}`);
  }
}
