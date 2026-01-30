import { useEffect, useRef, useState } from 'react';
import type { FarmBoundaryData } from '../../types/land';
import { GOOGLE_MAPS_API_KEY } from '../../config/api';

interface BoundaryPreviewProps {
  boundary: FarmBoundaryData;
  className?: string;
}

export default function BoundaryPreview({ boundary, className = '' }: BoundaryPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !boundary?.coordinates?.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.width;
    const height = canvas.height;

    // Calculate bounds
    const lats = boundary.coordinates.map(c => c.lat);
    const lngs = boundary.coordinates.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate zoom level based on area
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 16;
    if (maxDiff > 0.01) zoom = 14;
    if (maxDiff > 0.02) zoom = 13;
    if (maxDiff > 0.05) zoom = 12;
    if (maxDiff > 0.1) zoom = 11;

    // Load Google Maps Static image
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&maptype=satellite&scale=2&key=${GOOGLE_MAPS_API_KEY}`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw the Google Maps satellite image
      ctx.drawImage(img, 0, 0, width, height);
      setMapLoaded(true);
      
      // Now draw the boundary overlay
      drawBoundaryOverlay(ctx, width, height, boundary, minLat, maxLat, minLng, maxLng);
    };
    
    img.onerror = () => {
      // Fallback to custom rendering if Google Maps fails
      drawFallbackMap(ctx, width, height, boundary, minLat, maxLat, minLng, maxLng);
    };
    
    img.src = mapUrl;
  }, [boundary]);

  const drawBoundaryOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    boundary: FarmBoundaryData,
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ) => {
    const padding = 20;
    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    const scaleX = (width - 2 * padding) / lngRange;
    const scaleY = (height - 2 * padding) / latRange;
    const scale = Math.min(scaleX, scaleY);

    const toCanvasX = (lng: number) => padding + (lng - minLng) * scale;
    const toCanvasY = (lat: number) => height - padding - (lat - minLat) * scale;

    // Draw boundary fill with semi-transparent yellow
    ctx.beginPath();
    boundary.coordinates.forEach((coord, i) => {
      const x = toCanvasX(coord.lng);
      const y = toCanvasY(coord.lat);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(255, 235, 59, 0.35)';
    ctx.fill();

    // Draw boundary outline
    ctx.strokeStyle = '#FDD835';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw corner markers
    boundary.coordinates.forEach((coord) => {
      const x = toCanvasX(coord.lng);
      const y = toCanvasY(coord.lat);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#FDD835';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw centroid pin
    if (boundary.centroid) {
      const cx = toCanvasX(boundary.centroid.lng);
      const cy = toCanvasY(boundary.centroid.lat);
      
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8, 4, 2, 0, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 4, cy - 8);
      ctx.lineTo(cx + 4, cy - 8);
      ctx.closePath();
      ctx.fillStyle = '#EA4335';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#EA4335';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  };

  const drawFallbackMap = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    boundary: FarmBoundaryData,
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number
  ) => {
    // Satellite-style background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#5a6b55');
    gradient.addColorStop(0.3, '#6a7b65');
    gradient.addColorStop(0.6, '#7a8b75');
    gradient.addColorStop(1, '#8a9b85');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add field patches
    ctx.fillStyle = 'rgba(40, 60, 40, 0.3)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = Math.random() * 50 + 30;
      const h = Math.random() * 50 + 30;
      ctx.fillRect(x, y, w, h);
    }

    // Add texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 1;
      ctx.fillRect(x, y, size, size);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      ctx.fillRect(x, y, size, size);
    }

    drawBoundaryOverlay(ctx, width, height, boundary, minLat, maxLat, minLng, maxLng);
  };
  }, [boundary]);

  if (!boundary?.coordinates?.length) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={240}
      className={className}
    />
  );
}
