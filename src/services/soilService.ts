// Soil Report Service: Upload and extract soil data
import { getApiHeaders } from './api';
import { API_BASE_URL } from '../config/api';

const baseUrl = API_BASE_URL;

export async function uploadSoilReport(landId: string, file: File, engine: 'tesseract' | 'easyocr' = 'tesseract', lang: string = 'en') {
  const formData = new FormData();
  formData.append('report', file);
  formData.append('landId', landId);
  formData.append('engine', engine);
  formData.append('lang', lang);
  // Get headers but remove Content-Type for FormData (browser will set it with boundary)
  const headers = getApiHeaders();
  delete headers['Content-Type'];
  
  const res = await fetch(`${baseUrl}/soil/upload`, {
    method: 'POST',
    headers: headers,
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Soil report upload failed');
  }
  return await res.json();
}
