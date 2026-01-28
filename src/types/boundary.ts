// Types for Farm Boundary Mapping feature

export interface Coordinate {
  lat: number;
  lng: number;
  timestamp?: number; // For GPS tracking
  accuracy?: number; // GPS accuracy in meters
}

export interface FarmBoundary {
  coordinates: Coordinate[];
  area: {
    sqMeters: number;
    acres: number;
    hectares: number;
  };
  perimeter: number; // in meters
  centroid: Coordinate;
  createdAt: string;
  updatedAt: string;
  mappingMode: 'walk' | 'draw';
  isApproximate: boolean;
}

export interface BoundaryMappingState {
  isMapping: boolean;
  mode: 'walk' | 'draw';
  points: Coordinate[];
  currentLocation: Coordinate | null;
  gpsAccuracy: number | null;
  isOnline: boolean;
  error: string | null;
}

export interface WaterRequirementEstimate {
  dailyLiters: number;
  weeklyLiters: number;
  monthlyLiters: number;
  source: string;
  factors: {
    cropType: string;
    landArea: number;
    weatherCondition: string;
    soilType: string;
  };
}

// Offline storage keys
export const BOUNDARY_STORAGE_KEY = 'farmees_boundary_draft';
export const PENDING_SYNC_KEY = 'farmees_pending_boundary_sync';
