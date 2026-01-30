import { getEnvKeys, shouldRotate } from '../utils/apiKeys.js';
import axios from 'axios';


class WeatherService {
  constructor() {
    this.currentKeyIndex = 0;
    this.availableKeys = [];
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
    this.keysLoaded = false;
  }

  loadKeys() {
    if (this.keysLoaded) return; // Prevent reloading
    
    // Load keys and filter out obvious placeholders
    const rawKeys = getEnvKeys('OPENWEATHER');
    const isPlaceholder = (k) => /your[_-]?openweather[_-]?key/i.test(k);
    const filtered = rawKeys.filter(k => !isPlaceholder(k));

    const skipped = rawKeys.length - filtered.length;
    this.availableKeys = filtered;
    this.keysLoaded = true;

    console.log(`Loaded ${this.availableKeys.length} OpenWeather API keys${skipped > 0 ? ` (skipped ${skipped} placeholder${skipped > 1 ? 's' : ''})` : ''}`);
    if (this.availableKeys.length === 0) {
      console.warn('No valid OpenWeather API keys found. Please configure OPENWEATHER_API_KEYS in backend/.env');
    }
  }

  getCurrentKey() {
    this.loadKeys(); // Lazy load on first use
    if (this.availableKeys.length === 0) {
      throw new Error('No OpenWeather API keys available');
    }
    return this.availableKeys[this.currentKeyIndex];
  }

  rotateKey() {
    this.loadKeys(); // Ensure keys are loaded
    if (this.availableKeys.length <= 1) {
      console.warn('Cannot rotate: Only one or no OpenWeather API keys available');
      return false;
    }

    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.availableKeys.length;
    console.log(`Rotated to OpenWeather API key index: ${this.currentKeyIndex + 1}/${this.availableKeys.length}`);
    return true;
  }

  async getCurrentWeather(lat, lon, location = '') {
    this.loadKeys(); // Ensure keys are loaded before attempting requests
    let attempts = 0;
    const maxAttempts = Math.max(this.availableKeys.length, 1); // At least 1 attempt even if no keys

    while (attempts < maxAttempts) {
      try {
        const apiKey = this.getCurrentKey();
        const masked = this.maskKey(apiKey);
        console.log(
          `OpenWeather current request [key ${this.currentKeyIndex + 1} ${masked}] lat=${lat} lon=${lon} units=metric lang=en`
        );

        const response = await axios.get(`${this.baseURL}/weather`, {
          params: {
            lat: lat,
            lon: lon,
            appid: apiKey,
            units: 'metric',
            lang: 'en'
          },
          timeout: 10000 // 10 second timeout
        });

        const weather = response.data;
        console.log(
          `OpenWeather current response [key ${this.currentKeyIndex + 1} ${masked}] status=${response.status} name=${weather?.name} coord=(${weather?.coord?.lat},${weather?.coord?.lon}) temp=${weather?.main?.temp} desc=${weather?.weather?.[0]?.description}`
        );

        return {
          success: true,
          data: {
            location: location || weather.name,
            coordinates: { lat, lon },
            current: {
              temperature: Math.round(weather.main.temp),
              feelsLike: Math.round(weather.main.feels_like),
              humidity: weather.main.humidity,
              pressure: weather.main.pressure,
              windSpeed: weather.wind?.speed || 0,
              windDirection: weather.wind?.deg || 0,
              visibility: weather.visibility ? weather.visibility / 1000 : null, // Convert to km
              uvIndex: null, // Not available in current weather API
              condition: weather.weather[0].main,
              description: weather.weather[0].description,
              icon: weather.weather[0].icon,
              cloudiness: weather.clouds?.all || 0,
              sunrise: new Date(weather.sys.sunrise * 1000).toISOString(),
              sunset: new Date(weather.sys.sunset * 1000).toISOString(),
              timestamp: new Date().toISOString()
            }
          },
          keyUsed: `Key ${this.currentKeyIndex + 1}`
        };

      } catch (error) {
        const masked = this.maskKey(this.getCurrentKey());
        const status = error.response?.status;
        const detail = error.response?.data?.message || error.response?.data || error.message;
        console.error(`OpenWeather current API error [key ${this.currentKeyIndex + 1} ${masked}] status=${status}:`, detail);

        // Check if we should rotate the key based on error type
        if (this.shouldRotateForError(error)) {
          if (this.rotateKey()) {
            attempts++;
            continue;
          } else {
            break;
          }
        } else {
          throw error;
        }
      }
    }

    throw new Error(`All OpenWeather API keys exhausted after ${attempts} attempts`);
  }

