// Utility functions for geographic calculations (area, distance, etc.)
import type { Coordinate, FarmBoundary } from '../types/boundary';

/**
 * Calculate the area of a polygon using the Shoelace formula (Gauss's area formula)
 * Works with geographic coordinates by converting to a local Cartesian system
 * 
 * @param coordinates Array of lat/lng coordinates forming a closed polygon
 * @returns Area in square meters
 */
export function calculatePolygonArea(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0;

  // Use the centroid as origin for local coordinate transformation
  const centroid = calculateCentroid(coordinates);
  
  // Convert lat/lng to local X/Y meters using Haversine-based projection
  const localPoints = coordinates.map(coord => {
    const x = haversineDistance(
      { lat: centroid.lat, lng: coord.lng },
      { lat: centroid.lat, lng: centroid.lng }
    ) * (coord.lng > centroid.lng ? 1 : -1);
    
    const y = haversineDistance(
      { lat: coord.lat, lng: centroid.lng },
      { lat: centroid.lat, lng: centroid.lng }
    ) * (coord.lat > centroid.lat ? 1 : -1);
    
    return { x, y };
  });

  // Shoelace formula for area calculation
  let area = 0;
  const n = localPoints.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += localPoints[i].x * localPoints[j].y;
    area -= localPoints[j].x * localPoints[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Calculate centroid (center point) of a polygon
 */
export function calculateCentroid(coordinates: Coordinate[]): Coordinate {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
}

/**
 * Calculate perimeter of a polygon in meters
 */
export function calculatePerimeter(coordinates: Coordinate[]): number {
  if (coordinates.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const next = (i + 1) % coordinates.length;
    perimeter += haversineDistance(coordinates[i], coordinates[next]);
  }
  
  return perimeter;
}

/**
 * Haversine formula to calculate distance between two points on Earth
 * 
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371000; // Earth's radius in meters
  
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);
  const deltaLat = toRadians(coord2.lat - coord1.lat);
  const deltaLng = toRadians(coord2.lng - coord1.lng);

  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert square meters to acres
 */
export function sqMetersToAcres(sqMeters: number): number {
  return sqMeters / 4046.8564224;
}

/**
 * Convert square meters to hectares
 */
export function sqMetersToHectares(sqMeters: number): number {
  return sqMeters / 10000;
}

/**
 * Calculate complete boundary statistics
 */
export function calculateBoundaryStats(
  coordinates: Coordinate[],
  mode: 'walk' | 'draw'
): Omit<FarmBoundary, 'createdAt' | 'updatedAt'> {
  const sqMeters = calculatePolygonArea(coordinates);
  
  return {
    coordinates,
    area: {
      sqMeters,
      acres: sqMetersToAcres(sqMeters),
      hectares: sqMetersToHectares(sqMeters),
    },
    perimeter: calculatePerimeter(coordinates),
    centroid: calculateCentroid(coordinates),
    mappingMode: mode,
    isApproximate: true, // GPS-based mapping is always approximate
  };
}

/**
 * Simplify a polygon by removing points that are too close together
 * Useful for reducing noise in GPS track data
 * 
 * @param coordinates Original coordinates
 * @param minDistanceMeters Minimum distance between points
 * @returns Simplified coordinates array
 */
export function simplifyPolygon(
  coordinates: Coordinate[],
  minDistanceMeters: number = 5
): Coordinate[] {
  if (coordinates.length <= 3) return coordinates;

  const simplified: Coordinate[] = [coordinates[0]];
  
  for (let i = 1; i < coordinates.length; i++) {
    const lastPoint = simplified[simplified.length - 1];
    const currentPoint = coordinates[i];
    
    if (haversineDistance(lastPoint, currentPoint) >= minDistanceMeters) {
      simplified.push(currentPoint);
    }
  }

  // Always include the last point if it's different from what we have
  const last = coordinates[coordinates.length - 1];
  const lastSimplified = simplified[simplified.length - 1];
  if (last.lat !== lastSimplified.lat || last.lng !== lastSimplified.lng) {
    simplified.push(last);
  }

  return simplified;
}

/**
 * Format area for display with appropriate units
 */
export function formatArea(
  sqMeters: number,
  unit: 'acres' | 'hectares' | 'auto' = 'auto'
): string {
  if (unit === 'auto') {
    // Use acres for smaller areas (common in India), hectares for larger
    if (sqMeters < 40469) { // Less than 10 acres
      unit = 'acres';
    } else {
      unit = 'hectares';
    }
  }

  if (unit === 'acres') {
    const acres = sqMetersToAcres(sqMeters);
    return `${acres.toFixed(2)} acres`;
  } else {
    const hectares = sqMetersToHectares(sqMeters);
    return `${hectares.toFixed(2)} hectares`;
  }
}

/**
 * Validate if coordinates form a valid polygon
 */
export function isValidPolygon(coordinates: Coordinate[]): boolean {
  // Need at least 3 points
  if (coordinates.length < 3) return false;
  
  // Check for distinct points
  const uniquePoints = new Set(
    coordinates.map(c => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`)
  );
  
  return uniquePoints.size >= 3;
}

/**
 * Check if a point is inside a polygon (Ray casting algorithm)
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    
    if (
      ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)
    ) {
      inside = !inside;
    }
  }
  
  return inside;
}
