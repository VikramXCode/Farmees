import { useEffect, useRef, useState, useMemo } from 'react';
import { Users, MessageCircle, MapPin, AlertTriangle, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';

const keralaLocationMap: Record<string, [number, number]> = {
  thiruvananthapuram: [8.5241, 76.9366],
  trivandrum: [8.5241, 76.9366],
  kollam: [8.8932, 76.6141],
  pathanamthitta: [9.2646, 76.7870],
  alappuzha: [9.4981, 76.3388],
  alleppey: [9.4981, 76.3388],
  kottayam: [9.5916, 76.5222],
  pala: [9.7163, 76.6769],
  idukki: [9.8496, 76.9686],
  munnar: [10.0892, 77.0595],
  vagamon: [9.6855, 76.9050],
  ernakulam: [9.9816, 76.2999],
  kochi: [9.9312, 76.2673],
  kochin: [9.9312, 76.2673],
  aluva: [10.1076, 76.3516],
  angamaly: [10.1900, 76.3850],
  perumbavoor: [10.1000, 76.4700],
  thrissur: [10.5276, 76.2144],
  trichur: [10.5276, 76.2144],
  chalakudy: [10.3017, 76.3375],
  guruvayur: [10.5944, 76.0411],
  palakkad: [10.7730, 76.6510],
  palghat: [10.7730, 76.6510],
  malappuram: [11.0510, 76.0711],
  perinthalmanna: [10.9751, 76.2295],
  tirur: [10.9152, 75.9210],
  kozhikode: [11.2588, 75.7804],
  calicut: [11.2588, 75.7804],
  vadakara: [11.6088, 75.5918],
  wayanad: [11.6854, 76.1320],
  kalpetta: [11.6100, 76.0820],
  sulthanbathery: [11.6643, 76.2573],
  kannur: [11.8745, 75.3704],
  cannanore: [11.8745, 75.3704],
  payyanur: [12.0968, 75.1937],
  kanhangad: [12.3310, 75.0918],
  kasaragod: [12.4996, 74.9896],
  kasaragode: [12.4996, 74.9896],
};

const normalizeKey = (value?: string | null) => (value ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

const keralaBounds = {
  north: 12.98,
  south: 8.17,
  east: 77.35,
  west: 74.75,
};

const clampKeralaBounds = (coords: [number, number]): [number, number] => {
  const [lat, lon] = coords;
  const clampedLat = Math.min(Math.max(lat, keralaBounds.south), keralaBounds.north);
  const clampedLon = Math.min(Math.max(lon, keralaBounds.west), keralaBounds.east);
  return [clampedLat, clampedLon];
};

function lookupKeralaCoordinates(...candidates: (string | null | undefined)[]): [number, number] | null {
  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (!key) continue;
    if (keralaLocationMap[key]) return keralaLocationMap[key];
  }
  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (!key) continue;
    const match = Object.entries(keralaLocationMap).find(([stored]) => stored.includes(key) || key.includes(stored));
    if (match) return match[1];
  }
  return null;
}

const DEFAULT_DISTRICT = 'Ernakulam';
const DEFAULT_AREA = 'Kochi';

function splitLocation(location?: string | null) {
  if (!location) return { area: '', district: '' };
  const parts = String(location)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  if (!parts.length) return { area: '', district: '' };
  if (parts.length === 1) return { area: parts[0], district: parts[0] };
  return { area: parts[0], district: parts[parts.length - 1] };
}

