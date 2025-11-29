// Auth Service: Handles signup and signin API calls
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:3001/api';

export async function signup(name: string, phone: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Signup failed');
  return await res.json();
}

export async function signin(phone: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Signin failed');
  return await res.json();
}