  async getForecast(lat, lon, location = '', days = 5) {
    this.loadKeys(); // Ensure keys are loaded before attempting requests
    let attempts = 0;
    const maxAttempts = Math.max(this.availableKeys.length, 1); // At least 1 attempt even if no keys

    while (attempts < maxAttempts) {
      try {
        const apiKey = this.getCurrentKey();
        const masked = this.maskKey(apiKey);
        console.log(
          `OpenWeather forecast request [key ${this.currentKeyIndex + 1} ${masked}] lat=${lat} lon=${lon} days=${days} units=metric lang=en`
        );

        const response = await axios.get(`${this.baseURL}/forecast`, {
          params: {
            lat: lat,
            lon: lon,
            appid: apiKey,
            units: 'metric',
            lang: 'en',
            cnt: days * 8 // 8 forecasts per day (every 3 hours)
          },
          timeout: 10000
        });

        const forecast = response.data;
        const first = Array.isArray(forecast?.list) && forecast.list.length > 0 ? forecast.list[0] : null;
        console.log(
          `OpenWeather forecast response [key ${this.currentKeyIndex + 1} ${masked}] status=${response.status} city=${forecast?.city?.name} list=${forecast?.list?.length || 0} firstDt=${first ? first.dt : 'n/a'}`
        );

        // Group forecasts by day
        const dailyForecasts = this.groupForecastsByDay(forecast.list);

        return {
          success: true,
          data: {
            location: location || forecast.city.name,
            coordinates: { lat, lon },
            forecast: dailyForecasts.slice(0, days),
            hourlyForecast: forecast.list.slice(0, 24).map(item => ({ // Next 24 hours
              time: new Date(item.dt * 1000).toISOString(),
              temperature: Math.round(item.main.temp),
              condition: item.weather[0].main,
              description: item.weather[0].description,
              icon: item.weather[0].icon,
              humidity: item.main.humidity,
              windSpeed: item.wind?.speed || 0,
              precipitation: item.rain ? (item.rain['3h'] || 0) : 0
            }))
          },
          keyUsed: `Key ${this.currentKeyIndex + 1}`
        };

      } catch (error) {
        const masked = this.maskKey(this.getCurrentKey());
        const status = error.response?.status;
        const detail = error.response?.data?.message || error.response?.data || error.message;
        console.error(`OpenWeather forecast API error [key ${this.currentKeyIndex + 1} ${masked}] status=${status}:`, detail);

        if (this.shouldRotateForError(error)) {
          if (this.rotateKey()) {
            attempts++;
            continue;
          } else {
            break;
          }
        } else {
          throw error;
        }
      }
    }

    throw new Error(`All OpenWeather API keys exhausted for forecast after ${attempts} attempts`);
  }

  groupForecastsByDay(forecasts) {
    const days = {};

    forecasts.forEach(forecast => {
      const date = new Date(forecast.dt * 1000);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!days[dayKey]) {
        days[dayKey] = {
          date: dayKey,
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          forecasts: []
        };
      }

      days[dayKey].forecasts.push({
        time: date.toISOString(),
        temperature: Math.round(forecast.main.temp),
        feelsLike: Math.round(forecast.main.feels_like),
        humidity: forecast.main.humidity,
        condition: forecast.weather[0].main,
        description: forecast.weather[0].description,
        icon: forecast.weather[0].icon,
        windSpeed: forecast.wind?.speed || 0,
        precipitation: forecast.rain ? (forecast.rain['3h'] || 0) : 0
      });
    });