export default function ConnectPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('farmers');
  const { lands } = useFarm();

  const primaryLandLocation = useMemo(() => splitLocation(lands[0]?.location), [lands]);
  const resolvedArea = useMemo(
    () => (user?.area?.trim() || primaryLandLocation.area || DEFAULT_AREA),
    [user?.area, primaryLandLocation.area]
  );
  const resolvedDistrict = useMemo(
    () => (user?.district?.trim() || primaryLandLocation.district || DEFAULT_DISTRICT),
    [user?.district, primaryLandLocation.district]
  );
  
  type Farmer = {
    id: string;
    name: string;
    district: string;
    area: string;
    distance?: string;
    crops: string[];
    experience?: string;
    phone?: string;
    isOnline?: boolean;
    rating?: number;
  };

  type PestAlert = {
    id: string;
    farmer: string;
    location: string;
    pest: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    distance?: string;
    timestamp: string;
    affected_area?: string;
  };

  const [nearbyFarmers, setNearbyFarmers] = useState<Farmer[]>([]);
  const [pestAlerts, setPestAlerts] = useState<PestAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [geoCenter, setGeoCenter] = useState<[number, number] | null>(null);
  const fallbackCenterApplied = useRef(false);
  const mapContainerRef = useRef<string>('map-container-' + Date.now());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    pest: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    description: '',
    affected_area: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setNearbyFarmers([]);
        setPestAlerts([]);
        return;
      }
      setIsLoading(true);
      try {
  const baseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:3001/api';
        // Attempt to fetch from backend if available; otherwise keep empty lists
        if (baseUrl) {
          const district = encodeURIComponent(resolvedDistrict);
          const area = encodeURIComponent(resolvedArea);
          const farmersReq = fetch(`${baseUrl}/connect/nearby-farmers?district=${district}&area=${area}`);
          const alertsReq = fetch(`${baseUrl}/alerts/pests?district=${district}&area=${area}`);
          const [farmersRes, alertsRes] = await Promise.allSettled([farmersReq, alertsReq]);

          if (farmersRes.status === 'fulfilled' && farmersRes.value.ok) {
            const data = await farmersRes.value.json();
            setNearbyFarmers(Array.isArray(data) ? data : []);
          } else {
            setNearbyFarmers([]);
          }

          if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
            const data = await alertsRes.value.json();
            setPestAlerts(Array.isArray(data) ? data : []);
          } else {
            setPestAlerts([]);
          }
        } else {
          setNearbyFarmers([]);
          setPestAlerts([]);
        }
      } catch (e) {
        setNearbyFarmers([]);
        setPestAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, resolvedArea, resolvedDistrict]);

  const submitPestReport = async () => {
    try {
  const baseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:3001/api';
      if (!baseUrl || !user) return;
      const body = {
        userId: user.id,
        farmer: user.name,
        district: resolvedDistrict,
        area: resolvedArea,
        coordinates: geoCenter ? { lat: geoCenter[0], lon: geoCenter[1] } : undefined,
        pest: reportData.pest,
        severity: reportData.severity,
        description: reportData.description,
        affected_area: reportData.affected_area
      };
      const res = await fetch(`${baseUrl}/alerts/pests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to submit');
      // Refresh alerts list
      const district = encodeURIComponent(resolvedDistrict);
      const area = encodeURIComponent(resolvedArea);
      const alertsRes = await fetch(`${baseUrl}/alerts/pests?district=${district}&area=${area}`);
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setPestAlerts(Array.isArray(data) ? data : []);
      }
      setShowReportModal(false);
      setReportData({ pest: '', severity: 'medium', description: '', affected_area: '' });
    } catch (e) {}
  };

  // Initialize or update map when data changes
  useEffect(() => {
    if (activeTab !== 'farmers') return;
    
    // @ts-ignore - Leaflet loaded via CDN
    const L = (window as any).L;
    if (!L) return;

    const locationFromProfile = lookupKeralaCoordinates(resolvedArea, resolvedDistrict, primaryLandLocation.area, primaryLandLocation.district);
    const baseMapCenter = (geoCore: [number, number] | null): [number, number] => geoCore || locationFromProfile || [9.9312, 76.2673];

    const initMap = () => {
      if (!mapRef.current) return;
      
      // Remove existing map instance if it exists
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        } catch (err) {
          console.warn('Error removing map:', err);
        }
      }
      
      // Create fresh map instance
      const defaultCenter: [number, number] = baseMapCenter(geoCenter);
      const map = L.map(mapRef.current).setView(defaultCenter, 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      leafletMapRef.current = map;

      // Clear previous markers layer
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
        markersLayerRef.current = null;
      }
      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current);

      const activeCenter = geoCenter || locationFromProfile;
      if (activeCenter) {
        leafletMapRef.current.setView(activeCenter, 12);
        L.marker(activeCenter, { title: 'You' })
          .addTo(markersLayerRef.current)
          .bindPopup(`<b>${user?.name || 'You'}</b><br/>${resolvedArea}, ${resolvedDistrict}`);
      }

      // Add farmer markers (with naive mock coordinates using name hash if none provided)
      const toCoord = (seed: string, farmer: Farmer): [number, number] => {
        let h = 0;
        for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
        const base = lookupKeralaCoordinates(farmer.area, farmer.district, resolvedArea, resolvedDistrict, primaryLandLocation.area, primaryLandLocation.district) || activeCenter || [9.9312, 76.2673];
        const jitterRange = 0.02;
        const latJitter = ((h % 1000) / 1000 - 0.5) * jitterRange * 2;
        let lonJitter = (((h >> 10) % 1000) / 1000 - 0.5) * jitterRange * 2;
        // Avoid pushing coastal locations west into the sea by biasing jitter inland when necessary.
        if (base[1] < 76.45 && lonJitter < 0) {
          lonJitter = Math.abs(lonJitter) * 0.7 + 0.008;
        }
        const lat = base[0] + latJitter;
        const lon = base[1] + lonJitter;
        return clampKeralaBounds([lat, lon]);
      };

      nearbyFarmers.forEach((f) => {
        const lat = (f as any).latitude as number | undefined;
        const lon = (f as any).longitude as number | undefined;
        let coords: [number, number];
        if (typeof lat === 'number' && typeof lon === 'number') {
          coords = clampKeralaBounds([lat, lon]);
        } else {
          coords = toCoord(`${f.name}-${f.area}-${f.district}`, f);
        }
        // Skip markers that still end up outside the Kerala bounding box (e.g. if jitter pushes them off land).
        if (
          coords[0] < keralaBounds.south ||
          coords[0] > keralaBounds.north ||
          coords[1] < keralaBounds.west ||
          coords[1] > keralaBounds.east
        ) {
          return;
        }
        L.marker(coords, { title: f.name })
          .addTo(markersLayerRef.current)
          .bindPopup(
            `<div style="font-weight:600;color:#065f46">${f.name}</div>
             <div style="font-size:12px;color:#374151">${f.area}, ${f.district}${f.distance ? ` • ${f.distance}` : ''}</div>
             <div style="margin-top:6px;font-size:12px;color:#1f2937">Crops: ${(f.crops || []).join(', ')}</div>`
          );
      });
    };

    // Defer init slightly to ensure container is in DOM and visible
    const id = setTimeout(initMap, 150);
    return () => clearTimeout(id);
  }, [nearbyFarmers, user, geoCenter, activeTab, resolvedArea, resolvedDistrict, primaryLandLocation.area, primaryLandLocation.district]);

  // Get browser geolocation when map is shown
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCenter([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        // ignore errors; will use fallback
      },
      { maximumAge: 600000, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    if (geoCenter || fallbackCenterApplied.current) return;
    const coords = lookupKeralaCoordinates(resolvedArea, resolvedDistrict, primaryLandLocation.area, primaryLandLocation.district);
    if (coords) {
      fallbackCenterApplied.current = true;
      setGeoCenter(coords);
    }
  }, [geoCenter, resolvedArea, resolvedDistrict, primaryLandLocation.area, primaryLandLocation.district]);

  useEffect(() => {
    if (geoCenter || fallbackCenterApplied.current || !nearbyFarmers.length) return;
    const areas = nearbyFarmers.map(f => f.area).concat(nearbyFarmers.map(f => f.district));
    const coords = lookupKeralaCoordinates(...areas);
    if (coords) {
      fallbackCenterApplied.current = true;
      setGeoCenter(coords);
    }
  }, [geoCenter, nearbyFarmers]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // List view has been removed for a map-only experience

  const AlertCard = ({ alert }: { alert: any }) => (
    <div className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-gray-800">{alert.pest}</h3>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {alert.location} • {alert.distance} • Reported by {alert.farmer}
          </div>
          <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
          <div className="text-xs text-gray-500">
            Affected Area: {alert.affected_area} • {alert.timestamp}
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <button className="bg-red-600 text-white py-1 px-3 rounded text-sm font-medium hover:bg-red-700 transition-colors">
          {t('report_similar')}
        </button>
        <button className="bg-blue-600 text-white py-1 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
          {t('get_help')}
        </button>
        <button className="bg-gray-600 text-white py-1 px-3 rounded text-sm font-medium hover:bg-gray-700 transition-colors">
          {t('contact_farmer')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-6 h-6 text-green-600 mr-3" />
          <h1 className="text-2xl font-bold text-green-800">{t('connect_with_farmers')}</h1>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            👋 {t('welcome')}, {user?.name}! {t('connect_with_farmers')}, share experiences, and stay updated on pest alerts in your area.
          </p>
          <p className="text-green-700 text-xs mt-1">
            📍 Your area: {resolvedArea}{resolvedDistrict ? `, ${resolvedDistrict}` : ''}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('farmers')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'farmers'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            {t('nearby_farmers')} ({nearbyFarmers.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            {t('pest_alerts')} ({pestAlerts.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'farmers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">{t('nearby_farmers')}</h2>
                <div className="text-sm text-gray-500">Map View</div>
              </div>

              {/* Map Only */}
              <div className="rounded-lg overflow-hidden border relative">
                <div ref={mapRef} style={{ height: 420 }} />
                {!isLoading && nearbyFarmers.length === 0 && (
                  <div className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded border">
                    No nearby farmers to show yet.
                  </div>
                )}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-gray-600">
                    Loading…
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Recent {t('pest_alerts')}</h2>
                <button onClick={() => setShowReportModal(true)} className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                  {t('report_alert')}
                </button>
              </div>

              {/* Alerts List */}
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading…</div>
              ) : pestAlerts.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-600">
                  <div className="flex items-center justify-center mb-2"><AlertTriangle className="w-5 h-5 mr-2" />{t('pest_alerts')}</div>
                  <div>No pest alerts reported in your area yet.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pestAlerts.map(alert => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              )}

              {/* Alert Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">{t('alert_statistics')} ({t('this_week')})</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{pestAlerts.filter(a => a.severity === 'high').length}</div>
                    <div className="text-sm text-gray-600">{t('high_severity')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{pestAlerts.filter(a => a.severity === 'medium').length}</div>
                    <div className="text-sm text-gray-600">{t('medium_severity')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{pestAlerts.filter(a => a.severity === 'low').length}</div>
                    <div className="text-sm text-gray-600">{t('resolved')}</div>
                  </div>
                </div>
              </div>

              {/* Report Modal */}
              {showReportModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('report_alert')}</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Pest</label>
                        <input value={reportData.pest} onChange={(e) => setReportData(r => ({ ...r, pest: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g., Brown Planthopper" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Severity</label>
                        <select value={reportData.severity} onChange={(e) => setReportData(r => ({ ...r, severity: e.target.value as 'low' | 'medium' | 'high' }))} className="w-full border rounded px-3 py-2 text-sm">
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Description</label>
                        <textarea value={reportData.description} onChange={(e) => setReportData(r => ({ ...r, description: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="Briefly describe the situation" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Affected Area</label>
                        <input value={reportData.affected_area} onChange={(e) => setReportData(r => ({ ...r, affected_area: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g., 2 acres" />
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end space-x-2">
                      <button onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded border text-gray-700 text-sm">Cancel</button>
                      <button onClick={submitPestReport} className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700">Submit</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}