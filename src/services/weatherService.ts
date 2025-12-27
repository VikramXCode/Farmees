import api from './api';

const API_BASE_URL = ''; // Empty because api instance already has baseURL: '/api'

// Mock data for demo mode
const DEMO_WEATHER_RESPONSE = {
  success: true,
  weather: {
    location: 'Pollachi, Coimbatore',
    coordinates: { lat: 10.6593, lon: 77.0068 },
    current: {
      temperature: 28,
      feelsLike: 30,
      humidity: 75,
      pressure: 1012,
      windSpeed: 8,
      windDirection: 180,
      visibility: 10000,
      uvIndex: 6,
      condition: 'Clouds',
      description: 'Partly cloudy',
      icon: '03d',
      cloudiness: 40,
      sunrise: new Date().toISOString(),
      sunset: new Date().toISOString(),
      timestamp: new Date().toISOString()
    }
  },
  metadata: { keyUsed: 'demo', timestamp: new Date().toISOString() }
};

const DEMO_FORECAST_RESPONSE = {
  success: true,
  forecast: {
    location: 'Pollachi, Coimbatore',
    coordinates: { lat: 10.6593, lon: 77.0068 },
    forecast: [
      {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        dayName: new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
        minTemp: 22,
        maxTemp: 32,
        condition: 'Clear',
        description: 'Clear sky',
        icon: '01d',
        precipitation: 0,
        humidity: 70,
        windSpeed: 7,
        hourlyForecasts: []
      },
      {
        date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        dayName: new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
        minTemp: 21,
        maxTemp: 30,
        condition: 'Rain',
        description: 'Light rain',
        icon: '10d',
        precipitation: 5,
        humidity: 80,
        windSpeed: 10,
        hourlyForecasts: []
      },
      {
        date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        dayName: new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
        minTemp: 22,
        maxTemp: 31,
        condition: 'Clouds',
        description: 'Partly cloudy',
        icon: '03d',
        precipitation: 0,
        humidity: 72,
        windSpeed: 8,
        hourlyForecasts: []
      },
      {
        date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        dayName: new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
        minTemp: 23,
        maxTemp: 33,
        condition: 'Clear',
        description: 'Clear sky',
        icon: '01d',
        precipitation: 0,
        humidity: 68,
        windSpeed: 6,
        hourlyForecasts: []
      },
      {
        date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        dayName: new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
        minTemp: 24,
        maxTemp: 34,
        condition: 'Clear',
        description: 'Clear sky',
        icon: '01d',
        precipitation: 0,
        humidity: 65,
        windSpeed: 5,
        hourlyForecasts: []
      }
    ],
    hourlyForecast: []
  },
  metadata: { keyUsed: 'demo', timestamp: new Date().toISOString() }
};

function isDemoMode(): boolean {
  try {
    const user = localStorage.getItem('farmease_user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.isDemo === true;
    }
  } catch {}
  return false;
}

export interface WeatherCondition {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  visibility: number | null;
  uvIndex: number | null;
  condition: string;
  description: string;
  icon: string;
  cloudiness: number;
  sunrise: string;
  sunset: string;
  timestamp: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
  description: string;
  icon: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  hourlyForecasts: HourlyForecast[];
}

export interface WeatherData {
  location: string;
  coordinates: { lat: number; lon: number };
  current: WeatherCondition;
}

export interface ForecastData {
  location: string;
  coordinates: { lat: number; lon: number };
  forecast: DailyForecast[];
  hourlyForecast: HourlyForecast[];
}

export interface WeatherResponse {
  success: boolean;
  weather: WeatherData;
  metadata: {
    keyUsed: string;
    timestamp: string;
  };
}

export interface ForecastResponse {
  success: boolean;
  forecast: ForecastData;
  metadata: {
    keyUsed: string;
    timestamp: string;
  };
}

export interface CompleteWeatherResponse {
  success: boolean;
  weather: WeatherData;
  forecast: ForecastData;
  metadata: {
    keyUsed: string;
    timestamp: string;
  };
}

export interface LandWeatherResponse {
  success: boolean;
  land: {
    id: string;
    name: string;
    location: string;
    coordinates: { lat: number; lon: number };
  };
  weather: WeatherData;
  forecast: ForecastData | null;
  metadata: {
    keyUsed: string;
    timestamp: string;
  };
}

class WeatherService {
  private getUserId(): string | null {
    const user = localStorage.getItem('farmease_user');
    if (!user) return null;
    try {
      const userData = JSON.parse(user);
      return userData.id || null;
    } catch {
      return null;
    }
  }

