const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const Land = require('../models/Land');
const { isDemoUser, DEMO_WEATHER } = require('../middleware/demoMode');

// Get current weather by coordinates
router.get('/current/:lat/:lon', async (req, res) => {
  try {
    // Check if demo mode
    if (req.isDemo) {
      return res.json(DEMO_WEATHER);
    }

    const { lat, lon } = req.params;
    const { location } = req.query;

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Coordinates out of range' });
    }

    const result = await weatherService.getCurrentWeather(latitude, longitude, location);
    
    return res.json({
      success: true,
      weather: result.data,
      metadata: {
        keyUsed: result.keyUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Current weather API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current weather',
      details: error.message 
    });
  }
});

// Get weather forecast by coordinates
router.get('/forecast/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { location, days = 5 } = req.query;

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const forecastDays = parseInt(days);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Coordinates out of range' });
    }

    if (forecastDays < 1 || forecastDays > 5) {
      return res.status(400).json({ error: 'Days must be between 1 and 5' });
    }

    const result = await weatherService.getForecast(latitude, longitude, location, forecastDays);
    
    res.json({
      success: true,
      forecast: result.data,
      metadata: {
        keyUsed: result.keyUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Weather forecast API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather forecast',
      details: error.message 
    });
  }
});

// Get weather by city name
router.get('/city/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const { country, forecast = false } = req.query;

    if (!cityName || cityName.trim().length === 0) {
      return res.status(400).json({ error: 'City name is required' });
    }

    // First get coordinates for the city
    const cityResult = await weatherService.getWeatherByCity(cityName, country);
    
    if (!cityResult.success) {
      return res.status(404).json({ error: 'City not found' });
    }

    const { lat, lon } = cityResult.coordinates;
    
    // Get current weather
    const currentWeather = await weatherService.getCurrentWeather(lat, lon, cityResult.location);
    
    let forecastData = null;
    if (forecast === 'true') {
      const forecastResult = await weatherService.getForecast(lat, lon, cityResult.location);
      forecastData = forecastResult.data;
    }

    res.json({
      success: true,
      weather: currentWeather.data,
      forecast: forecastData,
      metadata: {
        keyUsed: currentWeather.keyUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('City weather API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather for city',
      details: error.message 
    });
  }
});

// Get weather for a specific land
router.get('/land/:landId', async (req, res) => {
  try {
    const { landId } = req.params;
    const { userId, forecast = true } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Find the land
    const land = await Land.findOne({ landId: landId, userId });
    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    // Extract coordinates from land location
    let latitude, longitude;
    
    if (land.coordinates && land.coordinates.lat && land.coordinates.lon) {
      latitude = land.coordinates.lat;
      longitude = land.coordinates.lon;
    } else if (land.location) {
      // Try to parse coordinates from location string or use city lookup
      try {
        const cityResult = await weatherService.getWeatherByCity(land.location);
        latitude = cityResult.coordinates.lat;
        longitude = cityResult.coordinates.lon;
      } catch (error) {
        console.error('Could not get coordinates for land location:', land.location);
        return res.status(400).json({ 
          error: 'Could not determine location coordinates',
          details: 'Please ensure land has valid coordinates or location name'
        });
      }
    } else {
      return res.status(400).json({ 
        error: 'Land coordinates not available',
        details: 'Please add coordinates or location to the land record'
      });
    }

    // Get current weather
    const currentWeather = await weatherService.getCurrentWeather(latitude, longitude, land.location);
    
    let forecastData = null;
    if (forecast === 'true') {
      const forecastResult = await weatherService.getForecast(latitude, longitude, land.location);
      forecastData = forecastResult.data;
    }

    res.json({
      success: true,
      land: {
        id: land.landId,
        name: land.name,
        location: land.location,
        coordinates: { lat: latitude, lon: longitude }
      },
      weather: currentWeather.data,
      forecast: forecastData,
      metadata: {
        keyUsed: currentWeather.keyUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Land weather API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather for land',
      details: error.message 
    });
  }
});

// Get combined weather data (current + forecast) by coordinates
router.get('/complete/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { location, days = 5 } = req.query;

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const forecastDays = parseInt(days);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Coordinates out of range' });
    }

    // Get both current weather and forecast
    const [currentResult, forecastResult] = await Promise.all([
      weatherService.getCurrentWeather(latitude, longitude, location),
      weatherService.getForecast(latitude, longitude, location, forecastDays)
    ]);
    
    res.json({
      success: true,
      weather: currentResult.data,
      forecast: forecastResult.data,
      metadata: {
        keyUsed: currentResult.keyUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Complete weather API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch complete weather data',
      details: error.message 
    });
  }
});

// Test endpoint to verify weather service
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Weather service is working',
      keysLoaded: weatherService.availableKeys ? weatherService.availableKeys.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;