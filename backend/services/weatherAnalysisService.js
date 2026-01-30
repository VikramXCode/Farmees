import axios from 'axios';
import dotenv from 'dotenv';
import WeatherSnapshot from '../models/WeatherSnapshot.js';
import FarmingPlan from '../models/FarmingPlan.js';
import Notification from '../models/Notification.js';

dotenv.config();

/**
 * Weather Analysis Service
 * Fetches weather data and analyzes farming impacts
 * Provides activity scheduling recommendations
 */
class WeatherAnalysisService {
  
  constructor() {
    this.apiKeys = null;
    this.keysLoaded = false;
  }
  
  /**
   * Lazy load API keys
   */
  loadKeys() {
    if (this.keysLoaded) return;
    
    const keys = [
      process.env.OPENWEATHER_API_KEY_1,
      process.env.OPENWEATHER_API_KEY_2,
      process.env.OPENWEATHER_API_KEY_3
    ].filter(key => key);
    
    if (keys.length === 0) {
      console.warn('No OpenWeather API keys found');
    }
    
    this.apiKeys = keys;
    this.keysLoaded = true;
  }
  
  /**
   * Get farming forecast for plan location
   */
  async getFarmingForecast(planId) {
    try {
      this.loadKeys();
      
      const plan = await FarmingPlan.findById(planId).populate('landId');
      if (!plan) throw new Error('Plan not found');
      
      const land = plan.landId;
      if (!land || !land.coordinates) {
        throw new Error('Land coordinates not available');
      }
      
      const [longitude, latitude] = land.coordinates.coordinates;
      
      // Fetch 7-day forecast from OpenWeather
      const forecast = await this.fetchWeatherForecast(latitude, longitude);
      
      // Analyze farming impacts
      const analysisResults = [];
      for (const day of forecast) {
        const impact = this.analyzeFarmingImpact(day, plan.cropName);
        analysisResults.push({
          date: day.date,
          temp: day.temp,
          humidity: day.humidity,
          rainfallProbability: day.rainfallProbability,
          rainfallAmount: day.rainfallAmount,
          windSpeed: day.windSpeed,
          uvIndex: day.uvIndex,
          ...impact
        });
      }
      
      // Save snapshot to database
      const snapshot = await WeatherSnapshot.create({
        planId: planId,
        location: {
          latitude: latitude,
          longitude: longitude,
          city: land.city,
          district: land.district,
          state: land.state
        },
        forecast: analysisResults,
        snapshotDate: new Date()
      });
      
      return snapshot;
      
    } catch (error) {
      console.error('Error getting farming forecast:', error);
      throw error;
    }
  }
  
  /**
   * Fetch weather forecast from API
   */
  async fetchWeatherForecast(lat, lon) {
    try {
      if (!this.apiKeys || this.apiKeys.length === 0) {
        throw new Error('No weather API keys available');
      }
      
      const url = `https://api.openweathermap.org/data/2.5/forecast`;
      const params = {
        lat: lat,
        lon: lon,
        appid: this.apiKeys[0],
        units: 'metric',
        cnt: 40 // 5 days, 3-hour intervals
      };
      
      const response = await axios.get(url, { params, timeout: 5000 });
      
      // Group by day and calculate daily stats
      const dailyData = {};
      for (const item of response.data.list) {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date: new Date(date),
            temps: [],
            humidity: [],
            rainfall: [],
            windSpeed: [],
            uvIndex: item.uvi || 5 // Default if not available
          };
        }
        
        dailyData[date].temps.push(item.main.temp);
        dailyData[date].humidity.push(item.main.humidity);
        dailyData[date].rainfall.push((item.rain?.['3h'] || 0) / 3); // Convert to mm/hr
        dailyData[date].windSpeed.push(item.wind.speed);
      }
      
