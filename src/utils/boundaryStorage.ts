// Offline storage utilities for farm boundary mapping
import type { Coordinate, FarmBoundary } from '../types/boundary';
import { BOUNDARY_STORAGE_KEY, PENDING_SYNC_KEY } from '../types/boundary';

interface BoundaryDraft {
  landId?: string;
  points: Coordinate[];
  mode: 'walk' | 'draw';
  startedAt: string;
  lastUpdated: string;
}

interface PendingBoundarySync {
  landId: string;
  boundary: FarmBoundary;
  createdAt: string;
  retryCount: number;
}

/**
 * Save boundary draft to localStorage for offline support
 */
export function saveBoundaryDraft(
  points: Coordinate[],
  mode: 'walk' | 'draw',
  landId?: string
): void {
  const draft: BoundaryDraft = {
    landId,
    points,
    mode,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
  
  try {
    localStorage.setItem(BOUNDARY_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn('Failed to save boundary draft to localStorage:', error);
  }
}

/**
 * Load boundary draft from localStorage
 */
export function loadBoundaryDraft(): BoundaryDraft | null {
  try {
    const data = localStorage.getItem(BOUNDARY_STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as BoundaryDraft;
    }
  } catch (error) {
    console.warn('Failed to load boundary draft:', error);
  }
  return null;
}

/**
 * Clear boundary draft from localStorage
 */
export function clearBoundaryDraft(): void {
  try {
    localStorage.removeItem(BOUNDARY_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear boundary draft:', error);
  }
}

/**
 * Add boundary to pending sync queue (for offline scenarios)
 */
export function addToPendingSync(landId: string, boundary: FarmBoundary): void {
  try {
    const existing = getPendingSyncs();
    const pending: PendingBoundarySync = {
      landId,
      boundary,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    
    // Replace if same landId exists, otherwise add
    const updated = existing.filter(p => p.landId !== landId);
    updated.push(pending);
    
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to add to pending sync:', error);
  }
}

/**
 * Get all pending boundary syncs
 */
export function getPendingSyncs(): PendingBoundarySync[] {
  try {
    const data = localStorage.getItem(PENDING_SYNC_KEY);
    if (data) {
      return JSON.parse(data) as PendingBoundarySync[];
    }
  } catch (error) {
    console.warn('Failed to get pending syncs:', error);
  }
  return [];
}

/**
 * Remove a boundary from pending sync queue
 */
export function removePendingSync(landId: string): void {
  try {
    const existing = getPendingSyncs();
    const updated = existing.filter(p => p.landId !== landId);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to remove pending sync:', error);
  }
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Subscribe to online/offline events
 */
export function subscribeToConnectivity(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Attempt to sync pending boundaries when online
 */
export async function syncPendingBoundaries(
  syncFn: (landId: string, boundary: FarmBoundary) => Promise<boolean>
): Promise<{ success: number; failed: number }> {
  if (!isOnline()) {
    return { success: 0, failed: 0 };
  }

  const pending = getPendingSyncs();
  let success = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const result = await syncFn(item.landId, item.boundary);
      if (result) {
        removePendingSync(item.landId);
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to sync boundary for land ${item.landId}:`, error);
      failed++;
    }
  }

  return { success, failed };
}
