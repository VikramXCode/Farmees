// Soil Report Service: Upload and extract soil data
const baseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:3001/api';

export async function uploadSoilReport(landId: string, file: File, engine: 'tesseract' | 'easyocr' = 'tesseract', lang: string = 'en') {
  const formData = new FormData();
  formData.append('report', file);
  formData.append('landId', landId);
  formData.append('engine', engine);
  formData.append('lang', lang);
  const res = await fetch(`${baseUrl}/soil/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Soil report upload failed');
  }
  return await res.json();
}
