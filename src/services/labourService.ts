// Labour Coordination Service
import api from './api';

const API_BASE = '/labour';

export interface Coordinator {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  location: {
    district: string;
    area: string;
    coordinates?: { lat: number; lng: number };
  };
  serviceRadius: number;
  skillsOffered: string[];
  workerCount: number;
  reliabilityScore: number;
  totalRequestsHandled: number;
  successfulCompletions: number;
  replacementsProvided: number;
  isActive: boolean;
  isVerified: boolean;
}

export interface Worker {
  _id: string;
  coordinatorId: string;
  name: string;
  phone: string;
  skills: { type: string; experienceYears: number }[];
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  isStandby: boolean;
  reliabilityScore: number;
  totalAssignments: number;
  completedAssignments: number;
  isActive: boolean;
}

export interface AssignedWorker {
  workerId: string | Worker;
  status: 'assigned' | 'confirmed' | 'cancelled' | 'replaced' | 'completed' | 'no_show';
  assignedAt: string;
  replacedBy?: string;
  replacedAt?: string;
  cancellationReason?: string;
}

export interface LabourRequest {
  _id: string;
  requestId: string;
  farmerId: string;
  landId: string;
  workType: string;
  workersNeeded: number;
  workDate: string;
  startTime: string;
  duration: number;
  description?: string;
  location: {
    district: string;
    area: string;
  };
  coordinatorId: string | Coordinator;
  assignedWorkers: AssignedWorker[];
  standbyWorkers: string[];
  status: 'pending' | 'accepted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  farmerConfirmed: boolean;
  farmerRating?: number;
  farmerFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkType {
  value: string;
  label: string;
}

export interface LabourLog {
  _id: string;
  requestId: string;
  coordinatorId: string;
  actorType: 'system' | 'farmer' | 'coordinator';
  eventType: string;
  eventData: {
    workerId?: string;
    previousWorkerId?: string;
    reason?: string;
    notes?: string;
  };
  timestamp: string;
}

class LabourService {
  // ============================================
  // WORK TYPES
  // ============================================
  
  async getWorkTypes(): Promise<WorkType[]> {
    const response = await api.get(`${API_BASE}/work-types`) as any;
    return response.workTypes;
  }

  // ============================================
  // COORDINATOR MANAGEMENT
  // ============================================
  
  async registerAsCoordinator(data: {
    userId: string;
    name: string;
    phone: string;
    location: { district: string; area: string };
    serviceRadius?: number;
    skillsOffered?: string[];
  }): Promise<{ success: boolean; coordinator: Coordinator }> {
    return await api.post(`${API_BASE}/coordinators/register`, data);
  }

  async getCoordinatorProfile(userId: string): Promise<{ success: boolean; coordinator: Coordinator }> {
    return await api.get(`${API_BASE}/coordinators/profile/${userId}`);
  }

  async updateCoordinatorProfile(userId: string, data: Partial<Coordinator>): Promise<{ success: boolean; coordinator: Coordinator }> {
    return await api.put(`${API_BASE}/coordinators/profile/${userId}`, data);
  }

  async findNearbyCoordinators(district: string, workType?: string): Promise<{ success: boolean; coordinators: Coordinator[] }> {
    const params = new URLSearchParams({ district });
    if (workType) params.append('workType', workType);
    return await api.get(`${API_BASE}/coordinators/nearby?${params}`);
  }

  async getCoordinatorStats(coordinatorId: string): Promise<{ success: boolean; stats: any }> {
    return await api.get(`${API_BASE}/coordinators/${coordinatorId}/stats`);
  }

  // ============================================
  // WORKER MANAGEMENT (Coordinator)
  // ============================================
  
  async addWorker(data: {
    coordinatorId: string;
    name: string;
    phone: string;
    skills?: { type: string; experienceYears: number }[];
    availability?: Partial<Worker['availability']>;
    isStandby?: boolean;
  }): Promise<{ success: boolean; worker: Worker }> {
    return await api.post(`${API_BASE}/workers`, data);
  }

  async listWorkers(coordinatorId: string, options?: { skill?: string; standbyOnly?: boolean }): Promise<{ success: boolean; workers: Worker[] }> {
    const params = new URLSearchParams({ coordinatorId });
    if (options?.skill) params.append('skill', options.skill);
    if (options?.standbyOnly) params.append('standbyOnly', 'true');
    return await api.get(`${API_BASE}/workers?${params}`);
  }

  async updateWorker(workerId: string, data: Partial<Worker>): Promise<{ success: boolean; worker: Worker }> {
    return await api.put(`${API_BASE}/workers/${workerId}`, data);
  }

