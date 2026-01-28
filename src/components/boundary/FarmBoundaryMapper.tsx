// Farm Boundary Mapper Component
// Allows users to map their farm boundary using GPS walk or manual drawing

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Pencil, 
  Play, 
  Square, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Info,
  Footprints,
  Ruler
} from 'lucide-react';
import { useGPSTracking } from '../../hooks/useGPSTracking';
import { 
  calculateBoundaryStats, 
  formatArea, 
  isValidPolygon,
  simplifyPolygon 
} from '../../utils/geoCalculations';
import { 
  saveBoundaryDraft, 
  loadBoundaryDraft, 
  clearBoundaryDraft,
  isOnline,
  subscribeToConnectivity
} from '../../utils/boundaryStorage';
import type { Coordinate, FarmBoundary } from '../../types/boundary';

// Utility function to check if two line segments intersect
function doSegmentsIntersect(
  p1: Coordinate, p2: Coordinate, 
  p3: Coordinate, p4: Coordinate
): boolean {
  const ccw = (A: Coordinate, B: Coordinate, C: Coordinate) => {
    return (C.lat - A.lat) * (B.lng - A.lng) > (B.lat - A.lat) * (C.lng - A.lng);
  };
  
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

// Check if polygon has self-intersecting edges
function checkSelfIntersection(points: Coordinate[]): boolean {
  if (points.length < 4) return false;
  
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    
    for (let j = i + 2; j < points.length; j++) {
      // Don't check adjacent edges
      if (j === (i + points.length - 1) % points.length) continue;
      
      const p3 = points[j];
      const p4 = points[(j + 1) % points.length];
      
      if (doSegmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }
  
  return false;
}

interface FarmBoundaryMapperProps {
  onBoundaryComplete: (boundary: FarmBoundary) => void;
  onCancel?: () => void;
  initialCoordinates?: Coordinate[];
  language?: 'english' | 'tamil';
}

// Translations
const translations = {
  english: {
    title: 'Smart Farm Boundary Mapping',
    subtitle: 'Map your farm boundary for accurate area calculation',
    walkMode: 'Walk Mode',
    walkModeDesc: 'Walk around your farm boundary with GPS tracking',
    pointMode: 'Point Mode',
    pointModeDesc: 'Tap points on the map to mark boundary corners',
    drawMode: 'Draw Mode',
    drawModeDesc: 'Draw freely on the map with your finger (2-finger to pan)',
    startMapping: 'Start Mapping',
    stopMapping: 'Stop Mapping',
    reset: 'Reset',
    saveBoundary: 'Save Boundary',
    cancel: 'Cancel',
    gpsAccuracy: 'GPS Accuracy',
    meters: 'meters',
    pointsCaptured: 'Points Captured',
    estimatedArea: 'Estimated Area',
    perimeter: 'Perimeter',
    offline: 'Offline - Data will sync when connected',
    online: 'Online',
    disclaimer: 'Approximate mapping for advisory purposes. Not survey-accurate.',
    minPoints: 'Need at least 3 points to form a boundary',
    gpsError: 'GPS Error',
    tapToAddPoint: 'Tap on map to add boundary points',
    drawInstructions: 'Hold and drag to draw boundary (2-finger to move map)',
    walkInstructions: 'Walk slowly along your farm boundary',
    draftLoaded: 'Previous draft loaded',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  },
  tamil: {
    title: 'ஸ்மார்ட் பண்ணை எல்லை வரைபடம்',
    subtitle: 'துல்லியமான பரப்பளவு கணக்கிற்கு உங்கள் பண்ணை எல்லையை வரையுங்கள்',
    walkMode: 'நடை முறை',
    walkModeDesc: 'GPS கண்காணிப்புடன் உங்கள் பண்ணை எல்லையை நடந்து செல்லுங்கள்',
    pointMode: 'புள்ளி முறை',
    pointModeDesc: 'எல்லை மூலைகளை குறிக்க வரைபடத்தில் புள்ளிகளை தட்டவும்',
    drawMode: 'வரைதல் முறை',
    drawModeDesc: 'உங்கள் விரலால் வரைபடத்தில் சுதந்திரமாக வரையுங்கள் (2-விரல் நகர்த்த)',
    startMapping: 'வரைபடம் தொடங்கு',
    stopMapping: 'Stop Mapping',
    reset: 'Reset',
    saveBoundary: 'Save Boundary',
    cancel: 'Cancel',
    gpsAccuracy: 'GPS Accuracy',
    meters: 'meters',
    pointsCaptured: 'Points Captured',
    estimatedArea: 'Estimated Area',
    perimeter: 'Perimeter',
    offline: 'Offline - Data will sync when connected',
    online: 'Online',
    disclaimer: 'Approximate mapping for advisory purposes. Not survey-accurate.',
    minPoints: 'Need at least 3 points to form a boundary',
    gpsError: 'GPS Error',
    tapToAddPoint: 'Tap on map to add boundary points',
    drawInstructions: 'Hold and drag to draw boundary (2-finger to move map)',
    walkInstructions: 'Walk slowly along your farm boundary',
    draftLoaded: 'Previous draft loaded',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  },
  tamil: {
    title: 'ஸ்மார்ட் பண்ணை எல்லை வரைபடம்',
    subtitle: 'துல்லியமான பரப்பளவு கணக்கிற்கு உங்கள் பண்ணை எல்லையை வரையுங்கள்',
    walkMode: 'நடை முறை',
    walkModeDesc: 'GPS கண்காணிப்புடன் உங்கள் பண்ணை எல்லையை நடந்து செல்லுங்கள்',
    pointMode: 'புள்ளி முறை',
    pointModeDesc: 'எல்லை மூலைகளை குறிக்க வரைபடத்தில் புள்ளிகளை தட்டவும்',
    drawMode: 'வரைதல் முறை',
    drawModeDesc: 'உங்கள் விரலால் வரைபடத்தில் சுதந்திரமாக வரையுங்கள் (2-விரல் நகர்த்த)',
    startMapping: 'வரைபடம் தொடங்கு',
    stopMapping: 'வரைபடம் நிறுத்து',
    reset: 'மீட்டமை',
    saveBoundary: 'எல்லையை சேமி',
    cancel: 'ரத்து செய்',
    gpsAccuracy: 'GPS துல்லியம்',
    meters: 'மீட்டர்',
    pointsCaptured: 'பிடிக்கப்பட்ட புள்ளிகள்',
    estimatedArea: 'மதிப்பிடப்பட்ட பரப்பளவு',
    perimeter: 'சுற்றளவு',
    offline: 'ஆஃப்லைன் - இணைக்கப்படும்போது தரவு ஒத்திசைக்கப்படும்',
    online: 'ஆன்லைன்',
    disclaimer: 'ஆலோசனை நோக்கங்களுக்கான தோராயமான வரைபடம். கணக்கெடுப்பு துல்லியமானது அல்ல.',
    minPoints: 'எல்லை உருவாக்க குறைந்தது 3 புள்ளிகள் தேவை',
    gpsError: 'GPS பிழை',
    tapToAddPoint: 'எல்லை புள்ளிகளைச் சேர்க்க வரைபடத்தில் தட்டவும்',
    drawInstructions: 'எல்லையை வரைய பிடித்து இழுக்கவும் (வரைபடத்தை நகர்த்த 2-விரல்)',
    walkInstructions: 'உங்கள் பண்ணை எல்லையில் மெதுவாக நடக்கவும்',
    draftLoaded: 'முந்தைய வரைவு ஏற்றப்பட்டது',
    excellent: 'அருமை',
    good: 'நல்லது',
    fair: 'சரி',
    poor: 'மோசம்',
  },
};

export default function FarmBoundaryMapper({
  onBoundaryComplete,
  onCancel,
  initialCoordinates,
  language = 'english',
}: FarmBoundaryMapperProps) {
  const t = translations[language];
  
  // State
  const [mode, setMode] = useState<'walk' | 'point' | 'draw'>('walk');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConnected, setIsConnected] = useState(isOnline());
  const [drawPoints, setDrawPoints] = useState<Coordinate[]>(initialCoordinates || []);
  const [mapReady, setMapReady] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPath, setDrawPath] = useState<Coordinate[]>([]);

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const currentPosMarkerRef = useRef<any>(null);
  const drawLayerRef = useRef<any>(null);

  // GPS tracking hook
  const {
    isTracking,
    currentPosition,
    trackedPoints,
    accuracy,
    error: gpsError,
    startTracking,
    stopTracking,
    addManualPoint,
    clearPoints,
    getCurrentPosition,
  } = useGPSTracking({
    enableHighAccuracy: true,
    minimumDistanceMeters: 3,
    captureIntervalMs: 2000,
  });

  // Get current points based on mode
  const currentPoints = mode === 'walk' ? trackedPoints : drawPoints;

  // Calculate boundary stats
  const boundaryStats = currentPoints.length >= 3 
    ? calculateBoundaryStats(currentPoints, mode) 
    : null;

  // Online/offline status
  useEffect(() => {
    const unsubscribe = subscribeToConnectivity(
      () => setIsConnected(true),
      () => setIsConnected(false)
    );
    return unsubscribe;
  }, []);

  // Load draft on mount
  useEffect(() => {
    const draft = loadBoundaryDraft();
    if (draft && draft.points.length > 0) {
      if (draft.mode === 'draw') {
        setDrawPoints(draft.points);
        setMode('draw');
      }
      setShowDraftNotice(true);
      setTimeout(() => setShowDraftNotice(false), 3000);
    }
  }, []);

  // Save draft when points change
  useEffect(() => {
    if (currentPoints.length > 0) {
      saveBoundaryDraft(currentPoints, mode);
    }
  }, [currentPoints, mode]);

  // Initialize Leaflet map
  useEffect(() => {
    // @ts-ignore - Leaflet loaded via CDN
    const L = (window as any).L;
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    // Default center (Tamil Nadu)
    const defaultCenter: [number, number] = [11.1271, 78.6569];
    const map = L.map(mapContainerRef.current).setView(defaultCenter, 15);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create layers for polygon and markers
    polygonLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    drawLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    // Get initial position and center map
    getCurrentPosition().then((pos) => {
      if (pos && mapInstanceRef.current) {
        mapInstanceRef.current.setView([pos.lat, pos.lng], 17);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle map interactions for point and draw modes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    // @ts-ignore
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    const handleMapClick = (e: any) => {
      if (mode === 'point') {
        // Point mode: single tap to add point
        const coord: Coordinate = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          timestamp: Date.now(),
        };
        setDrawPoints(prev => [...prev, coord]);
      }
    };

    const handleMouseDown = (e: any) => {
      if (mode === 'draw' && !isDrawing) {
        // Check if it's a multi-touch (2+ fingers) - allow map panning
        if (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length > 1) {
          return; // Let map handle multi-touch for panning
        }
        
        setIsDrawing(true);
        setDrawPath([]);
        map.dragging.disable(); // Disable map dragging during draw
        map.touchZoom.disable(); // Disable pinch zoom during draw
        
        const coord: Coordinate = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          timestamp: Date.now(),
        };
        setDrawPath([coord]);
      }
    };

    const handleMouseMove = (e: any) => {
      if (mode === 'draw' && isDrawing) {
        const coord: Coordinate = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          timestamp: Date.now(),
        };
        setDrawPath(prev => [...prev, coord]);
      }
    };

    const handleMouseUp = () => {
      if (mode === 'draw' && isDrawing) {
        setIsDrawing(false);
        map.dragging.enable(); // Re-enable map dragging
        map.touchZoom.enable(); // Re-enable pinch zoom
        
        // Convert draw path to simplified points
        if (drawPath.length > 5) {
          // Simplify the path (keep every 5th point for smoother boundary)
          const simplified = drawPath.filter((_, idx) => idx % 5 === 0);
          setDrawPoints(prev => [...prev, ...simplified]);
        }
        setDrawPath([]);
      }
    };

    // Attach both mouse and touch events
    map.on('click', handleMapClick);
    map.on('mousedown', handleMouseDown);
    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);
    
    // Touch events for mobile
    map.on('touchstart', handleMouseDown);
    map.on('touchmove', handleMouseMove);
    map.on('touchend', handleMouseUp);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousedown', handleMouseDown);
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
      map.off('touchstart', handleMouseDown);
      map.off('touchmove', handleMouseMove);
      map.off('touchend', handleMouseUp);
    };
  }, [mode, mapReady, isDrawing, drawPath]);

  // Visualize active drawing path
  useEffect(() => {
    // @ts-ignore
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !drawLayerRef.current) return;

    drawLayerRef.current.clearLayers();

    if (drawPath.length > 1) {
      const latlngs = drawPath.map(p => [p.lat, p.lng]);
      const polyline = L.polyline(latlngs, {
        color: '#3B82F6',
        weight: 3,
        opacity: 0.8,
      });
      drawLayerRef.current.addLayer(polyline);
    }
  }, [drawPath]);

  // Update map visualization
  useEffect(() => {
    // @ts-ignore
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !polygonLayerRef.current || !markersLayerRef.current) return;

    // Clear existing layers
    polygonLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();

    if (currentPoints.length === 0) return;

    // Add draggable markers for each point (only in point mode)
    currentPoints.forEach((point, index) => {
      const isFirst = index === 0;
      const isLast = index === currentPoints.length - 1;
      
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: isFirst || isLast ? 8 : 6,
        fillColor: isFirst ? '#10B981' : isLast ? '#EF4444' : '#3B82F6',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      });
      
      if (mode === 'point') {
        // Only show drag tooltips in point mode
        if (isFirst) {
          marker.bindTooltip('Start (Drag to move)', { permanent: false });
        } else if (isLast && currentPoints.length > 1) {
          marker.bindTooltip('End (Drag to move)', { permanent: false });
        } else {
          marker.bindTooltip(`Point ${index + 1} (Drag to move)`, { permanent: false });
        }
      } else {
        // Simple tooltips for draw mode
        if (isFirst) {
          marker.bindTooltip('Start', { permanent: false });
        } else if (isLast && currentPoints.length > 1) {
          marker.bindTooltip('End', { permanent: false });
        }
      }
      
      // Handle point dragging (only in point mode)
      if (mode === 'point') {
        const setupDragHandlers = (startEvent: any) => {
          const map = mapInstanceRef.current;
          if (!map) return;

          // Prevent map dragging while dragging marker
          map.dragging.disable();
          map.touchZoom.disable();
        
          let currentMarker = marker;
          
          const getMoveEvent = (e: any) => {
            // Handle both mouse and touch events
            if (e.touches && e.touches.length > 0) {
              return e.touches[0];
            }
            return e;
          };
          
          const onMove = (moveEvent: any) => {
            const touchEvent = getMoveEvent(moveEvent.originalEvent || moveEvent);
            let newLatLng;
            
            if (touchEvent.clientX !== undefined) {
              // Convert screen coordinates to map coordinates
              const point = map.containerPointToLatLng([touchEvent.clientX, touchEvent.clientY]);
              newLatLng = point;
            } else {
              newLatLng = map.mouseEventToLatLng(moveEvent.originalEvent);
            }
            
            currentMarker.setLatLng(newLatLng);
            
            // Update the point in state
            setDrawPoints(prevPoints => {
              const newPoints = [...prevPoints];
              newPoints[index] = {
                lat: newLatLng.lat,
                lng: newLatLng.lng,
                timestamp: Date.now(),
              };
              return newPoints;
            });
          };
          
          const onEnd = () => {
            map.dragging.enable();
            map.touchZoom.enable();
            map.off('mousemove', onMove);
            map.off('mouseup', onEnd);
            map.off('touchmove', onMove);
            map.off('touchend', onEnd);
            
            // Check for point merging (within 10 meters)
            const MERGE_THRESHOLD = 0.0001; // ~10 meters
            const draggedPoint = {
              lat: currentMarker.getLatLng().lat,
              lng: currentMarker.getLatLng().lng,
              timestamp: Date.now(),
            };
            
            setDrawPoints(prevPoints => {
              let merged = false;
              const newPoints = prevPoints.map((p, i) => {
                if (i !== index) {
                  const distance = Math.sqrt(
                    Math.pow(p.lat - draggedPoint.lat, 2) + 
                    Math.pow(p.lng - draggedPoint.lng, 2)
                  );
                  if (distance < MERGE_THRESHOLD) {
                    merged = true;
                    return null; // Mark for removal
                  }
                }
                return i === index ? draggedPoint : p;
              }).filter(p => p !== null) as Coordinate[];
              
              return newPoints;
            });
          };
          
          map.on('mousemove', onMove);
          map.on('mouseup', onEnd);
          map.on('touchmove', onMove);
          map.on('touchend', onEnd);
        };
        
        // Attach both mouse and touch handlers
        marker.on('mousedown', setupDragHandlers);
        marker.on('touchstart', setupDragHandlers);
      }
      
      markersLayerRef.current.addLayer(marker);
    });

    // Draw polygon if we have at least 3 points
    if (currentPoints.length >= 3) {
      const latlngs = currentPoints.map(p => [p.lat, p.lng]);
      
      // Check for self-intersecting edges
      const hasSelfIntersection = checkSelfIntersection(currentPoints);
      
      const polygon = L.polygon(latlngs, {
        color: hasSelfIntersection ? '#EF4444' : '#10B981',
        fillColor: hasSelfIntersection ? '#FEE2E2' : '#10B981',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: hasSelfIntersection ? '5, 5' : undefined,
      });
      
      if (hasSelfIntersection) {
        polygon.bindTooltip('Warning: Edges are crossing! Adjust points to fix.', { 
          permanent: true, 
          className: 'error-tooltip',
          direction: 'center'
        });
      }
      
      polygonLayerRef.current.addLayer(polygon);

      // Fit bounds to polygon
      mapInstanceRef.current.fitBounds(polygon.getBounds(), { padding: [50, 50] });
    } else if (currentPoints.length > 0) {
      // Draw polyline for less than 3 points
      const latlngs = currentPoints.map(p => [p.lat, p.lng]);
      const polyline = L.polyline(latlngs, {
        color: '#3B82F6',
        weight: 2,
        dashArray: '5, 5',
      });
      polygonLayerRef.current.addLayer(polyline);
    }
  }, [currentPoints, mode]);

  // Update current position marker
  useEffect(() => {
    // @ts-ignore
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;

    if (currentPosMarkerRef.current) {
      mapInstanceRef.current.removeLayer(currentPosMarkerRef.current);
    }

    if (currentPosition && isTracking) {
      const pulseIcon = L.divIcon({
        className: 'pulse-marker',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: #3B82F6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
            animation: pulse 2s infinite;
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      currentPosMarkerRef.current = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: pulseIcon,
      }).addTo(mapInstanceRef.current);

      // Center map on current position during tracking
      mapInstanceRef.current.setView([currentPosition.lat, currentPosition.lng], 18, {
        animate: true,
      });
    }
  }, [currentPosition, isTracking]);

  // Handlers
  const handleStartMapping = useCallback(() => {
    if (mode === 'walk') {
      clearPoints();
      startTracking();
    }
  }, [mode, clearPoints, startTracking]);

  const handleStopMapping = useCallback(() => {
    if (mode === 'walk') {
      const points = stopTracking();
      // Simplify points to reduce noise
      if (points.length > 10) {
        const simplified = simplifyPolygon(points, 5);
        // We can't directly update trackedPoints, so we use the raw points
      }
    }
  }, [mode, stopTracking]);

  const handleReset = useCallback(() => {
    if (mode === 'walk') {
      clearPoints();
    } else {
      setDrawPoints([]);
    }
    clearBoundaryDraft();
  }, [mode, clearPoints]);

  const handleSaveBoundary = useCallback(() => {
    if (!boundaryStats || currentPoints.length < 3) return;

    const boundary: FarmBoundary = {
      ...boundaryStats,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    clearBoundaryDraft();
    onBoundaryComplete(boundary);
  }, [boundaryStats, currentPoints, onBoundaryComplete]);

  const handleModeChange = useCallback((newMode: 'walk' | 'draw') => {
    if (isTracking) {
      stopTracking();
    }
    setMode(newMode);
  }, [isTracking, stopTracking]);

  // GPS accuracy indicator
  const getAccuracyLevel = (acc: number): { label: string; color: string } => {
    if (acc <= 5) return { label: t.excellent, color: 'text-green-600' };
    if (acc <= 10) return { label: t.good, color: 'text-green-500' };
    if (acc <= 20) return { label: t.fair, color: 'text-yellow-500' };
    return { label: t.poor, color: 'text-red-500' };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">{t.title}</h3>
              <p className="text-xs text-green-600">{t.subtitle}</p>
            </div>
          </div>
          <button className="p-1 hover:bg-green-100 rounded-full transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-green-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-green-600" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full w-fit ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? t.online : t.offline}
          </div>

          {/* Draft Notice */}
          {showDraftNotice && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <Info className="w-4 h-4" />
              {t.draftLoaded}
            </div>
          )}

          {/* Mode Selection */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('walk')}
              disabled={isTracking}
              className={`p-3 rounded-lg border-2 transition-all ${
                mode === 'walk'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isTracking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Footprints className={`w-6 h-6 mx-auto mb-1 ${
                mode === 'walk' ? 'text-green-600' : 'text-gray-500'
              }`} />
              <div className="text-sm font-medium">{t.walkMode}</div>
              <div className="text-xs text-gray-500">{t.walkModeDesc}</div>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('point')}
              disabled={isTracking}
              className={`p-3 rounded-lg border-2 transition-all ${
                mode === 'point'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isTracking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MapPin className={`w-6 h-6 mx-auto mb-1 ${
                mode === 'point' ? 'text-green-600' : 'text-gray-500'
              }`} />
              <div className="text-sm font-medium">{t.pointMode}</div>
              <div className="text-xs text-gray-500">{t.pointModeDesc}</div>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('draw')}
              disabled={isTracking}
              className={`p-3 rounded-lg border-2 transition-all ${
                mode === 'draw'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isTracking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Pencil className={`w-6 h-6 mx-auto mb-1 ${
                mode === 'draw' ? 'text-green-600' : 'text-gray-500'
              }`} />
              <div className="text-sm font-medium">{t.drawMode}</div>
              <div className="text-xs text-gray-500">{t.drawModeDesc}</div>
            </button>
          </div>

          {/* Map Container */}
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <div 
              ref={mapContainerRef} 
              className="w-full h-64 bg-gray-100"
              style={{ minHeight: '256px' }}
            />
            
            {/* Map Overlay Instructions */}
            {mode === 'point' && !isTracking && currentPoints.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <div className="bg-white px-4 py-2 rounded-full shadow-lg text-sm">
                  {t.tapToAddPoint}
                </div>
              </div>
            )}
            
            {mode === 'draw' && !isTracking && currentPoints.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <div className="bg-white px-4 py-2 rounded-full shadow-lg text-sm">
                  {t.drawInstructions}
                </div>
              </div>
            )}

            {mode === 'walk' && isTracking && (
              <div className="absolute top-2 left-2 bg-white px-3 py-1.5 rounded-full shadow text-sm flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                {t.walkInstructions}
              </div>
            )}
          </div>

          {/* Stats Panel */}
          <div className="grid grid-cols-2 gap-3">
            {/* GPS Accuracy (Walk mode) */}
            {mode === 'walk' && accuracy !== null && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{t.gpsAccuracy}</div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-bold ${getAccuracyLevel(accuracy).color}`}>
                    {accuracy.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">{t.meters}</span>
                </div>
                <div className={`text-xs ${getAccuracyLevel(accuracy).color}`}>
                  {getAccuracyLevel(accuracy).label}
                </div>
              </div>
            )}

            {/* Points Captured */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">{t.pointsCaptured}</div>
              <div className="text-lg font-bold text-gray-800">
                {currentPoints.length}
              </div>
              {currentPoints.length < 3 && (
                <div className="text-xs text-yellow-600">{t.minPoints}</div>
              )}
            </div>

            {/* Estimated Area */}
            {boundaryStats && (
              <>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-600 mb-1">{t.estimatedArea}</div>
                  <div className="text-lg font-bold text-green-800">
                    {formatArea(boundaryStats.area.sqMeters)}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">{t.perimeter}</div>
                  <div className="text-lg font-bold text-blue-800">
                    {(boundaryStats.perimeter / 1000).toFixed(2)} km
                  </div>
                </div>
              </>
            )}
          </div>

          {/* GPS Error */}
          {gpsError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {gpsError}
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {t.disclaimer}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {mode === 'walk' && (
              <>
                {!isTracking ? (
                  <button
                    type="button"
                    onClick={handleStartMapping}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {t.startMapping}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopMapping}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    {t.stopMapping}
                  </button>
                )}
              </>
            )}

            {currentPoints.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-1 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t.reset}
              </button>
            )}
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.cancel}
              </button>
            )}
            
            <button
              type="button"
              onClick={handleSaveBoundary}
              disabled={!isValidPolygon(currentPoints)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isValidPolygon(currentPoints)
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              {t.saveBoundary}
            </button>
          </div>
        </div>
      )}

      {/* CSS for pulse animation and error tooltip */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        .error-tooltip {
          background-color: #FEE2E2 !important;
          color: #991B1B !important;
          border: 2px solid #EF4444 !important;
          font-weight: 600 !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        }
        
        .leaflet-interactive:hover {
          cursor: move !important;
        }
      `}</style>
    </div>
  );
}
