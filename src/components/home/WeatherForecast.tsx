import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle, Droplets, Wind, AlertTriangle, MapPin, Loader2, Thermometer, PlusCircle } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useConnectivity } from '../../contexts/ConnectivityContext';
import { useLanguage } from '../../contexts/LanguageContext';
import weatherService, { type WeatherData, type ForecastData } from '../../services/weatherService';

export default function WeatherForecast() {
  const { lands, selectedLandId, addReminder } = useFarm();
  const { t } = useLanguage();
  const { online } = useConnectivity();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedTs, setCachedTs] = useState<number | null>(null);
  const selectedLand = lands.find(land => land.id === selectedLandId);

  // Use fallback coordinates for demonstration (you can update this to get real coordinates)
  const getCoordinates = (land: any) => {
    // For now, use Kochi, Kerala coordinates as fallback
    // In a real app, you'd geocode the location or have stored coordinates
    return {
      lat: land.latitude || 9.9312,
      lon: land.longitude || 76.2673
    };
  };

  // Helpers for cache keys
  const getCacheKeys = (landId: string) => ({
    current: `weather:last:${landId}`,
    forecast: `weather:forecast:${landId}`,
  });

  const loadCache = (landId?: string | null) => {
    if (!landId) return false;
    try {
      const keys = getCacheKeys(landId);
      const curText = localStorage.getItem(keys.current);
      const fText = localStorage.getItem(keys.forecast);
      let used = false;
      let newestTs: number | null = null;
      if (curText) {
        const obj = JSON.parse(curText);
        if (obj?.weather) {
          setWeatherData(obj.weather);
          used = true;
        }
        if (obj?.ts) newestTs = obj.ts;
      }
      if (fText) {
        const obj = JSON.parse(fText);
        if (obj?.forecast) {
          setForecastData(obj.forecast);
          used = true;
        }
        if (obj?.ts) newestTs = newestTs ? Math.max(newestTs, obj.ts) : obj.ts;
      }
      if (newestTs) setCachedTs(newestTs);
      return used;
    } catch {}
    return false;
  };

  const saveCache = (landId: string, weather: WeatherData | null, forecast: ForecastData | null) => {
    try {
      const keys = getCacheKeys(landId);
      const ts = Date.now();
      if (weather) localStorage.setItem(keys.current, JSON.stringify({ weather, ts }));
      if (forecast) localStorage.setItem(keys.forecast, JSON.stringify({ forecast, ts }));
      setCachedTs(ts);
    } catch {}
  };

  // Fetch weather data when land is selected and online; load cache when offline
  useEffect(() => {
    if (!selectedLand) return;
    if (!online) {
      // When offline, try loading cache immediately
      loadCache(selectedLand.id);
      return;
    }
    const fetchWeatherData = async () => {
      if (!selectedLand) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const coords = getCoordinates(selectedLand);
        const [currentResponse, forecastResponse] = await Promise.all([
          weatherService.getCurrentWeather(coords.lat, coords.lon),
          weatherService.getForecast(coords.lat, coords.lon)
        ]);
        
        if (currentResponse.success && forecastResponse.success) {
          setWeatherData(currentResponse.weather);
          setForecastData(forecastResponse.forecast);
          saveCache(selectedLand.id, currentResponse.weather, forecastResponse.forecast);
        } else {
          setError('Failed to fetch weather data');
          // attempt to load cache if network response invalid
          loadCache(selectedLand.id);
        }
      } catch (err) {
        setError('Failed to fetch weather data');
        console.error('Weather fetch error:', err);
        // fallback to cached data
        loadCache(selectedLand.id);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [selectedLand, online]);

  const getWeatherIcon = (condition: string, size = 'w-6 h-6') => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Sun className={`${size} text-yellow-500`} />;
    } else if (conditionLower.includes('cloud')) {
      return <Cloud className={`${size} text-gray-500`} />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain className={`${size} text-blue-500`} />;
    } else if (conditionLower.includes('snow')) {
      return <CloudSnow className={`${size} text-blue-300`} />;
    } else if (conditionLower.includes('mist') || conditionLower.includes('fog')) {
      return <CloudDrizzle className={`${size} text-gray-400`} />;
    }
    
    return <Sun className={`${size} text-yellow-500`} />;
  };

  const getFarmingAdvice = (weather: WeatherData) => {
    const advice = [];
    const current = weather.current;
    
    if (current.temperature > 30) {
      advice.push('High temperature - ensure adequate irrigation');
    }
    
    if (current.humidity > 80) {
      advice.push('High humidity - monitor for fungal diseases');
    }
    
    if (current.windSpeed > 20) {
      advice.push('High wind - avoid spraying pesticides');
    }
    
    if (current.description.toLowerCase().includes('rain')) {
      advice.push('Rain expected - avoid field operations');
    } else if (current.humidity < 60 && current.windSpeed < 15) {
      advice.push('Good conditions for spraying and field work');
    }
    
    return advice.length > 0 ? advice.join(' • ') : 'Good conditions for farming activities';
  };

  // Land-specific weather alerts
  const getWeatherAlerts = (weather: WeatherData | null) => {
    if (!weather) return [];
    
    const alerts = [];
    const current = weather.current;
    
    if (current.temperature > 35) {
      alerts.push({
        type: 'heat',
        message: 'Extreme heat warning - increase irrigation frequency',
        severity: 'high' as const
      });
    }
    
    if (current.humidity > 85) {
      alerts.push({
        type: 'humidity',
        message: 'High humidity - increased disease risk',
        severity: 'medium' as const
      });
    }
    
    if (current.windSpeed > 25) {
      alerts.push({
        type: 'wind',
        message: 'Strong winds - avoid spraying operations',
        severity: 'high' as const
      });
    }
    
    if (current.description.toLowerCase().includes('rain')) {
      alerts.push({
        type: 'rain',
        message: 'Rain expected - postpone field operations',
        severity: 'medium' as const
      });
    }
    
    return alerts;
  };

  const weatherAlerts = getWeatherAlerts(weatherData);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading weather data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedLand) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">Please select a land to view weather forecast</span>
          </div>
        </div>
      </div>
    );
  }

  // Offline mode panel
  if (!online) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800">Offline mode</div>
              <div className="text-sm text-amber-700">Weather updates are paused. Turn Online to fetch live data.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Cloud className="w-6 h-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-green-800">{t('weather_forecast')}</h3>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          {selectedLand.name}
        </div>
      </div>

      {/* Offline banner and cache timestamp */}
      {(!online || cachedTs) && (
        <div className="mb-4 flex items-center justify-between">
          {!online && (
            <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-1 text-sm">
              Offline mode: showing last known data when available
            </div>
          )}
          {cachedTs && (
            <div className="text-xs text-gray-500">Last updated: {new Date(cachedTs).toLocaleString()}</div>
          )}
        </div>
      )}

      <div className="bg-green-50 rounded-lg p-4 mb-6">
        <p className="text-green-800 text-sm font-medium">
          🌤️ Weather for: {selectedLand.name}, {selectedLand.location}
        </p>
      </div>

      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            {t('weather_alerts')} for {selectedLand.name}
          </h4>
          <div className="space-y-2">
            {weatherAlerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                alert.severity === 'high' ? 'bg-red-50 border-red-400' :
                alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                'bg-green-50 border-green-400'
              }`}>
                <div className="flex items-start">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 mr-2 ${
                    alert.severity === 'high' ? 'text-red-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <p className="text-sm text-gray-700">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Weather */}
      {weatherData && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xl font-semibold">{t('current_weather')}</h4>
              <p className="text-blue-100">{selectedLand.location}</p>
            </div>
            {getWeatherIcon(weatherData.current.description, 'w-12 h-12')}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(weatherData.current.temperature)}°C</div>
              <div className="text-blue-100 text-sm">{t('temperature')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{weatherData.current.humidity}%</div>
              <div className="text-blue-100 text-sm">{t('humidity')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(weatherData.current.windSpeed)}</div>
              <div className="text-blue-100 text-sm">km/h</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center">
              <Thermometer className="w-4 h-4 mr-2" />
              <span>Feels like {Math.round(weatherData.current.feelsLike)}°C</span>
            </div>
            <div className="flex items-center">
              <Wind className="w-4 h-4 mr-2" />
              <span>Wind {Math.round(weatherData.current.windSpeed)} km/h</span>
            </div>
          </div>

          <div className="bg-blue-600 rounded-lg p-3 text-center">
            <p className="text-sm">{t('farming_recommendations')}: {getFarmingAdvice(weatherData)}</p>
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {forecastData && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">5-Day Forecast</h4>
          
          <div className="grid gap-3">
            {forecastData.forecast.slice(0, 5).map((day, index) => (
              <div key={index} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="font-medium text-gray-800">{day.date}</div>
                      <div className="text-sm text-gray-600">{day.dayName}</div>
                    </div>
                    {getWeatherIcon(day.description)}
                    <div>
                      <div className="font-medium text-gray-800">
                        {Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°
                      </div>
                      <div className="text-sm text-gray-600">{day.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="text-right">
                      <div className="text-sm text-gray-600 flex items-center justify-end">
                        <Droplets className="w-4 h-4 mr-1" />
                        {day.humidity}%
                      </div>
                      <div className="text-sm text-gray-600 flex items-center justify-end">
                        <Wind className="w-4 h-4 mr-1" />
                        {Math.round(day.windSpeed)} km/h
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const land = lands.find(l => l.id === selectedLandId);
                        const reminderDate = new Date(day.date).toISOString().split('T')[0];
                        const locationLabel = land ? `${land.name}, ${land.location}` : 'Selected land';
                        const precipPart = typeof (day as any).precipitation === 'number' && (day as any).precipitation > 0
                          ? `${(day as any).precipitation}mm rain expected.`
                          : 'Low rain chances.';
                        addReminder({
                          title: `Weather: ${day.dayName}`,
                          description: `${locationLabel}: ${day.description}. Temps ${Math.round(day.minTemp)}° - ${Math.round(day.maxTemp)}°. ${precipPart}`,
                          date: reminderDate,
                          landId: land ? land.id : (selectedLandId || 'default'),
                          completed: false,
                          priority: 'medium'
                        });
                      }}
                      className="ml-3 inline-flex items-center px-2 py-1 text-xs border border-green-600 text-green-700 rounded hover:bg-green-50 active:bg-green-100 transition-colors"
                      title="Add to Reminders"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>

                {day.description.toLowerCase().includes('rain') && (
                  <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                    <strong>Recommendation:</strong> Avoid spraying, ensure field drainage, harvest ready crops.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Farming Recommendations */}
      {weatherData && (
        <div className="mt-6 bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">🌱 Farming Recommendations</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p>• Current: {getFarmingAdvice(weatherData)}</p>
            {forecastData && forecastData.forecast.length > 0 && (
              <p>• Next 24 hours: Monitor weather conditions for optimal farming activities</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}