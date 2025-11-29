import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export interface Escalation {
  _id?: string;
  userId: string;
  landId?: string;
  officerId?: string;
  query: string;
  context?: any;
  suggestions?: string[];
  status?: 'pending' | 'assigned' | 'notified' | 'in-progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt?: string;
}

export interface Officer {
  _id: string;
  name: string;
  designation?: string;
  district?: string;
  state?: string;
  email?: string;
  phone?: string;
}

export async function createEscalation(payload: Escalation) {
  const { data } = await axios.post(`${API_BASE}/api/escalations`, payload);
  return data;
}

export async function listEscalations(params?: { userId?: string; status?: string }) {
  const { data } = await axios.get(`${API_BASE}/api/escalations`, { params });
  return data;
}

export async function listOfficers(params?: { district?: string; state?: string; active?: boolean }) {
  const { data } = await axios.get(`${API_BASE}/api/officers`, { params });
  return data;
}
