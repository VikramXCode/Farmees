import React, { useState, useEffect } from 'react';
import { MapPin, Droplets, Thermometer, TrendingUp, Cloud, Sun, Edit3, Trash2, MoreVertical, Loader2, CloudRain } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useLanguage } from '../../contexts/LanguageContext';
import EditLandForm from './EditLandForm';
import weatherService, { type WeatherData } from '../../services/weatherService';

export default function LandCards() {
  const { lands, selectedLandId, selectLand, deleteLand } = useFarm();
  const { t } = useLanguage();
  const [editingLandId, setEditingLandId] = useState<string | null>(null);
  const [showMenuForLand, setShowMenuForLand] = useState<string | null>(null);
  const [weatherDataCache, setWeatherDataCache] = useState<{ [landId: string]: WeatherData }>({});
  const [loadingWeather, setLoadingWeather] = useState<{ [landId: string]: boolean }>({});
  const [weatherFetchedIds, setWeatherFetchedIds] = useState<Set<string>>(new Set());

  // Get coordinates for a land (fallback to Kochi, Kerala if not available)
  const getCoordinates = (land: any) => {
    return {
      lat: land.latitude || 9.9312,
      lon: land.longitude || 76.2673
    };
  };

  // Load weather data for all lands
  useEffect(() => {
    const loadWeatherForLands = async () => {
      if (lands.length === 0) return;

      const landsToFetch = lands.filter(land => 
        !weatherFetchedIds.has(land.id) && !loadingWeather[land.id]
      );

      if (landsToFetch.length === 0) return;

      // Mark as fetched immediately to prevent re-fetching
      setWeatherFetchedIds(prev => {
        const newSet = new Set(prev);
        landsToFetch.forEach(land => newSet.add(land.id));
        return newSet;
      });

      for (const land of landsToFetch) {
        setLoadingWeather(prev => ({ ...prev, [land.id]: true }));

        try {
          const coords = getCoordinates(land);
          const response = await weatherService.getCurrentWeather(coords.lat, coords.lon, land.location);
          
          if (response.success) {
            setWeatherDataCache(prev => ({
              ...prev,
              [land.id]: response.weather
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch weather for ${land.name}:`, error);
        } finally {
          setLoadingWeather(prev => ({ ...prev, [land.id]: false }));
        }
      }
    };

    loadWeatherForLands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lands.map(l => l.id).join(',')]);

  const getWaterColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get weather data for a specific land
  const getWeatherData = (landId: string) => {
    const cached = weatherDataCache[landId];
    if (cached) {
      return {
        temp: Math.round(cached.current.temperature),
        condition: cached.current.condition.toLowerCase(),
        humidity: cached.current.humidity,
        loading: false
      };
    }

    // Return loading state or fallback data
    return {
      temp: loadingWeather[landId] ? null : 28,
      condition: 'sunny',
      humidity: loadingWeather[landId] ? null : 70,
      loading: loadingWeather[landId] || false
    };
  };

  const getMarketData = (crop: string) => {
    const marketData: { [key: string]: { price: number; trend: 'up' | 'down' | 'stable'; change: string } } = {
      'Rice': { price: 2850, trend: 'up', change: '+1.8%' },
      'Coconut': { price: 18500, trend: 'down', change: '-3.6%' },
      'Pepper': { price: 48000, trend: 'stable', change: '0.0%' },
    };
    return marketData[crop] || { price: 0, trend: 'stable', change: '0.0%' };
  };

  const getWeatherIcon = (condition: string, loading: boolean = false) => {
    if (loading) {
      return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
    }
    
    switch (condition) {
      case 'sunny':
      case 'clear': 
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'cloudy':
      case 'clouds': 
        return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'rain':
      case 'drizzle': 
        return <CloudRain className="w-4 h-4 text-blue-500" />;
      default: 
        return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleEdit = (landId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLandId(landId);
    setShowMenuForLand(null);
  };

  const handleDelete = async (landId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('confirm_delete_land'))) {
      try {
        await deleteLand(landId);
        setShowMenuForLand(null);
      } catch (error) {
        console.error('Failed to delete land:', error);
        alert(t('delete_land_error'));
      }
    }
  };

  const handleMenuToggle = (landId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenuForLand(showMenuForLand === landId ? null : landId);
  };

  const handleCardClick = (landId: string) => {
    if (editingLandId) return; // Don't select if editing
    selectLand(selectedLandId === landId ? null : landId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenuForLand(null);
    };
    
    if (showMenuForLand) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenuForLand]);

  if (lands.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <MapPin className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">{t('no_lands')}</h3>
        <p className="text-gray-500">{t('add_first_land')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-green-800 mb-4">{t('my_lands')}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lands.map((land) => {
          const weather = getWeatherData(land.id);
          const market = getMarketData(land.currentCrop);
          
          return (
            <div
              key={land.id}
              onClick={() => handleCardClick(land.id)}
              className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all transform hover:scale-105 hover:shadow-xl relative ${
                selectedLandId === land.id
                  ? 'ring-2 ring-green-500 bg-green-50'
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-green-800">{land.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {land.location}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLandId === land.id && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                  <div className="relative">
                    <button
                      onClick={(e) => handleMenuToggle(land.id, e)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {showMenuForLand === land.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                        <button
                          onClick={(e) => handleEdit(land.id, e)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          {t('edit')}
                        </button>
                        <button
                          onClick={(e) => handleDelete(land.id, e)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">{t('soil_type')}</span>
                  <span className="text-green-700 font-medium text-sm">{land.soilType}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">{t('current_crop')}</span>
                  <span className="text-green-700 font-medium text-sm">{land.currentCrop}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm flex items-center">
                    <Droplets className="w-4 h-4 mr-1" />
                    {t('water_availability')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWaterColor(land.waterAvailability)}`}>
                    {t(land.waterAvailability)}
                  </span>
                </div>

                {/* Weather Summary */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 text-xs">{t('current_weather')}</span>
                    <div className="flex items-center text-gray-600">
                      {getWeatherIcon(weather.condition, weather.loading)}
                      <span className="ml-1 text-xs capitalize">
                        {weather.loading ? 'Loading...' : weather.condition}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center text-blue-600">
                      <Thermometer className="w-4 h-4 mr-1" />
                      <span>
                        {weather.loading ? '...' : `${weather.temp}°C`}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Droplets className="w-4 h-4 mr-1" />
                      <span>
                        {weather.loading ? '...' : `${weather.humidity}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Market Status */}
                {market.price > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 text-xs">{t('market_price')}</span>
                      <span className={`text-xs font-medium ${getTrendColor(market.trend)}`}>
                        {market.change}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 font-medium text-sm">
                        ₹{market.price.toLocaleString()}/quintal
                      </span>
                      <div className="flex items-center text-gray-600">
                        <TrendingUp className={`w-4 h-4 mr-1 ${getTrendColor(market.trend)}`} />
                        <span className="text-xs">{market.trend}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLandId && (
        <div className="bg-green-100 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm font-medium">
            🌱 {t('land_selected')}
          </p>
        </div>
      )}

      {/* Edit Land Modal */}
      {editingLandId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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