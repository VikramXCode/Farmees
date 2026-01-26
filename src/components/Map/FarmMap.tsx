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
    isUserLand?: boolean;
}

interface PestAlert {
    id: string;
    latitude?: number;
    longitude?: number;
    pest: string;
    severity: 'low' | 'medium' | 'high';
    farmer: string;
    location: string;
    crop?: string;
}

interface FarmMapProps {
    farmers: Farmer[];
    userLocation: { area: string; district: string; name?: string } | null;
    height?: number;
    onMarkerClick?: (farmer: Farmer) => void;
    userCrops?: string[]; // User's crops for color coding
    userLands?: Array<{ id: string; name: string; location?: { latitude: number; longitude: number }; currentCrop?: string }>;
    pestAlerts?: PestAlert[];
    showPestAlerts?: boolean;
}

// Tamil Nadu Bounds
const TAMILNADU_BOUNDS = {
    north: 13.59,
    south: 8.07,
    east: 80.35,
    west: 76.24,
};

// Marker colors
const MARKER_COLORS = {
    userLand: '#3B82F6',      // Blue - User's own lands
    sameCrop: '#10B981',      // Green - Farmers growing same crop
    otherCrop: '#F59E0B',     // Orange/Yellow - Farmers growing different crops
    pestHigh: '#EF4444',      // Red - High severity pest
    pestMedium: '#F97316',    // Orange - Medium severity pest
    pestLow: '#FBBF24',       // Yellow - Low severity pest
};

// Create colored marker icon
const createColoredIcon = (L: any, color: string, isUser: boolean = false) => {
    const size = isUser ? 14 : 10;
    const html = `
        <div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ${isUser ? 'animation: pulse 2s infinite;' : ''}
        "></div>
    `;
    return L.divIcon({
        html,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
    });
};

