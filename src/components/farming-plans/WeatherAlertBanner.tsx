import { useEffect, useState } from 'react';
import { CloudRain, AlertTriangle, Wind, Droplets, ThermometerSun, Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { checkWeatherDelay, WeatherDecision } from '../../services/farmingPlanService';

interface WeatherAlertBannerProps {
  planId: string;
  activityId: string;
  activityType: string;
  scheduledDate: string;
}

export default function WeatherAlertBanner({ 
  planId, 
  activityId, 
  activityType, 
  scheduledDate 
}: WeatherAlertBannerProps) {
  const { language } = useLanguage();
  const [weatherDecision, setWeatherDecision] = useState<WeatherDecision | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWeather();
  }, [planId, activityId]);

  const checkWeather = async () => {
    try {
      setLoading(true);
      const decision = await checkWeatherDelay(planId, activityId);
      
      // Only show banner if there's a weather concern
      if (decision.action !== 'proceed') {
        setWeatherDecision(decision);
      }
    } catch (error) {
      console.error('Error checking weather:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !weatherDecision) {
    return null;
  }

  const getAlertStyle = () => {
    switch (weatherDecision.action) {
      case 'delay':
        return 'bg-red-50 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      case 'skip':
        return 'bg-blue-50 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-800';
    }
  };

  const getAlertIcon = () => {
    switch (weatherDecision.action) {
      case 'delay':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'skip':
        return <CloudRain className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getActionLabel = () => {
    switch (weatherDecision.action) {
      case 'delay':
        return language === 'english' ? '⚠️ Delay Recommended' : '⚠️ தாமதம் பரிந்துரைக்கப்படுகிறது';
      case 'warning':
        return language === 'english' ? '⚠️ Weather Warning' : '⚠️ வானிலை எச்சரிக்கை';
      case 'skip':
        return language === 'english' ? 'ℹ️ Consider Skipping' : 'ℹ️ தவிர்க்கலாம்';
      default:
        return language === 'english' ? 'Weather Alert' : 'வானிலை எச்சரிக்கை';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getAlertStyle()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getAlertIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">
            {getActionLabel()}
          </h4>
          <p className="text-sm mb-3">
            {language === 'english' ? weatherDecision.reason : weatherDecision.reasonTamil}
          </p>

          {/* Weather Details */}
          {weatherDecision.weatherData && (
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="flex items-center gap-1">
                <ThermometerSun className="w-4 h-4" />
                <span>
                  {Math.round(weatherDecision.weatherData.temp.max)}°C / {Math.round(weatherDecision.weatherData.temp.min)}°C
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="w-4 h-4" />
                <span>
                  {language === 'english' ? 'Humidity: ' : 'ஈரப்பதம்: '}
                  {Math.round(weatherDecision.weatherData.humidity)}%
                </span>
              </div>
              {weatherDecision.weatherData.rainfallAmount > 0 && (
                <>
                  <div className="flex items-center gap-1">
                    <CloudRain className="w-4 h-4" />
                    <span>
                      {language === 'english' ? 'Rain: ' : 'மழை: '}
                      {Math.round(weatherDecision.weatherData.rainfallAmount)}mm
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="w-4 h-4" />
                    <span>
                      {language === 'english' ? 'Wind: ' : 'காற்று: '}
                      {Math.round(weatherDecision.weatherData.windSpeed)} km/h
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Suggested Date */}
          {weatherDecision.suggestedDate && weatherDecision.action === 'delay' && (
            <div className="bg-white bg-opacity-50 rounded p-2 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {language === 'english' ? 'Suggested new date: ' : 'பரிந்துரைக்கப்பட்ட புதிய தேதி: '}
                <strong>
                  {new Date(weatherDecision.suggestedDate).toLocaleDateString(
                    language === 'english' ? 'en-GB' : 'ta-IN',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  )}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
