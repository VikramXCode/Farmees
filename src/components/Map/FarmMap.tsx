import React, { useEffect, useRef, useState } from 'react';

// Types
interface Farmer {
    id: string;
    name: string;
    district: string;
    area: string;
    distance?: string;
    crops: string[];
    location?: { latitude: number; longitude: number };
}

interface FarmMapProps {
    farmers: Farmer[];
    userLocation: { area: string; district: string; name?: string } | null;
    height?: number;
    onMarkerClick?: (farmer: Farmer) => void;
}

// Tamil Nadu Bounds
const TAMILNADU_BOUNDS = {
    north: 13.59,
    south: 8.07,
    east: 80.35,
    west: 76.24,
};

export default function FarmMap({ farmers, userLocation, height = 420 }: FarmMapProps) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const leafletMapRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const [geoCenter, setGeoCenter] = useState<[number, number] | null>(null);
    
    // Check if user is in demo mode
    const isDemoMode = React.useMemo(() => {
        try {
            const user = localStorage.getItem('farmease_user');
            if (user) {
                const userData = JSON.parse(user);
                return userData.isDemo === true;
            }
        } catch {}
        return false;
    }, []);

    // Initialize Map
    useEffect(() => {
        // @ts-ignore - Leaflet loaded via CDN in index.html
        const L = (window as any).L;
        if (!L || !mapRef.current) return;

        if (!leafletMapRef.current) {
            // Use Pollachi as default center if demo mode or if we have farmers with locations
            const pollachi: [number, number] = [10.6593, 77.0068];
            const hasLocations = farmers.some(f => f.location?.latitude);
            const defaultCenter: [number, number] = (isDemoMode || hasLocations) ? pollachi : [10.7905, 78.7047]; // Trichy
            const defaultZoom = isDemoMode ? 11 : 7;
            const map = L.map(mapRef.current).setView(defaultCenter, defaultZoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            leafletMapRef.current = map;
            markersLayerRef.current = L.layerGroup().addTo(map);
        }

        return () => {
            // Cleanup if needed, but usually we keep map instance alive during session
        };
    }, [isDemoMode, farmers]);

    // Update Markers
    useEffect(() => {
        // @ts-ignore
        const L = (window as any).L;
        if (!L || !leafletMapRef.current || !markersLayerRef.current) return;

        markersLayerRef.current.clearLayers();

        // User Marker
        if (geoCenter) {
            L.marker(geoCenter, {
                title: 'You',
                // Simple blue icon for user default
            }).addTo(markersLayerRef.current)
                .bindPopup(`<b>${userLocation?.name || 'You'}</b><br/>${userLocation?.area}`);
        }

        // Farmer Markers
        farmers.forEach(f => {
            // Use backend provided location if available
            if (f.location?.latitude && f.location?.longitude) {
                const lat = f.location.latitude;
                const lon = f.location.longitude;

                // Validate bounds
                if (lat < TAMILNADU_BOUNDS.south || lat > TAMILNADU_BOUNDS.north ||
                    lon < TAMILNADU_BOUNDS.west || lon > TAMILNADU_BOUNDS.east) return;

                L.marker([lat, lon], { title: f.name })
                    .addTo(markersLayerRef.current)
                    .bindPopup(
                        `<div style="font-weight:600;color:#065f46">${f.name}</div>
                 <div style="font-size:12px;color:#374151">${f.area}, ${f.district}</div>
                 <div style="margin-top:6px;font-size:12px;color:#1f2937">Crops: ${(f.crops || []).join(', ')}</div>`
                    );
            }
        });

        // Auto-fit bounds if we have points
        const points = farmers
            .filter(f => f.location?.latitude)
            .map(f => [f.location!.latitude, f.location!.longitude] as [number, number]);

        if (geoCenter) points.push(geoCenter);

        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        } else if (geoCenter) {
            leafletMapRef.current.setView(geoCenter, 12);
        }

    }, [farmers, geoCenter, userLocation]);

    // Geolocation - use Pollachi for demo mode
    useEffect(() => {
        // In demo mode, set center to Pollachi
        if (isDemoMode) {
            setGeoCenter([10.6593, 77.0068]); // Pollachi coordinates
            return;
        }
        
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setGeoCenter([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.warn('Geo Error', err),
            { timeout: 10000 }
        );
    }, [isDemoMode]);

    return <div ref={mapRef} style={{ height, width: '100%', borderRadius: '0.5rem' }} />;
}
