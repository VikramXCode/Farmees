import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

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
      const params = new URLSearchParams();
      if (location) params.append('location', location);

      const response = await axios.get(`${API_BASE_URL}/weather/current/${lat}/${lon}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Current weather fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch current weather'
      );
    }
  }

  async getForecast(lat: number, lon: number, location?: string, days: number = 5): Promise<ForecastResponse> {
    try {
      const params = new URLSearchParams();
      if (location) params.append('location', location);
      params.append('days', days.toString());

      const response = await axios.get(`${API_BASE_URL}/weather/forecast/${lat}/${lon}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Weather forecast fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch weather forecast'
      );
    }
  }

  async getCompleteWeather(lat: number, lon: number, location?: string, days: number = 5): Promise<CompleteWeatherResponse> {
    try {
      const params = new URLSearchParams();
      if (location) params.append('location', location);
      params.append('days', days.toString());

      const response = await axios.get(`${API_BASE_URL}/weather/complete/${lat}/${lon}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.data;
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

      const response = await axios.get(`${API_BASE_URL}/weather/city/${encodeURIComponent(cityName)}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('City weather fetch error:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to fetch weather for city'
      );
    }
  }

  async getLandWeather(landId: string, includeForecast: boolean = true): Promise<LandWeatherResponse> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('forecast', includeForecast.toString());

      const response = await axios.get(`${API_BASE_URL}/weather/land/${landId}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.data;
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