import { useState, useEffect, useMemo } from 'react';
import api from '../services/api'; // Using our new centralized client
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';

// Types (should ideally be shared in types/index.ts)
export interface Farmer {
    id: string;
    name: string;
    district: string;
    area: string;
    distance?: string;
    crops: string[];
    rating?: number;
    isOnline?: boolean;
    location?: { latitude: number; longitude: number };
}

export interface PestAlert {
    id: string;
    farmer: string;
    location: string;
    pest: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    distance?: string;
    timestamp: string;
    affected_area?: string;
    latitude?: number;
    longitude?: number;
}

export function useConnectData() {
    const { user } = useAuth();
    const { lands } = useFarm();

    const [nearbyFarmers, setNearbyFarmers] = useState<Farmer[]>([]);
    const [pestAlerts, setPestAlerts] = useState<PestAlert[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derive location context from user profile or first land
    const getLocationContext = () => {
        // Helper to split "Area, District" string if stored that way
        const split = (loc?: string | null) => {
            if (!loc) return { area: '', district: '' };
            const p = loc.split(',').map(s => s.trim()).filter(Boolean);
            if (p.length === 1) return { area: p[0], district: p[0] };
            return { area: p[0], district: p[p.length - 1] };
        };

        const landLoc = split(lands[0]?.location);
        const district = user?.district?.trim() || landLoc.district || 'Chennai';
        const area = user?.area?.trim() || landLoc.area || 'Chennai';

        return { district, area };
    };

    const loadData = async () => {
        if (!user) {
            console.log('useConnectData: No user, skipping load');
            return;
        }

        console.log('useConnectData: Starting load...');
        setIsLoading(true);
        setError(null);

        try {
            const { district, area } = getLocationContext();
            const query = `?district=${encodeURIComponent(district)}&area=${encodeURIComponent(area)}`;
            console.log('useConnectData: Fetching with query', query);

            const [farmersData, alertsData] = await Promise.all([
                api.get<Farmer[]>(`/connect/nearby-farmers${query}`),
                api.get<PestAlert[]>(`/alerts/pests${query}`)
            ]);

            console.log('useConnectData: Data received', {
                farmers: Array.isArray(farmersData) ? farmersData.length : 'not-array',
                alerts: Array.isArray(alertsData) ? alertsData.length : 'not-array'
            });

            // Axios interceptor returns data directly
            setNearbyFarmers(Array.isArray(farmersData) ? farmersData : []);
            setPestAlerts(Array.isArray(alertsData) ? alertsData : []);

        } catch (err: any) {
            console.error('Failed to load connect data', err);
            setError(err.message || 'Failed to load data');
            // Set empty on error to avoid stale state
            setNearbyFarmers([]);
            setPestAlerts([]);
        } finally {
            console.log('useConnectData: Finished loading');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.id, lands.length, user?.district, user?.area]); // Reload only on key changes

    const submitAlert = async (data: any) => {
        if (!user) return;
        const { district, area } = getLocationContext();

        await api.post('/alerts/pests', {
            ...data,
            userId: user.id, // Handle potential ID field differences
            farmer: user.name,
            district,
            area
        });

        // Refresh data after submission
        await loadData();
    };

    // Memoize location context to prevent map re-renders
    const userLocation = useMemo(() => getLocationContext(), [user?.district, user?.area, lands?.[0]?.location]);

    return useMemo(() => ({
        nearbyFarmers,
        pestAlerts,
        isLoading,
        error,
        refresh: loadData,
        submitAlert,
        userLocation
    }), [nearbyFarmers, pestAlerts, isLoading, error, userLocation]);
}
