# Weather API Setup

## OpenWeather API Integration

This application uses OpenWeather API to provide real-time weather data and forecasts for agricultural lands.

### Setup Instructions

1. **Get OpenWeather API Keys**
   - Go to [OpenWeather API](https://openweathermap.org/api)
   - Sign up for a free account
   - Generate API keys from your dashboard
   - Free tier includes: 1,000 calls/day, 60 calls/minute

2. **Configure API Keys**
   - Open `backend/.env` file
   - Replace the placeholder values in `OPENWEATHER_API_KEYS` with your actual API keys
   - You can add multiple keys separated by commas for quota management

   ```
   OPENWEATHER_API_KEYS=your_actual_key_1,your_actual_key_2,your_actual_key_3
   ```

3. **API Key Rotation**
   - The system automatically rotates between multiple API keys
   - When one key reaches its quota, it switches to the next available key
   - This ensures uninterrupted weather data access

### Features Implemented

✅ **Multiple API Keys Support**
- Automatic rotation when quota is exceeded
- Fallback mechanism for reliability

✅ **Weather Endpoints**
- Current weather by coordinates
- 5-day weather forecast
- Land-specific weather data
- Complete weather information

✅ **Weather UI Component**
- Real-time current conditions
- 5-day forecast display
- Land-specific weather alerts
- Farming recommendations based on weather
- Responsive design with weather icons

✅ **Integration with Land Selection**
- Weather data automatically loads when a land is selected
- Fallback coordinates for demonstration (Kochi, Kerala)
- Error handling and loading states

### Testing

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Select a land in the application to see weather data

### API Endpoints

- `GET /api/weather/current/:lat/:lon` - Current weather
- `GET /api/weather/forecast/:lat/:lon` - 5-day forecast
- `GET /api/weather/land/:landId` - Land-specific weather
- `GET /api/weather/complete/:lat/:lon` - Combined current + forecast

### Notes

- Currently uses fallback coordinates (Kochi, Kerala: 9.9312, 76.2673) for demonstration
- In production, you would:
  - Geocode land locations to get actual coordinates
  - Store coordinates in the Land model
  - Implement location services for precise weather data