      // Calculate daily averages
      const forecast = [];
      for (const date in dailyData) {
        const day = dailyData[date];
        forecast.push({
          date: day.date,
          temp: {
            min: Math.min(...day.temps),
            max: Math.max(...day.temps),
            avg: day.temps.reduce((a, b) => a + b, 0) / day.temps.length
          },
          humidity: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
          rainfallAmount: day.rainfall.reduce((a, b) => a + b, 0),
          rainfallProbability: day.rainfall.some(r => r > 0) ? 70 : 20,
          windSpeed: day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length,
          uvIndex: day.uvIndex
        });
      }
      
      return forecast.slice(0, 7); // Return 7 days
      
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  }
  
  /**
   * Analyze farming impact of weather
   */
  analyzeFarmingImpact(weatherData, cropName) {
    const impact = {
      irrigationNeeded: false,
      pestRisk: 'low',
      diseaseRisk: 'low',
      heatStress: false,
      coldStress: false,
      favorableConditions: true
    };
    
    // Temperature analysis
    if (weatherData.temp.max > 35) {
      impact.heatStress = true;
      impact.favorableConditions = false;
    }
    if (weatherData.temp.min < 10) {
      impact.coldStress = true;
      impact.favorableConditions = false;
    }
    
    // Rainfall analysis
    if (weatherData.rainfallAmount < 2 && weatherData.humidity < 60) {
      impact.irrigationNeeded = true;
    }
    
    // Pest and disease risk
    if (weatherData.humidity > 80 && weatherData.temp.avg > 20) {
      impact.pestRisk = 'high';
      impact.diseaseRisk = 'high';
    } else if (weatherData.humidity > 70) {
      impact.pestRisk = 'medium';
      impact.diseaseRisk = 'medium';
    }
    
    // Heavy rain warning
    if (weatherData.rainfallAmount > 20) {
      impact.favorableConditions = false;
    }
    
    return impact;
  }
  
  /**
   * Check if activity should be delayed due to weather
   */
  async shouldDelayActivity(planId, activityId) {
    try {
      const plan = await FarmingPlan.findById(planId);
      if (!plan) throw new Error('Plan not found');
      
      const activity = plan.activities.id(activityId);
      if (!activity) throw new Error('Activity not found');
      
      const forecast = await this.getFarmingForecast(planId);
      const activityDate = new Date(activity.scheduledDate);
      
      // Find weather for activity date
      const weatherForDay = forecast.forecast.find(day => 
        this.isSameDay(new Date(day.date), activityDate)
      );
      
      if (!weatherForDay) {
        return {
          shouldDelay: false,
          reason: 'No forecast available'
        };
      }
      
      const decision = this.makeActivityDecision(activity.activityType, weatherForDay);
      
      // Save decision to weather snapshot
      forecast.decision = {
        action: decision.action,
        reasonEnglish: decision.reasonEnglish,
        reasonTamil: decision.reasonTamil,
        affectedActivityType: activity.activityType,
        suggestedDate: decision.suggestedDate
      };
      await forecast.save();
      
      // Create weather warning notification if needed
      if (decision.action === 'delay' || decision.action === 'warning') {
        await Notification.create({
          userId: plan.userId,
          planId: planId,
          activityId: activityId,
          type: 'weather',
          titleEnglish: `Weather Alert: ${this.formatActivityType(activity.activityType)}`,
          titleTamil: `வானிலை எச்சரிக்கை: ${this.formatActivityTypeTamil(activity.activityType)}`,
          messageEnglish: decision.reasonEnglish,
          messageTamil: decision.reasonTamil,
          scheduledFor: new Date(),
          deliveryChannels: ['in_app'],
          priority: 'high'
        });
      }
      
      return {
        shouldDelay: decision.action === 'delay',
        action: decision.action,
        reason: decision.reasonEnglish,
        reasonTamil: decision.reasonTamil,
        suggestedDate: decision.suggestedDate,
        weatherData: weatherForDay
      };
      
    } catch (error) {
      console.error('Error checking weather delay:', error);
      throw error;
    }
  }
  
  /**
   * Make activity scheduling decision based on weather
   */
  makeActivityDecision(activityType, weather) {
    const decision = {
      action: 'proceed',
      reasonEnglish: 'Weather conditions are favorable',
      reasonTamil: 'வானிலை சாதகமாக உள்ளது',
      suggestedDate: null
    };
    
    // Rain-sensitive activities
    const rainSensitive = ['harvesting', 'fertilizer_application', 'pest_control'];
    if (rainSensitive.includes(activityType) && weather.rainfallAmount > 10) {
      decision.action = 'delay';
      decision.reasonEnglish = `Heavy rain expected (${Math.round(weather.rainfallAmount)}mm). Delay ${this.formatActivityType(activityType)} to avoid crop damage.`;
      decision.reasonTamil = `அதிக மழை எதிர்பார்க்கப்படுகிறது (${Math.round(weather.rainfallAmount)}மிமீ). பயிர் சேதத்தைத் தவிர்க்க ${this.formatActivityTypeTamil(activityType)} தாமதப்படுத்தவும்.`;
      decision.suggestedDate = this.getNextGoodWeatherDay(weather);
    }
    
    // Heat-sensitive activities
    if (activityType === 'seed_sowing' && weather.heatStress) {
      decision.action = 'warning';
      decision.reasonEnglish = `High temperature (${Math.round(weather.temp.max)}°C). Consider evening sowing for better germination.`;
      decision.reasonTamil = `அதிக வெப்பநிலை (${Math.round(weather.temp.max)}°C). சிறந்த முளைப்புக்கு மாலை நேரத்தில் விதைக்கவும்.`;
    }
    
    // Irrigation based on rainfall
    if (activityType === 'irrigation' && weather.rainfallAmount > 5) {
      decision.action = 'skip';
      decision.reasonEnglish = `Rain expected (${Math.round(weather.rainfallAmount)}mm). Natural irrigation sufficient.`;
      decision.reasonTamil = `மழை எதிர்பார்க்கப்படுகிறது (${Math.round(weather.rainfallAmount)}மிமீ). இயற்கை நீர்ப்பாசனம் போதுமானது.`;
    }
    
    // Disease risk warning
    if (weather.diseaseRisk === 'high') {
      decision.action = 'warning';
      decision.reasonEnglish = `High humidity (${Math.round(weather.humidity)}%). Monitor for fungal diseases.`;
      decision.reasonTamil = `அதிக ஈரப்பதம் (${Math.round(weather.humidity)}%). பூஞ்சை நோய்களைக் கண்காணிக்கவும்.`;
    }
    
    return decision;
  }
  
  /**
   * Find next day with good weather
   */
  getNextGoodWeatherDay(currentWeather) {
    const nextDay = new Date(currentWeather.date);
    nextDay.setDate(nextDay.getDate() + 2); // Suggest 2 days later
    return nextDay;
  }
  
  /**
   * Check if two dates are the same day
   */
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  /**
   * Format activity type
   */
  formatActivityType(activityType) {
    const map = {
      land_preparation: 'Land Preparation',
      ploughing: 'Ploughing',
      seed_sowing: 'Seed Sowing',
      fertilizer_application: 'Fertilizer Application',
      irrigation: 'Irrigation',
      weeding: 'Weeding',
      pest_control: 'Pest Control',
      harvesting: 'Harvesting',
      sale: 'Crop Sale',
      other: 'Other Activity'
    };
    return map[activityType] || activityType;
  }
  
  /**
   * Format activity type in Tamil
   */
  formatActivityTypeTamil(activityType) {
    const map = {
      land_preparation: 'நில தயாரிப்பு',
      ploughing: 'உழவு',
      seed_sowing: 'விதைத்தல்',
      fertilizer_application: 'உரமிடுதல்',
      irrigation: 'நீர்ப்பாசனம்',
      weeding: 'களை எடுத்தல்',
      pest_control: 'பூச்சி கட்டுப்பாடு',
      harvesting: 'அறுவடை',
      sale: 'விற்பனை',
      other: 'மற்ற செயல்பாடு'
    };
    return map[activityType] || activityType;
  }
}

export default new WeatherAnalysisService();
