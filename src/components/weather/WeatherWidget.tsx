import { useEffect, useState } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Eye, 
  Thermometer,
  Sunrise,
  Sunset,
  MapPin,
  RefreshCw,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { PlusCircle } from 'lucide-react';
import weatherService, { 
  WeatherData, 
  ForecastData, 
  DailyForecast, 
  HourlyForecast 
} from '../../services/weatherService';
import { useFarm } from '../../contexts/FarmContext';

interface WeatherWidgetProps {
  landId?: string;
  coordinates?: { lat: number; lon: number };
  location?: string;
  showForecast?: boolean;
  className?: string;
}

export default function WeatherWidget({ 
  landId, 
  coordinates, 
  location, 
  showForecast = true, 
  className = '' 
}: WeatherWidgetProps) {
  const { addReminder, selectedLandId } = useFarm();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeatherData = async () => {
    if (!landId && !coordinates) {
      setError('No location data provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (landId) {
        // Fetch weather for specific land
        const result = await weatherService.getLandWeather(landId, showForecast);
        setWeatherData(result.weather);
        setForecastData(result.forecast);
      } else if (coordinates) {
        // Fetch weather by coordinates
        const result = await weatherService.getCompleteWeather(
          coordinates.lat, 
          coordinates.lon, 
          location
        );
        setWeatherData(result.weather);
        setForecastData(result.forecast);
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [landId, coordinates?.lat, coordinates?.lon, location]);

  const getWeatherIcon = (condition: string, isDay: boolean = true) => {
    const iconProps = { className: "w-8 h-8" };
    
    switch (condition.toLowerCase()) {
      case 'clear':
        return isDay ? <Sun {...iconProps} className="w-8 h-8 text-yellow-500" /> : 
               <Sun {...iconProps} className="w-8 h-8 text-yellow-300" />;
      case 'clouds':
        return <Cloud {...iconProps} className="w-8 h-8 text-gray-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain {...iconProps} className="w-8 h-8 text-blue-500" />;
      default:
        return <Sun {...iconProps} className="w-8 h-8 text-yellow-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isDay = () => {
    if (!weatherData?.current.sunrise || !weatherData?.current.sunset) return true;
    const now = new Date();
    const sunrise = new Date(weatherData.current.sunrise);
    const sunset = new Date(weatherData.current.sunset);
    return now >= sunrise && now <= sunset;
  };

  const addDailyForecastReminder = (day: DailyForecast) => {
    const reminderDate = new Date(day.date).toISOString().split('T')[0];
    const loc = weatherData?.location || 'Your location';
    const landRef = landId || selectedLandId || 'default';
    const tempRange = `${weatherService.formatTemperature(day.minTemp)} - ${weatherService.formatTemperature(day.maxTemp)}`;
    const precipText = day.precipitation > 0 ? `${day.precipitation}mm rain expected.` : 'Low rain chances.';
    addReminder({
      title: `Weather: ${day.dayName}`,
      description: `${loc}: ${day.description}. Temps ${tempRange}. ${precipText}`,
      date: reminderDate,
      landId: landRef,
      completed: false,
      priority: 'medium'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading weather data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
        <button 
          onClick={fetchWeatherData}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!weatherData) return null;

  const current = weatherData.current;
  const advice = weatherService.getWeatherAdvice(current.condition, current.temperature);

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-white bg-opacity-90 p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-500 mr-1" />
            <h3 className="font-semibold text-gray-800">{weatherData.location}</h3>
          </div>
          <button 
            onClick={fetchWeatherData}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh weather data"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {formatTime(lastUpdated.toISOString())}
          </p>
        )}
      </div>

      {/* Current Weather */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {getWeatherIcon(current.condition, isDay())}
            <div className="ml-4">
              <div className="text-3xl font-bold text-gray-800">
                {weatherService.formatTemperature(current.temperature)}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {current.description}
              </div>
              <div className="text-xs text-gray-500">
                Feels like {weatherService.formatTemperature(current.feelsLike)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-1">
              {weatherService.getWeatherEmoji(current.condition)}
            </div>
            <div className="text-xs text-gray-500">
              {current.condition}
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <Droplets className="w-4 h-4 text-blue-500 mr-2" />
            <div>
              <div className="text-sm font-medium">{current.humidity}%</div>
              <div className="text-xs text-gray-500">Humidity</div>
            </div>
          </div>
          <div className="flex items-center">
            <Wind className="w-4 h-4 text-gray-500 mr-2" />
            <div>
              <div className="text-sm font-medium">
                {current.windSpeed.toFixed(1)} m/s
              </div>
              <div className="text-xs text-gray-500">
                {weatherService.formatWindDirection(current.windDirection)}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Thermometer className="w-4 h-4 text-red-500 mr-2" />
            <div>
              <div className="text-sm font-medium">{current.pressure} hPa</div>
              <div className="text-xs text-gray-500">Pressure</div>
            </div>
          </div>
          <div className="flex items-center">
            <Eye className="w-4 h-4 text-purple-500 mr-2" />
            <div>
              <div className="text-sm font-medium">
                {current.visibility ? `${current.visibility.toFixed(1)} km` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">Visibility</div>
            </div>
          </div>
        </div>

        {/* Sun Times */}
        <div className="flex justify-between items-center mb-6 p-3 bg-white bg-opacity-50 rounded-lg">
          <div className="flex items-center">
            <Sunrise className="w-4 h-4 text-orange-500 mr-2" />
            <div>
              <div className="text-sm font-medium">{formatTime(current.sunrise)}</div>
              <div className="text-xs text-gray-500">Sunrise</div>
            </div>
          </div>
          <div className="flex items-center">
            <Sunset className="w-4 h-4 text-orange-600 mr-2" />
            <div>
              <div className="text-sm font-medium">{formatTime(current.sunset)}</div>
              <div className="text-xs text-gray-500">Sunset</div>
            </div>
          </div>
        </div>

        {/* Farming Advice */}
        {advice.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-green-800 mb-2">
              🌾 Farming Advice
            </h4>
            <ul className="space-y-1">
              {advice.map((tip, index) => (
                <li key={index} className="text-xs text-green-700">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 5-Day Forecast */}
        {showForecast && forecastData && forecastData.forecast.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              5-Day Forecast
            </h4>
            <div className="space-y-2">
              {forecastData.forecast.slice(0, 5).map((day: DailyForecast, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white bg-opacity-50 rounded-lg">
                  <div className="flex items-center flex-1">
                    <div className="w-16 text-sm font-medium text-gray-800">
                      {index === 0 ? 'Today' : day.dayName}
                    </div>
                    <img 
                      src={weatherService.getWeatherIconUrl(day.icon)}
                      alt={day.description}
                      className="w-8 h-8 mx-3"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 capitalize">
                        {day.description}
                      </div>
                      {day.precipitation > 0 && (
                        <div className="text-xs text-blue-600">
                          {day.precipitation}mm rain
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {weatherService.formatTemperature(day.maxTemp)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {weatherService.formatTemperature(day.minTemp)}
                      </div>
                    </div>
                    <button
                      onClick={() => addDailyForecastReminder(day)}
                      title="Add to Reminders"
                      className="ml-3 inline-flex items-center px-2 py-1 text-xs border border-green-600 text-green-700 rounded hover:bg-green-50 active:bg-green-100 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next 12 Hours */}
        {forecastData && forecastData.hourlyForecast.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Next 12 Hours
            </h4>
            <div className="flex overflow-x-auto space-x-3 pb-2">
              {forecastData.hourlyForecast.slice(0, 12).map((hour: HourlyForecast, index: number) => (
                <div key={index} className="flex-shrink-0 text-center bg-white bg-opacity-50 rounded-lg p-3 min-w-20">
                  <div className="text-xs text-gray-600 mb-1">
                    {formatTime(hour.time)}
                  </div>
                  <img 
                    src={weatherService.getWeatherIconUrl(hour.icon)}
                    alt={hour.description}
                    className="w-6 h-6 mx-auto mb-1"
                  />
                  <div className="text-sm font-medium">
                    {weatherService.formatTemperature(hour.temperature)}
                  </div>
                  {hour.precipitation > 0 && (
                    <div className="text-xs text-blue-600">
                      {hour.precipitation}mm
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}