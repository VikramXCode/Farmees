import { useState, useMemo } from 'react';
import { Users, MessageCircle, MapPin, AlertTriangle, Bell, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { useConnectData } from '../hooks/useConnectData';
import FarmMap from '../components/Map/FarmMap';
import { PageContainer } from '../components/layout/AppShell';

export default function ConnectPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { lands, selectedLandId } = useFarm();
  const [activeTab, setActiveTab] = useState('farmers');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPestOnMap, setShowPestOnMap] = useState(true);

  const {
    nearbyFarmers,
    pestAlerts,
    demoUserLands,
    isLoading,
    submitAlert,
    userLocation,
    error
  } = useConnectData();

  // Get user's crops from their lands
  const userCrops = useMemo(() => {
    // Combine crops from actual lands and demo lands
    const actualCrops = lands.map(l => l.currentCrop).filter((c): c is string => !!c);
    const demoCrops = demoUserLands.map(l => l.currentCrop).filter((c): c is string => !!c);
    return [...new Set([...actualCrops, ...demoCrops])];
  }, [lands, demoUserLands]);

  // Get user's lands with location data - combine actual lands and demo lands
  const userLandsWithLocation = useMemo(() => {
    // Start with actual lands from farm context
    const actualLands = lands.map(land => ({
      id: land.id,
      name: land.name,
      currentCrop: land.currentCrop,
      location: (land.latitude && land.longitude) ? {
        latitude: land.latitude,
        longitude: land.longitude
      } : undefined
    }));
    
    // Add demo user lands from API (these have coordinates for map display)
    const demoLands = demoUserLands.map(land => ({
      id: land.id,
      name: land.name,
      currentCrop: land.currentCrop,
      location: land.location
    }));
    
    // Combine both, demo lands provide the 10 map points
    return [...actualLands, ...demoLands];
  }, [lands, demoUserLands]);

  // Check for nearby pest alerts that affect user's crops
  const relevantPestAlerts = useMemo(() => {
    if (!userCrops.length) return [];
    return pestAlerts.filter(alert => {
      const alertCrop = (alert as any).crop?.toLowerCase() || '';
      return userCrops.some(uc => 
        alertCrop.includes(uc.toLowerCase()) || 
        uc.toLowerCase().includes(alertCrop)
      );
    });
  }, [pestAlerts, userCrops]);

  // Count high severity alerts near user
  const highSeverityNearby = useMemo(() => {
    return pestAlerts.filter(a => a.severity === 'high').length;
  }, [pestAlerts]);

  const [reportData, setReportData] = useState({
    pest: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    description: '',
    affected_area: ''
  });

  const handleSubmitReport = async () => {
    try {
      await submitAlert(reportData);
      setShowReportModal(false);
      setReportData({ pest: '', severity: 'medium', description: '', affected_area: '' });
    } catch (e) {
      alert('Failed to report alert. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const AlertCard = ({ alert }: { alert: any }) => {
    const isRelevantToUser = userCrops.some(uc => 
      (alert.crop || '').toLowerCase().includes(uc.toLowerCase())
    );
    
    const getRiskColor = (risk: string) => {
      switch (risk?.toLowerCase()) {
        case 'critical': return 'bg-red-600 text-white';
        case 'high': return 'bg-orange-500 text-white';
        case 'medium': return 'bg-yellow-500 text-white';
        case 'low': return 'bg-green-500 text-white';
        default: return 'bg-gray-500 text-white';
      }
    };
    
    return (
      <div className={`border-2 rounded-lg p-4 ${getSeverityColor(alert.severity)} ${isRelevantToUser ? 'ring-2 ring-blue-400' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold text-gray-800">{alert.pest}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
              </span>
              {alert.riskLevel && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(alert.riskLevel)}`}>
                  🎯 {alert.riskLevel} Risk
                </span>
              )}
              {isRelevantToUser && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  ⚠️ Affects your crop
                </span>
              )}
            </div>
            
            {/* Probability indicator */}
            {alert.probability && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Spread Probability</span>
                  <span className="font-semibold">{alert.probability}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${alert.probability >= 70 ? 'bg-red-500' : alert.probability >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${alert.probability}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>{alert.location} • {alert.distance || 'Nearby'}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
            
            {/* Recommendations */}
            {alert.recommendations && alert.recommendations.length > 0 && (
              <div className="mt-3 p-2 bg-white/50 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-1">💡 Recommendations:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {alert.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
              {alert.crop && <span className="bg-gray-200 px-2 py-0.5 rounded">Crop: {alert.crop}</span>}
              <span>Affected: {alert.affected_area}</span>
              <span>• {formatTimeAgo(alert.timestamp)}</span>
              <span>• By {alert.farmer}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center mb-3">
            <Users className="w-6 h-6 text-green-600 mr-3" />
            <h1 className="text-xl font-bold text-green-800">{t('connect_with_farmers')}</h1>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-green-800 text-sm">
              👋 {t('welcome')}, {user?.name}! Connect with farmers, share experiences, and stay updated on pest alerts.
            </p>
            <p className="text-green-700 text-xs mt-1">
              📍 {userLocation.area}, {userLocation.district} • 🌾 Crops: {userCrops.length > 0 ? userCrops.join(', ') : 'None set'}
            </p>
          </div>
        </div>

        {/* Pest Alert Warning Banner */}
        {highSeverityNearby > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-red-500 mr-3 mt-0.5 animate-pulse" />
              <div>
                <p className="text-red-800 font-semibold">⚠️ {highSeverityNearby} High Severity Alert{highSeverityNearby > 1 ? 's' : ''} Nearby!</p>
                <p className="text-red-700 text-sm mt-1">
                  {relevantPestAlerts.length > 0 
                    ? `${relevantPestAlerts.length} alert(s) affect crops similar to yours. Check the Pest Alerts tab for details.`
                    : 'Pest outbreaks reported in your area. Monitor your fields closely.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded shadow-sm flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700 font-medium text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto text-sm text-red-600 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Map Legend */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-gray-700">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Your Lands
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span> Same Crop
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-orange-400"></span> Other Crops
            </span>
            {showPestOnMap && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Pest Alerts
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('farmers')}
              className={`flex-1 py-3 px-4 font-medium transition-colors text-sm ${activeTab === 'farmers'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Farmers ({nearbyFarmers.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-3 px-4 font-medium transition-colors text-sm relative ${activeTab === 'alerts'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Alerts ({pestAlerts.length})
              {highSeverityNearby > 0 && activeTab !== 'alerts' && (
                <span className="absolute top-1 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {highSeverityNearby}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'farmers' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Nearby Farmers</h2>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={showPestOnMap}
                      onChange={(e) => setShowPestOnMap(e.target.checked)}
                      className="rounded text-green-600"
                    />
                    Show pest alerts
                  </label>
                </div>

                {/* Map Component */}
                <div className="rounded-lg overflow-hidden border relative z-0" style={{ minHeight: '350px', maxHeight: '400px' }}>
                  <FarmMap
                    farmers={nearbyFarmers}
                    userLocation={{ ...userLocation, name: user?.name }}
                    height={350}
                    userCrops={userCrops}
                    userLands={userLandsWithLocation}
                    pestAlerts={pestAlerts}
                    showPestAlerts={showPestOnMap}
                  />

                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-gray-600 z-10">
                      Loading…
                    </div>
                  )}
                </div>

                {/* Farmers List */}
                {nearbyFarmers.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <h3 className="text-sm font-medium text-gray-700">Farmers in your area:</h3>
                    {nearbyFarmers.map((farmer: any) => {
                      const hasSameCrop = userCrops.some(uc => 
                        (farmer.crops || []).some((fc: string) => 
                          fc.toLowerCase().includes(uc.toLowerCase()) || uc.toLowerCase().includes(fc.toLowerCase())
                        )
                      );
                      return (
                        <div key={farmer.id} className={`p-3 rounded-lg border ${hasSameCrop ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{farmer.name}</p>
                              <p className="text-xs text-gray-500">{farmer.area}, {farmer.district} • {farmer.distance}</p>
                            </div>
                            {hasSameCrop && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Same crop</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Crops: {(farmer.crops || []).join(', ')}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Pest Alerts</h2>
                  <button onClick={() => setShowReportModal(true)} className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    Report Alert
                  </button>
                </div>

                {/* Relevant Alerts Banner */}
                {relevantPestAlerts.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <p className="text-blue-800 text-sm font-medium">
                        {relevantPestAlerts.length} alert(s) may affect your {userCrops.join(', ')} crops
                      </p>
                    </div>
                  </div>
                )}

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
                      <button onClick={handleSubmitReport} className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700">Submit</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </PageContainer>
  );
}