  async removeWorker(workerId: string): Promise<{ success: boolean }> {
    return await api.delete(`${API_BASE}/workers/${workerId}`);
  }

  async getAvailableWorkers(coordinatorId: string, date: string, workType?: string): Promise<{ success: boolean; workers: Worker[] }> {
    const params = new URLSearchParams({ coordinatorId, date });
    if (workType) params.append('workType', workType);
    return await api.get(`${API_BASE}/workers/available?${params}`);
  }

  // ============================================
  // LABOUR REQUESTS (Farmer)
  // ============================================
  
  async createRequest(data: {
    farmerId: string;
    landId: string;
    workType: string;
    workersNeeded: number;
    workDate: string;
    startTime?: string;
    duration?: number;
    description?: string;
  }): Promise<{ success: boolean; request: LabourRequest; coordinator: Partial<Coordinator> }> {
    return await api.post(`${API_BASE}/requests`, data);
  }

  async listFarmerRequests(farmerId: string, status?: string): Promise<{ success: boolean; requests: LabourRequest[] }> {
    const params = new URLSearchParams({ farmerId });
    if (status) params.append('status', status);
    return await api.get(`${API_BASE}/requests?${params}`);
  }

  async getRequestDetails(requestId: string): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.get(`${API_BASE}/requests/${requestId}`);
  }

  async cancelRequest(requestId: string, reason?: string): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.put(`${API_BASE}/requests/${requestId}/cancel`, { reason });
  }

  async confirmWorkCompletion(requestId: string): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.put(`${API_BASE}/requests/${requestId}/confirm`, {});
  }

  async submitFeedback(requestId: string, rating: number, feedback?: string): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.put(`${API_BASE}/requests/${requestId}/feedback`, { rating, feedback });
  }

  // ============================================
  // LABOUR REQUESTS (Coordinator)
  // ============================================
  
  async listCoordinatorRequests(coordinatorId: string, status?: string): Promise<{ success: boolean; requests: LabourRequest[] }> {
    const params = new URLSearchParams({ coordinatorId });
    if (status) params.append('status', status);
    return await api.get(`${API_BASE}/coordinator/requests?${params}`);
  }

  async acceptRequest(requestId: string): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.put(`${API_BASE}/coordinator/requests/${requestId}/accept`, {});
  }

  async declineRequest(requestId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return await api.put(`${API_BASE}/coordinator/requests/${requestId}/decline`, { reason });
  }

  async assignWorkers(requestId: string, workerIds: string[], standbyWorkerIds?: string[]): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.put(`${API_BASE}/coordinator/requests/${requestId}/assign`, { workerIds, standbyWorkerIds });
  }

  async getReplacementSuggestions(requestId: string, cancelledWorkerId?: string): Promise<{ success: boolean; suggestions: { standby: Worker[]; available: Worker[] } }> {
    const params = cancelledWorkerId ? `?cancelledWorkerId=${cancelledWorkerId}` : '';
    return await api.get(`${API_BASE}/coordinator/requests/${requestId}/suggestions${params}`);
  }

  async replaceWorker(requestId: string, cancelledWorkerId: string, newWorkerId: string, reason?: string): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.put(`${API_BASE}/coordinator/requests/${requestId}/replace`, { cancelledWorkerId, newWorkerId, reason });
  }

  async startWork(requestId: string): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.put(`${API_BASE}/coordinator/requests/${requestId}/start`, {});
  }

  async completeWork(requestId: string, notes?: string): Promise<{ success: boolean; request: LabourRequest }> {
    return await api.put(`${API_BASE}/coordinator/requests/${requestId}/complete`, { notes });
  }

  // ============================================
  // LOGS
  // ============================================
  
  async getRequestLogs(requestId: string): Promise<{ success: boolean; logs: LabourLog[] }> {
    return await api.get(`${API_BASE}/requests/${requestId}/logs`);
  }

  // ============================================
  // WORKER ASSIGNMENTS
  // ============================================
  
  async getMyAssignments(phone: string): Promise<{ success: boolean; requests: LabourRequest[]; worker?: Worker }> {
    const params = new URLSearchParams({ phone });
    return await api.get(`${API_BASE}/workers/my-assignments?${params}`);
  }

  async updateMyAvailability(phone: string, availability: Record<string, boolean>): Promise<{ success: boolean; worker: Worker }> {
    return await api.put(`${API_BASE}/workers/my-availability`, { phone, availability });
  }
}

export const labourService = new LabourService();
export default labourService;
