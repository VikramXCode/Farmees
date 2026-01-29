// Soil Report Service: Upload and extract soil data
import { getApiHeaders } from './api';
import { API_BASE_URL } from '../config/api';

const baseUrl = API_BASE_URL;

export async function uploadSoilReport(landId: string, file: File, engine: 'tesseract' | 'easyocr' = 'tesseract', lang: string = 'en') {
  // Step 1: Upload the file to trigger OCR simulation
  const formData = new FormData();
  formData.append('file', file); // Changed from 'report' to 'file'
  
  // Get headers but remove Content-Type for FormData (browser will set it with boundary)
  const headers = getApiHeaders();
  delete headers['Content-Type'];
  
  const uploadRes = await fetch(`${baseUrl}/soil/upload`, {
    method: 'POST',
    headers: headers,
    body: formData
  });
  
  if (!uploadRes.ok) {
    const errorData = await uploadRes.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Soil report upload failed');
  }
  
  const uploadResult = await uploadRes.json();
  console.log('Upload result:', uploadResult);
  
  // Step 2: Attach soil data to the land
  const attachRes = await fetch(`${baseUrl}/soil/land/attach-soil`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ land_id: landId })
  });
  
  if (!attachRes.ok) {
    const errorData = await attachRes.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.message || 'Failed to attach soil data to land');
  }
  
  const attachResult = await attachRes.json();
  console.log('Attach result:', attachResult);
  
  // Return combined result
  return {
    success: true,
    uploadData: uploadResult,
    soilData: attachResult.soilData,
    message: 'Soil report uploaded and attached to land successfully'
  };
}

// Get OCR text for display/debugging
export async function getOCRText() {
  const res = await fetch(`${baseUrl}/soil/dummy`, {
    method: 'GET',
    headers: getApiHeaders()
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch OCR text');
  }
  
  return await res.json();
}

// Get soil data from a specific land
export async function getLandSoilData(landId: string) {
  const res = await fetch(`${baseUrl}/land/${landId}/soil`, {
    method: 'GET',
    headers: getApiHeaders()
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch land soil data');
  }
  
  return await res.json();
}