// Create pest alert marker
const createPestIcon = (L: any, severity: string) => {
    const color = severity === 'high' ? MARKER_COLORS.pestHigh : 
                  severity === 'medium' ? MARKER_COLORS.pestMedium : MARKER_COLORS.pestLow;
    const html = `
        <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        ">⚠️</div>
    `;
    return L.divIcon({
        html,
        className: 'pest-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

export default function FarmMap({ 
    farmers, 
    userLocation, 
    height = 350,
    userCrops = [],
    userLands = [],
    pestAlerts = [],
    showPestAlerts = false
}: FarmMapProps) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const leafletMapRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const pestLayerRef = useRef<any>(null);
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
            // Use Erode as default center for demo mode
            const erode: [number, number] = [11.3410, 77.7172];
            const hasLocations = farmers.some(f => f.location?.latitude);
            const defaultCenter: [number, number] = (isDemoMode || hasLocations) ? erode : [10.7905, 78.7047]; // Trichy
            const defaultZoom = isDemoMode ? 12 : 7;
            const map = L.map(mapRef.current).setView(defaultCenter, defaultZoom);

            // Use CartoDB Positron - clean map without POIs like hospitals
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
            }).addTo(map);

            leafletMapRef.current = map;
            markersLayerRef.current = L.layerGroup().addTo(map);
            pestLayerRef.current = L.layerGroup().addTo(map);
            
            // Add CSS for pulse animation
            if (!document.getElementById('map-marker-styles')) {
                const style = document.createElement('style');
                style.id = 'map-marker-styles';
                style.textContent = `
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.2); opacity: 0.8; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .custom-marker, .pest-marker { background: transparent !important; border: none !important; }
                `;
                document.head.appendChild(style);
            }
        }

        return () => {
            // Cleanup if needed, but usually we keep map instance alive during session
        };
    }, [isDemoMode, farmers]);

    // Helper to check if farmer grows same crops as user
    const hasSameCrop = (farmerCrops: string[]) => {
        if (!userCrops.length) return false;
        return farmerCrops.some(fc => 
            userCrops.some(uc => 
                fc.toLowerCase().includes(uc.toLowerCase()) || 
                uc.toLowerCase().includes(fc.toLowerCase())
            )
        );
    };

    // Update Markers
    useEffect(() => {
        // @ts-ignore
        const L = (window as any).L;
        if (!L || !leafletMapRef.current || !markersLayerRef.current) return;

        markersLayerRef.current.clearLayers();

        // User's Lands markers (Blue)
        userLands.forEach(land => {
            if (land.location?.latitude && land.location?.longitude) {
                const lat = land.location.latitude;
                const lon = land.location.longitude;
                
                L.marker([lat, lon], { 
                    icon: createColoredIcon(L, MARKER_COLORS.userLand, true),
                    title: land.name 
                })
                .addTo(markersLayerRef.current)
                .bindPopup(
                    `<div style="font-weight:600;color:#3B82F6">📍 ${land.name}</div>
                     <div style="font-size:12px;color:#374151">Your Land</div>
                     <div style="margin-top:6px;font-size:12px;color:#1f2937">Crop: ${land.currentCrop || 'Not set'}</div>`
                );
            }
        });

        // User Center Marker (if no lands but has geolocation)
        if (geoCenter && userLands.length === 0) {
            L.marker(geoCenter, {
                icon: createColoredIcon(L, MARKER_COLORS.userLand, true),
                title: 'You',
            }).addTo(markersLayerRef.current)
                .bindPopup(`<b>${userLocation?.name || 'You'}</b><br/>${userLocation?.area}`);
        }

        // Farmer Markers (color-coded by crop)
        farmers.forEach(f => {
            if (f.location?.latitude && f.location?.longitude) {
                const lat = f.location.latitude;
                const lon = f.location.longitude;

                // Validate bounds
                if (lat < TAMILNADU_BOUNDS.south || lat > TAMILNADU_BOUNDS.north ||
                    lon < TAMILNADU_BOUNDS.west || lon > TAMILNADU_BOUNDS.east) return;

                // Determine marker color based on crops
                const sameCrop = hasSameCrop(f.crops || []);
                const markerColor = sameCrop ? MARKER_COLORS.sameCrop : MARKER_COLORS.otherCrop;
                const cropLabel = sameCrop ? '🌾 Same crop' : '🌱 Different crop';

                L.marker([lat, lon], { 
                    icon: createColoredIcon(L, markerColor),
                    title: f.name 
                })
                .addTo(markersLayerRef.current)
                .bindPopup(
                    `<div style="font-weight:600;color:#065f46">${f.name}</div>
                     <div style="font-size:11px;color:#6B7280;margin-bottom:4px">${cropLabel}</div>
                     <div style="font-size:12px;color:#374151">${f.area}, ${f.district}</div>
                     <div style="font-size:11px;color:#9CA3AF">${f.distance || ''}</div>
                     <div style="margin-top:6px;font-size:12px;color:#1f2937">Crops: ${(f.crops || []).join(', ')}</div>`
                );
            }
        });

        // Auto-fit bounds if we have points
        const points: [number, number][] = [];
        
        userLands.forEach(land => {
            if (land.location?.latitude && land.location?.longitude) {
                points.push([land.location.latitude, land.location.longitude]);
            }
        });
        
        farmers.forEach(f => {
            if (f.location?.latitude && f.location?.longitude) {
                points.push([f.location.latitude, f.location.longitude]);
            }
        });

        if (geoCenter) points.push(geoCenter);

        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        } else if (geoCenter) {
            leafletMapRef.current.setView(geoCenter, 12);
        }

    }, [farmers, geoCenter, userLocation, userCrops, userLands]);

    // Update Pest Alert Markers
    useEffect(() => {
        // @ts-ignore
        const L = (window as any).L;
        if (!L || !leafletMapRef.current || !pestLayerRef.current) return;

        pestLayerRef.current.clearLayers();

        if (!showPestAlerts) return;

        pestAlerts.forEach(alert => {
            if (alert.latitude && alert.longitude) {
                const severityColor = alert.severity === 'high' ? '#EF4444' : 
                                     alert.severity === 'medium' ? '#F97316' : '#FBBF24';
                const severityLabel = alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1);
                
                L.marker([alert.latitude, alert.longitude], { 
                    icon: createPestIcon(L, alert.severity),
                    title: `Pest Alert: ${alert.pest}` 
                })
                .addTo(pestLayerRef.current)
                .bindPopup(
                    `<div style="font-weight:600;color:${severityColor}">⚠️ ${alert.pest}</div>
                     <div style="font-size:11px;padding:2px 6px;background:${severityColor}20;color:${severityColor};border-radius:4px;display:inline-block;margin:4px 0">${severityLabel} Severity</div>
                     <div style="font-size:12px;color:#374151">${alert.location}</div>
                     <div style="font-size:11px;color:#6B7280">Reported by: ${alert.farmer}</div>
                     ${alert.crop ? `<div style="font-size:11px;color:#6B7280">Crop: ${alert.crop}</div>` : ''}`
                );
            }
        });

    }, [pestAlerts, showPestAlerts]);

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

    return <div ref={mapRef} style={{ height, width: '100%', borderRadius: '0.5rem', position: 'relative', zIndex: 0 }} />;
}
