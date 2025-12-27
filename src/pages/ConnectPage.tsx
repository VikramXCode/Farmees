import { useState } from 'react';
import { Users, MessageCircle, MapPin, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useConnectData } from '../hooks/useConnectData';
import FarmMap from '../components/Map/FarmMap';

export default function ConnectPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('farmers');
  const [showReportModal, setShowReportModal] = useState(false);

  const {
    nearbyFarmers,
    pestAlerts,
    isLoading,
    submitAlert,
    userLocation,
    error
  } = useConnectData();

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
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

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
        {/* Action buttons could be interactive later */}
        <button className="bg-red-600 text-white py-1 px-3 rounded text-sm font-medium hover:bg-red-700 transition-colors">
          {t('report_similar')}
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
            📍 Your area: {userLocation.area}{userLocation.district ? `, ${userLocation.district}` : ''}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto text-sm text-red-600 underline hover:text-red-800"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('farmers')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${activeTab === 'farmers'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            {t('nearby_farmers')} ({nearbyFarmers.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${activeTab === 'alerts'
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

              {/* Map Component */}
              <div className="rounded-lg overflow-hidden border relative" style={{ minHeight: '420px' }}>
                <FarmMap
                  farmers={nearbyFarmers}
                  userLocation={{ ...userLocation, name: user?.name }}
                />

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-gray-600 z-[1000]">
                    Loading…
                  </div>
                )}

                {!isLoading && nearbyFarmers.length === 0 && (
                  <div className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded border z-[1000]">
                    No nearby farmers found.
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
  );
}