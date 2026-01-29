import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ChevronDown,
  Plus,
  Camera,
  FileText,
  Coins,
  ScrollText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  Edit3,
  Trash2,
  Cloud,
  Droplets,
  Wind,
  Leaf,
  Sun,
  CloudRain,
  Thermometer,
  Users,
  TrendingUp,
  Bell,
  Settings,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { geocodePincode } from '../services/geocodingService';
import EditLandForm from '../components/home/EditLandForm';
import weatherService, { type WeatherData } from '../services/weatherService';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { lands, selectedLandId, selectLand, deleteLand, isLoading, loadError } = useFarm();
  const [showLandSelector, setShowLandSelector] = useState(false);
  const [editingLandId, setEditingLandId] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Get selected land object
  const selectedLand = lands.find((l: any) => l.id === selectedLandId) || null;

  const setSelectedLand = (land: any) => {
    selectLand(land?.id || null);
  };

  // Auto-select first land if none selected but lands exist
  useEffect(() => {
    if (lands.length > 0 && !selectedLandId) {
      selectLand(lands[0].id);
    }
  }, [lands, selectedLandId, selectLand]);

  // Fetch weather when selected land changes
  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedLand?.postalCode) {
        setWeatherData(null);
        return;
      }

      setWeatherLoading(true);
      try {
        const geoData = await geocodePincode(selectedLand.postalCode);
        if (geoData) {
          const response = await weatherService.getCurrentWeather(
            geoData.lat,
            geoData.lng,
            selectedLand.location
          );
          if (response.success) {
            setWeatherData(response.weather);
          }
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setWeatherData(null);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [selectedLandId, selectedLand?.postalCode, selectedLand?.location]);

  // Translations
  const t = {
    greeting: language === 'english' ? 'Vanakkam' : 'வணக்கம்',
    myFarm: language === 'english' ? 'My Farm' : 'என் பண்ணை',
    selectLand: language === 'english' ? 'Select Land' : 'நிலத்தைத் தேர்ந்தெடு',
    addLand: language === 'english' ? 'Add Land' : 'நிலம் சேர்',
    diagnose: language === 'english' ? 'Diagnose' : 'கண்டறி',
    soilReport: language === 'english' ? 'Soil Report' : 'மண் அறிக்கை',
    prices: language === 'english' ? 'Market Prices' : 'சந்தை விலை',
    schemes: language === 'english' ? 'Govt Schemes' : 'அரசு திட்டங்கள்',
    getAIAdvice: language === 'english' ? 'Ask AI' : 'AI கேள்',
    noLand: language === 'english' ? 'No land added yet' : 'இன்னும் நிலம் சேர்க்கவில்லை',
    addFirstLand: language === 'english' ? 'Add your first land to get started' : 'தொடங்க உங்கள் முதல் நிலத்தைச் சேர்க்கவும்',
    weather: language === 'english' ? 'Weather' : 'வானிலை',
    humidity: language === 'english' ? 'Humidity' : 'ஈரப்பதம்',
    wind: language === 'english' ? 'Wind' : 'காற்று',
    crops: language === 'english' ? 'Crops' : 'பயிர்கள்',
    noCrops: language === 'english' ? 'No crops added' : 'பயிர்கள் இல்லை',
    quickActions: language === 'english' ? 'Quick Actions' : 'விரைவு செயல்கள்',
    analytics: language === 'english' ? 'Analytics' : 'பகுப்பாய்வு',
    connect: language === 'english' ? 'Connect' : 'இணை',
    labour: language === 'english' ? 'Labour' : 'தொழிலாளர்',
    cropRec: language === 'english' ? 'Crop Advice' : 'பயிர் ஆலோசனை',
  };

  // Get greeting based on time
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'english' ? 'Good Morning' : 'காலை வணக்கம்';
    if (hour < 17) return language === 'english' ? 'Good Afternoon' : 'மதிய வணக்கம்';
    return language === 'english' ? 'Good Evening' : 'மாலை வணக்கம்';
  };

  // Get weather icon
  const getWeatherIcon = () => {
    if (!weatherData) return <Sun className="w-8 h-8" />;
    const desc = weatherData.current.description?.toLowerCase() || '';
    if (desc.includes('rain')) return <CloudRain className="w-8 h-8" />;
    if (desc.includes('cloud')) return <Cloud className="w-8 h-8" />;
    return <Sun className="w-8 h-8" />;
  };

  // Handle delete land
  const handleDeleteLand = async (landId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMessage = language === 'english' 
      ? 'Are you sure you want to delete this land?' 
      : 'இந்த நிலத்தை நீக்க விரும்புகிறீர்களா?';
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteLand(landId);
        if (selectedLandId === landId) {
          selectLand(null);
        }
      } catch (error) {
        console.error('Failed to delete land:', error);
      }
    }
  };

  // Handle edit land
  const handleEditLand = (landId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLandId(landId);
    setShowLandSelector(false);
  };

  // Primary quick actions - most used features
  const primaryActions = [
    { icon: <Camera className="w-7 h-7" />, label: t.diagnose, path: '/diagnose', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
    { icon: <Sparkles className="w-7 h-7" />, label: t.getAIAdvice, path: '/ai', color: 'from-purple-500 to-indigo-500', bg: 'bg-purple-50' },
    { icon: <Coins className="w-7 h-7" />, label: t.prices, path: '/market', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50' },
    { icon: <FileText className="w-7 h-7" />, label: t.soilReport, path: '/soil-report', color: 'from-amber-600 to-yellow-600', bg: 'bg-amber-50' },
  ];

  // Secondary actions
  const secondaryActions = [
    { icon: <Leaf className="w-5 h-5" />, label: t.cropRec, path: '/crop-recommendation' },
    { icon: <ScrollText className="w-5 h-5" />, label: t.schemes, path: '/schemes' },
    { icon: <BarChart3 className="w-5 h-5" />, label: t.analytics, path: '/analytics' },
    { icon: <Users className="w-5 h-5" />, label: t.connect, path: '/connect' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      {/* Header - Compact and Modern */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-green-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-green-600 font-medium">{getTimeGreeting()}</p>
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {t.greeting}, {user?.name?.split(' ')[0]} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-24 max-w-lg mx-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">
                {language === 'english' ? 'Loading...' : 'ஏற்றுகிறது...'}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && !isLoading && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{loadError}</span>
          </div>
        )}

        {/* No Lands State */}
        {!isLoading && !loadError && lands.length === 0 && (
          <div className="mt-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.noLand}</h3>
            <p className="text-gray-500 mb-6 px-8">{t.addFirstLand}</p>
            <button 
              onClick={() => navigate('/add-land')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-full shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              {t.addLand}
            </button>
          </div>
        )}

        {/* Main Content - When lands exist */}
        {!isLoading && lands.length > 0 && (
          <>
            {/* Land Selector Card */}
            <div className="mt-4 relative">
              <button
                onClick={() => setShowLandSelector(!showLandSelector)}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-green-200 shadow-sm hover:border-green-400 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-green-600 font-medium">{t.myFarm}</p>
                  <p className="font-bold text-gray-900 truncate">
                    {selectedLand?.name || t.selectLand}
                  </p>
                  {selectedLand?.location && (
                    <p className="text-xs text-gray-500 truncate">{selectedLand.location}</p>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showLandSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Land Dropdown */}
              {showLandSelector && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    {lands.map((land: any) => (
                      <div
                        key={land._id}
                        className={`flex items-center gap-3 p-3 hover:bg-green-50 transition-colors ${
                          selectedLand?.id === land.id ? 'bg-green-50' : ''
                        }`}
                      >
                        <button
                          onClick={() => {
                            setSelectedLand(land);
                            setShowLandSelector(false);
                          }}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedLand?.id === land.id ? 'bg-green-600' : 'bg-green-100'
                          }`}>
                            <MapPin className={`w-5 h-5 ${
                              selectedLand?.id === land.id ? 'text-white' : 'text-green-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{land.name}</p>
                            <p className="text-xs text-gray-500 truncate">{land.location}</p>
                          </div>
                          {selectedLand?.id === land.id && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleEditLand(land.id, e)}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteLand(land.id, e)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      navigate('/add-land');
                      setShowLandSelector(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-700 hover:to-blue-600 transition-all"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span>{t.addLand}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Weather Card - Prominent Display */}
            {selectedLand && (
              <div className="mt-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/30">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">{t.weather}</p>
                    {weatherLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin mt-2" />
                    ) : weatherData ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-4xl font-bold">
                            {Math.round(weatherData.current.temperature)}°
                          </span>
                          <span className="text-lg text-blue-100">C</span>
                        </div>
                        <p className="text-blue-100 capitalize mt-1">
                          {weatherData.current.description}
                        </p>
                      </>
                    ) : (
                      <p className="text-blue-200 text-sm mt-2">
                        {language === 'english' ? 'Weather unavailable' : 'வானிலை கிடைக்கவில்லை'}
                      </p>
                    )}
                  </div>
                  <div className="text-blue-200">
                    {getWeatherIcon()}
                  </div>
                </div>
                {weatherData && !weatherLoading && (
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-200" />
                      <span className="text-sm">{weatherData.current.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-blue-200" />
                      <span className="text-sm">{weatherData.current.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-blue-200" />
                      <span className="text-sm">
                        {language === 'english' ? 'Feels' : 'உணர்வு'} {Math.round(weatherData.current.feelsLike || weatherData.current.temperature)}°
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Current Crops - Horizontal Scroll */}
            {selectedLand && selectedLand.currentCrop && selectedLand.currentCrop.trim() !== '' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    {t.crops}
                  </h3>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {selectedLand.currentCrop.split(',').map((crop: string, index: number) => (
                    <div
                      key={index}
                      className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-medium shadow-md shadow-green-500/20"
                    >
                      🌱 {crop.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Actions - 2x2 Grid with Gradients */}
            <div className="mt-6">
              <h3 className="font-bold text-gray-900 mb-3">{t.quickActions}</h3>
              <div className="grid grid-cols-2 gap-3">
                {primaryActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={`relative overflow-hidden p-4 rounded-2xl ${action.bg} border border-gray-100 hover:shadow-lg transition-all group`}
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-105 transition-transform`}>
                      {action.icon}
                    </div>
                    <p className="font-semibold text-gray-900 text-left">{action.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Actions - Horizontal Scroll */}
            <div className="mt-6">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {secondaryActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      {action.icon}
                    </div>
                    <span className="font-medium text-gray-900 whitespace-nowrap">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Farm Stats Card */}
            {selectedLand && (
              <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    {language === 'english' ? 'Farm Details' : 'பண்ணை விவரங்கள்'}
                  </h3>
                  <button
                    onClick={() => setEditingLandId(selectedLand.id)}
                    className="text-sm text-green-600 font-medium hover:text-green-700"
                  >
                    {language === 'english' ? 'Edit' : 'திருத்து'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'english' ? 'Size' : 'அளவு'}
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedLand.size || '--'} {language === 'english' ? 'acres' : 'ஏக்கர்'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'english' ? 'Soil Type' : 'மண் வகை'}
                    </p>
                    <p className="font-bold text-gray-900 truncate">
                      {selectedLand.soilType || '--'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'english' ? 'Water Source' : 'நீர் ஆதாரம்'}
                    </p>
                    <p className="font-bold text-gray-900 truncate">
                      {selectedLand.waterAvailability || '--'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'english' ? 'PIN Code' : 'பின் குறியீடு'}
                    </p>
                    <p className="font-bold text-gray-900">
                      {selectedLand.postalCode || '--'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Assistant CTA - Floating Style */}
            <div className="mt-6 mb-4">
              <button
                onClick={() => navigate('/ai')}
                className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all group"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">{t.getAIAdvice}</p>
                  <p className="text-purple-200 text-sm">
                    {language === 'english' ? 'Get instant farming advice' : 'உடனடி விவசாய ஆலோசனை பெறுங்கள்'}
                  </p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit Land Modal */}
      {editingLandId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <EditLandForm
              landId={editingLandId}
              onClose={() => setEditingLandId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
