import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import html2canvas from 'html2canvas';
import type { FarmBoundaryData } from '../../types/land';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LeafletBoundaryPreviewProps {
  boundary: FarmBoundaryData;
  className?: string;
}

/**
 * FREE Satellite Map Preview Component
 * - Uses ESRI World Imagery (FREE, no API key needed)
 * - Shows real satellite terrain
 * - Displays land boundary with yellow Google Maps style
 */
export default function LeafletBoundaryPreview({ boundary, className = '' }: LeafletBoundaryPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !boundary?.coordinates?.length) return;

    // Calculate map center from boundary
    const lats = boundary.coordinates.map(c => c.lat);
    const lngs = boundary.coordinates.map(c => c.lng);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    // Calculate zoom level based on area
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 17;
    if (maxDiff > 0.005) zoom = 16;
    if (maxDiff > 0.01) zoom = 15;
    if (maxDiff > 0.02) zoom = 14;
    if (maxDiff > 0.05) zoom = 13;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });

    mapRef.current = map;

    // Add ESRI World Imagery layer (FREE satellite tiles, no API key required)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '',
    }).addTo(map);

    // Convert boundary coordinates to Leaflet format
    const latLngs: L.LatLngExpression[] = boundary.coordinates.map(coord => [coord.lat, coord.lng]);

    // Draw the boundary polygon with filled color only (no markers or pins)
    const polygon = L.polygon(latLngs, {
      color: '#FDD835',        // Yellow border
      fillColor: '#FFEB3B',    // Yellow fill
      fillOpacity: 0.35,       // Semi-transparent fill
      weight: 3,               // Thick border
    }).addTo(map);

    // Fit map to polygon bounds with padding
    map.fitBounds(polygon.getBounds(), { padding: [20, 20] });

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [boundary]);

  if (!boundary?.coordinates?.length) {
    return null;
  }

  return (
    <div 
      ref={mapContainerRef} 
      className={className}
      style={{ 
        width: '100%', 
        height: '240px',
        borderRadius: '0',
        overflow: 'hidden',
      }}
    />
  );
}

/**
 * Function to capture map as image for card preview
 * Call this after the map has fully loaded
 */
export async function captureMapAsImage(mapElement: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(mapElement, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f0f0f0',
      scale: 2, // Higher quality
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture map image:', error);
    return '';
  }
}