  async getCurrentWeather(lat: number, lon: number, location?: string): Promise<WeatherResponse> {
    try {
      // Return mock data for demo mode
      if (isDemoMode()) {
        return DEMO_WEATHER_RESPONSE as WeatherResponse;
      }

      const params = new URLSearchParams();
      if (location) params.append('location', location);

      const response = await api.get(`${API_BASE_URL}/weather/current/${lat}/${lon}?${params.toString()}`);
      
      return response;
    } catch (error: any) {
      console.error('Current weather fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch current weather'
      );
    }
  }

  async getForecast(lat: number, lon: number, location?: string, days: number = 5): Promise<ForecastResponse> {
    try {      // Return mock data for demo mode
      if (isDemoMode()) {
        return DEMO_FORECAST_RESPONSE as ForecastResponse;
      }
      const params = new URLSearchParams();
      if (location) params.append('location', location);
      params.append('days', days.toString());

      const response = await api.get(`${API_BASE_URL}/weather/forecast/${lat}/${lon}?${params.toString()}`);
      
      return response;
    } catch (error: any) {
      console.error('Weather forecast fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch weather forecast'
      );
    }
  }

  async getCompleteWeather(lat: number, lon: number, location?: string, days: number = 5): Promise<CompleteWeatherResponse> {
    try {      // Return mock data for demo mode
      if (isDemoMode()) {
        return {
          success: true,
          weather: DEMO_WEATHER_RESPONSE.weather,
          forecast: DEMO_FORECAST_RESPONSE.forecast,
          metadata: { keyUsed: 'demo', timestamp: new Date().toISOString() }
        } as CompleteWeatherResponse;
      }
      const params = new URLSearchParams();
      if (location) params.append('location', location);
      params.append('days', days.toString());

      const response = await api.get(`${API_BASE_URL}/weather/complete/${lat}/${lon}?${params.toString()}`);
      
      return response;
    } catch (error: any) {
      console.error('Complete weather fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch complete weather data'
      );
    }
  }

  async getWeatherByCity(cityName: string, country?: string, includeForecast: boolean = false): Promise<WeatherResponse> {
    try {
      const params = new URLSearchParams();
      if (country) params.append('country', country);
      if (includeForecast) params.append('forecast', 'true');

      const response = await api.get(`${API_BASE_URL}/weather/city/${encodeURIComponent(cityName)}?${params.toString()}`);
      
      return response;
    } catch (error: any) {
      console.error('City weather fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch weather for city'
      );
    }
  }

  async getLandWeather(landId: string, includeForecast: boolean = true): Promise<LandWeatherResponse> {
    try {
      // Return mock data for demo mode
      if (isDemoMode()) {
        return {
          success: true,
          land: {
            id: landId,
            name: 'North Field',
            location: 'Pollachi, Coimbatore',
            coordinates: { lat: 10.6593, lon: 77.0068 }
          },
          weather: DEMO_WEATHER_RESPONSE.weather,
          forecast: includeForecast ? DEMO_FORECAST_RESPONSE.forecast : null,
          metadata: { keyUsed: 'demo', timestamp: new Date().toISOString() }
        } as LandWeatherResponse;
      }

      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('forecast', includeForecast.toString());

      const response = await api.get(`${API_BASE_URL}/weather/land/${landId}?${params.toString()}`);
      
      return response;
    } catch (error: any) {
      console.error('Land weather fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch weather for land'
      );
    }
  }

  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  formatWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  formatTemperature(temp: number): string {
    return `${Math.round(temp)}°C`;
  }

  formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  getWeatherEmoji(condition: string): string {
    const emojis: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Dust': '🌪️',
      'Sand': '🌪️',
      'Smoke': '🌫️',
      'Squall': '💨',
      'Tornado': '🌪️'
    };
    return emojis[condition] || '🌤️';
  }

  getWeatherAdvice(condition: string, temperature: number): string[] {
    const advice: string[] = [];
    
    if (condition === 'Rain' || condition === 'Drizzle') {
      advice.push('🌧️ Good conditions for rice and other water-loving crops');
      advice.push('⚠️ Ensure proper drainage to prevent waterlogging');
      advice.push('🍄 Monitor for fungal diseases in humid conditions');
    } else if (condition === 'Clear' && temperature > 30) {
      advice.push('☀️ Ideal for crop drying and harvesting');
      advice.push('💧 Increase irrigation frequency');
      advice.push('🌿 Provide shade for sensitive plants');
    } else if (condition === 'Clouds') {
      advice.push('☁️ Good conditions for most farming activities');
      advice.push('🌱 Suitable for transplanting seedlings');
    } else if (condition === 'Thunderstorm') {
      advice.push('⛈️ Secure loose structures and equipment');
      advice.push('🌱 Protect young plants from hail damage');
      advice.push('⚠️ Avoid field work during storms');
    }

    if (temperature < 15) {
      advice.push('🌡️ Cold conditions - protect sensitive crops');
    } else if (temperature > 35) {
      advice.push('🌡️ High heat - ensure adequate water supply');
    }

    return advice;
  }
}

export default new WeatherService();