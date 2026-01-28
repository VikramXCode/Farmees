// Auth Service: Handles signup and signin API calls
import { getApiHeaders } from './api';
import { API_BASE_URL } from '../config/api';

export async function signup(name: string, phone: string, password: string, role: string = 'farmer') {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ name, phone, password, role })
  });
  if (!res.ok) {
    let errorMsg = 'Signup failed';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      // Response not JSON, use default message
    }
    throw new Error(errorMsg);
  }
  return await res.json();
}

export async function signin(phone: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ phone, password })
  });
  if (!res.ok) {
    let errorMsg = 'Signin failed';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      // Response not JSON, use default message
    }
    throw new Error(errorMsg);
  }
  return await res.json();
}
