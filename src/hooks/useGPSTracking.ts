// Custom hook for GPS tracking in Farm Boundary Mapping
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Coordinate } from '../types/boundary';

interface GPSTrackingOptions {
  enableHighAccuracy?: boolean;
  minimumDistanceMeters?: number;
  captureIntervalMs?: number;
  maxPoints?: number;
}

interface GPSTrackingState {
  isTracking: boolean;
  currentPosition: Coordinate | null;
  trackedPoints: Coordinate[];
  accuracy: number | null;
  error: string | null;
  isWatchingPosition: boolean;
}

interface GPSTrackingActions {
  startTracking: () => void;
  stopTracking: () => Coordinate[];
  addManualPoint: (coord: Coordinate) => void;
  clearPoints: () => void;
  getCurrentPosition: () => Promise<Coordinate | null>;
}

const DEFAULT_OPTIONS: Required<GPSTrackingOptions> = {
  enableHighAccuracy: true,
  minimumDistanceMeters: 3, // Minimum distance between captured points
  captureIntervalMs: 2000, // Capture point every 2 seconds
  maxPoints: 500, // Maximum points to prevent memory issues
};

/**
 * Calculate distance between two coordinates in meters (simplified)
 */
function getDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGPSTracking(
  options: GPSTrackingOptions = {}
): GPSTrackingState & GPSTrackingActions {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Coordinate | null>(null);
  const [trackedPoints, setTrackedPoints] = useState<Coordinate[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWatchingPosition, setIsWatchingPosition] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastCaptureRef = useRef<number>(0);
  const lastPointRef = useRef<Coordinate | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      const coord: Coordinate = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy,
      };

      setCurrentPosition(coord);
      setAccuracy(position.coords.accuracy);
      setError(null);

      if (isTracking) {
        const now = Date.now();
        const timeSinceLastCapture = now - lastCaptureRef.current;
        
        // Check if enough time has passed and minimum distance is met
        const shouldCapture =
          timeSinceLastCapture >= opts.captureIntervalMs &&
          (lastPointRef.current === null ||
            getDistance(lastPointRef.current, coord) >= opts.minimumDistanceMeters);

        if (shouldCapture) {
          setTrackedPoints(prev => {
            if (prev.length >= opts.maxPoints) {
              return prev; // Don't exceed max points
            }
            return [...prev, coord];
          });
          lastCaptureRef.current = now;
          lastPointRef.current = coord;
        }
      }
    },
    [isTracking, opts.captureIntervalMs, opts.minimumDistanceMeters, opts.maxPoints]
  );

  const handlePositionError = useCallback((posError: GeolocationPositionError) => {
    let message: string;
    switch (posError.code) {
      case posError.PERMISSION_DENIED:
        message = 'Location permission denied. Please enable GPS access.';
        break;
      case posError.POSITION_UNAVAILABLE:
        message = 'Location unavailable. Make sure GPS is enabled.';
        break;
      case posError.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;
      default:
        message = 'An unknown error occurred while getting location.';
    }
    setError(message);
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already watching
    }

    setIsWatchingPosition(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [handlePositionUpdate, handlePositionError, opts.enableHighAccuracy]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatchingPosition(false);
    }
  }, []);

  const startTracking = useCallback(() => {
    setTrackedPoints([]);
    setError(null);
    lastCaptureRef.current = 0;
    lastPointRef.current = null;
    setIsTracking(true);
    startWatching();
  }, [startWatching]);

  const stopTracking = useCallback((): Coordinate[] => {
    setIsTracking(false);
    const points = trackedPoints;
    return points;
  }, [trackedPoints]);

  const addManualPoint = useCallback((coord: Coordinate) => {
    setTrackedPoints(prev => {
      if (prev.length >= opts.maxPoints) {
        return prev;
      }
      return [...prev, { ...coord, timestamp: Date.now() }];
    });
  }, [opts.maxPoints]);

  const clearPoints = useCallback(() => {
    setTrackedPoints([]);
    lastPointRef.current = null;
    lastCaptureRef.current = 0;
  }, []);

  const getCurrentPosition = useCallback((): Promise<Coordinate | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser.');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coord: Coordinate = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
          };
          setCurrentPosition(coord);
          setAccuracy(position.coords.accuracy);
          setError(null);
          resolve(coord);
        },
        (posError) => {
          handlePositionError(posError);
          resolve(null);
        },
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [handlePositionError, opts.enableHighAccuracy]);

  return {
    isTracking,
    currentPosition,
    trackedPoints,
    accuracy,
    error,
    isWatchingPosition,
    startTracking,
    stopTracking,
    addManualPoint,
    clearPoints,
    getCurrentPosition,
  };
}