    // Convert to array and calculate daily summary
    return Object.values(days).map(day => {
      const temps = day.forecasts.map(f => f.temperature);
      const conditions = day.forecasts.map(f => f.condition);
      const precipitations = day.forecasts.map(f => f.precipitation);

      // Get most common condition
      const conditionCounts = {};
      conditions.forEach(condition => {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      });
      const dominantCondition = Object.keys(conditionCounts).reduce((a, b) =>
        conditionCounts[a] > conditionCounts[b] ? a : b
      );

      // Find the forecast with dominant condition for icon
      const dominantForecast = day.forecasts.find(f => f.condition === dominantCondition);

      return {
        date: day.date,
        dayName: day.dayName,
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        condition: dominantCondition,
        description: dominantForecast?.description || '',
        icon: dominantForecast?.icon || '',
        precipitation: Math.max(...precipitations),
        humidity: Math.round(day.forecasts.reduce((sum, f) => sum + f.humidity, 0) / day.forecasts.length),
        windSpeed: Math.round(day.forecasts.reduce((sum, f) => sum + f.windSpeed, 0) / day.forecasts.length),
        hourlyForecasts: day.forecasts
      };
    });
  }

  shouldRotateForError(error) {
    // Rotate on rate limit, invalid key, or server errors
    if (error.response) {
      const status = error.response.status;
      return status === 401 || status === 429 || status >= 500;
    }
    // Also rotate on network errors
    return error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND';
  }

  async getWeatherByCity(cityName, countryCode = '') {
    this.loadKeys(); // Ensure keys are loaded before attempting requests
    let attempts = 0;
    const maxAttempts = Math.max(this.availableKeys.length, 1); // At least 1 attempt even if no keys

    while (attempts < maxAttempts) {
      try {
        const apiKey = this.getCurrentKey();
        const masked = this.maskKey(apiKey);
        console.log(
          `OpenWeather city lookup request [key ${this.currentKeyIndex + 1} ${masked}] q=${countryCode ? `${cityName},${countryCode}` : cityName}`
        );
        const query = countryCode ? `${cityName},${countryCode}` : cityName;

        const response = await axios.get(`${this.baseURL}/weather`, {
          params: {
            q: query,
            appid: apiKey,
            units: 'metric',
            lang: 'en'
          },
          timeout: 10000
        });

        const weather = response.data;
        console.log(
          `OpenWeather city lookup response [key ${this.currentKeyIndex + 1} ${masked}] status=${response.status} name=${weather?.name} coord=(${weather?.coord?.lat},${weather?.coord?.lon})`
        );

        return {
          success: true,
          coordinates: {
            lat: weather.coord.lat,
            lon: weather.coord.lon
          },
          location: weather.name
        };

      } catch (error) {
        const masked = this.maskKey(this.getCurrentKey());
        const status = error.response?.status;
        const detail = error.response?.data?.message || error.response?.data || error.message;
        console.error(`OpenWeather city lookup error [key ${this.currentKeyIndex + 1} ${masked}] status=${status}:`, detail);

        if (this.shouldRotateForError(error)) {
          if (this.rotateKey()) {
            attempts++;
            continue;
          } else {
            break;
          }
        } else {
          throw error;
        }
      }
    }

    throw new Error(`All OpenWeather API keys exhausted for city lookup after ${attempts} attempts`);
  }

  maskKey(key) {
    if (!key || key.length < 8) return '(invalid)';
    return key.slice(0, 4) + '…' + key.slice(-4);
  }

  getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  formatWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }
}

export default new WeatherService();
