import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Droplets, 
  Thermometer, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  Bug,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { LandData } from '../../types/land';
import { landService } from '../../services/landService';

interface AnalyticsData {
  landData: LandData | null;
  weatherTrend: 'improving' | 'stable' | 'concerning';
  soilHealth: 'excellent' | 'good' | 'needs_attention';
  cropPerformance: number;
  marketTrend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  nextActions: string[];
  insights: string[];
}

interface FarmAnalyticsDashboardProps {
  onRecommendationRequest: (query: string) => void;
}

export default function FarmAnalyticsDashboard({ onRecommendationRequest }: FarmAnalyticsDashboardProps) {
  const { selectedLandId, lands } = useFarm();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedLand = lands.find(land => land.id === selectedLandId);

  useEffect(() => {
    let cancelled = false;
    const loadAnalytics = async () => {
      if (!selectedLandId) {
        setAnalytics(null);
        return;
      }

      setLoading(true);
      try {
        // Try to get data from API first, then fallback to mock data
        let landData: LandData | null = null;
        
        try {
          landData = await landService.getLandData(selectedLandId);
        } catch (error) {
          console.warn('API not available, using mock data:', error);
        }
        
        if (!landData) {
          landData = await landService.getMockLandData(selectedLandId);
        }
        
        if (cancelled) return;
        const analyticsData = generateAnalytics(landData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error loading analytics:', error);
        if (cancelled) return;
        // Create minimal mock analytics if everything fails
        setAnalytics({
          landData: null,
          weatherTrend: 'stable',
          soilHealth: 'good',
          cropPerformance: 75,
          marketTrend: 'stable',
          riskLevel: 'low',
          nextActions: ['soil_improvement'],
          insights: ['stable_weather']
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAnalytics();
    return () => { cancelled = true; };
  }, [selectedLandId]);

  const generateAnalytics = (landData: LandData): AnalyticsData => {
    // Analyze weather trend
    const recentWeather = landData.weatherHistory.slice(-7);
    const avgTemp = recentWeather.reduce((sum, w) => sum + w.temperature, 0) / recentWeather.length;
    const weatherTrend = avgTemp > 30 ? 'concerning' : avgTemp > 25 ? 'stable' : 'improving';

    // Analyze soil health
    const soil = landData.soilReport;
    let soilHealth: 'excellent' | 'good' | 'needs_attention' = 'good';
    if (soil) {
      const pHOptimal = soil.pH >= 6.0 && soil.pH <= 7.5;
      const nutrientsOk = soil.nitrogen > 50 && soil.phosphorus > 20 && soil.potassium > 100;
      soilHealth = (pHOptimal && nutrientsOk) ? 'excellent' : (!pHOptimal || !nutrientsOk) ? 'needs_attention' : 'good';
    }

    // Calculate crop performance
    const lastTreatments = landData.treatmentHistory.slice(-5);
    const pestIssues = landData.pestDiseaseHistory.filter(p => p.status === 'active').length;
    const cropPerformance = Math.max(20, 100 - (pestIssues * 20) - (lastTreatments.length * 5));

    // Market trend analysis
    const marketData = landData.marketData[0];
    let marketTrend: 'up' | 'down' | 'stable' = 'stable';
    if (marketData && marketData.priceHistory.length > 1) {
      const currentPrice = marketData.currentPrice;
      const previousPrice = marketData.priceHistory[marketData.priceHistory.length - 2]?.price || currentPrice;
      marketTrend = currentPrice > previousPrice ? 'up' : 
                   currentPrice < previousPrice ? 'down' : 'stable';
    }

    // Risk assessment
    const riskFactors = [
      weatherTrend === 'concerning',
      soilHealth === 'needs_attention',
      pestIssues > 0,
      cropPerformance < 70
    ];
    const riskCount = riskFactors.filter(Boolean).length;
    const riskLevel = riskCount >= 3 ? 'high' : riskCount >= 2 ? 'medium' : 'low';

    // Generate next actions
    const nextActions = [];
    if (soilHealth === 'needs_attention') nextActions.push('soil_improvement');
    if (pestIssues > 0) nextActions.push('pest_management');
    if (weatherTrend === 'concerning') nextActions.push('weather_protection');
    if (marketTrend === 'up') nextActions.push('harvest_planning');

    // Generate insights
    const insights = [];
    if (cropPerformance > 80) insights.push('excellent_crop_health');
    if (marketTrend === 'up') insights.push('favorable_market');
    if (weatherTrend === 'stable') insights.push('stable_weather');

    return {
      landData,
      weatherTrend,
      soilHealth,
      cropPerformance,
      marketTrend,
      riskLevel,
      nextActions,
      insights
    };
  };

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600 bg-green-100';
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'improving': 
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
      case 'concerning': 
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: 
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleActionClick = (action: string) => {
    const queries = {
      soil_improvement: `How can I improve soil health for ${selectedLand?.currentCrop}?`,
      pest_management: `What pest management strategies do you recommend?`,
      weather_protection: `How can I protect my crops from weather conditions?`,
      harvest_planning: `When should I harvest for the best market price?`
    };
    
    onRecommendationRequest(queries[action as keyof typeof queries] || `Help with ${action}`);
  };

  if (!selectedLand) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Farm Analytics Dashboard</h3>
          <p className="text-gray-700 font-medium mb-2">Select a land to view analytics</p>
          <p className="text-gray-600 text-sm">Choose from "My Lands" section to see detailed farm analytics, insights, and recommendations.</p>
          <div className="mt-4 p-3 bg-white rounded-lg border border-green-100">
            <p className="text-xs text-gray-500">
              💡 Analytics include crop health, soil conditions, weather trends, and market insights
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
            Farm Analytics Dashboard
          </h3>
          <p className="text-sm text-gray-600">{selectedLand.name} - {selectedLand.currentCrop}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(analytics.riskLevel)}`}>
          {analytics.riskLevel.toUpperCase()} RISK
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Crop Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <span className={`text-xs px-2 py-1 rounded-full ${getMetricColor(analytics.cropPerformance, { good: 80, warning: 60 })}`}>
              {analytics.cropPerformance}%
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-700">Crop Health</h4>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${analytics.cropPerformance}%` }}
            ></div>
          </div>
        </div>

        {/* Soil Health */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-brown-600" />
            {analytics.soilHealth === 'excellent' && <CheckCircle className="w-4 h-4 text-green-600" />}
            {analytics.soilHealth === 'good' && <Clock className="w-4 h-4 text-yellow-600" />}
            {analytics.soilHealth === 'needs_attention' && <AlertTriangle className="w-4 h-4 text-red-600" />}
          </div>
          <h4 className="text-sm font-medium text-gray-700">Soil Health</h4>
          <p className="text-xs text-gray-600 mt-1 capitalize">{analytics.soilHealth.replace('_', ' ')}</p>
        </div>

        {/* Weather Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Thermometer className="w-5 h-5 text-blue-600" />
            {getTrendIcon(analytics.weatherTrend)}
          </div>
          <h4 className="text-sm font-medium text-gray-700">Weather</h4>
          <p className="text-xs text-gray-600 mt-1 capitalize">{analytics.weatherTrend}</p>
        </div>

        {/* Market Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            {getTrendIcon(analytics.marketTrend)}
          </div>
          <h4 className="text-sm font-medium text-gray-700">Market</h4>
          <p className="text-xs text-gray-600 mt-1 capitalize">{analytics.marketTrend}</p>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Conditions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Activity className="w-4 h-4 text-blue-600 mr-2" />
            Current Conditions
          </h4>
          <div className="space-y-3">
            {analytics.landData?.weatherHistory.slice(-1).map((weather, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Temperature</span>
                <span className="text-sm font-medium">{weather.temperature}°C</span>
              </div>
            ))}
            {analytics.landData?.soilReport && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Soil pH</span>
                  <span className="text-sm font-medium">{analytics.landData.soilReport.pH}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nitrogen</span>
                  <span className="text-sm font-medium">{analytics.landData.soilReport.nitrogen} ppm</span>
                </div>
              </>
            )}
            {analytics.landData?.marketData[0] && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Market Price</span>
                <span className="text-sm font-medium">₹{analytics.landData.marketData[0].currentPrice}/qt</span>
              </div>
            )}
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Target className="w-4 h-4 text-green-600 mr-2" />
            Key Insights
          </h4>
          <div className="space-y-2">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  {insight === 'excellent_crop_health' && 'Your crops are performing excellently'}
                  {insight === 'favorable_market' && 'Market conditions are favorable for selling'}
                  {insight === 'stable_weather' && 'Weather conditions are stable'}
                </span>
              </div>
            ))}
            {analytics.insights.length === 0 && (
              <p className="text-sm text-gray-500">No specific insights at this time</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      {analytics.nextActions.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="w-4 h-4 text-green-600 mr-2" />
            Recommended Actions
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            {analytics.nextActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center">
                  {action === 'soil_improvement' && <Activity className="w-4 h-4 text-brown-600 mr-2" />}
                  {action === 'pest_management' && <Bug className="w-4 h-4 text-red-600 mr-2" />}
                  {action === 'weather_protection' && <Droplets className="w-4 h-4 text-blue-600 mr-2" />}
                  {action === 'harvest_planning' && <Calendar className="w-4 h-4 text-green-600 mr-2" />}
                  <span className="text-sm font-medium capitalize">
                    {action.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Click for detailed recommendations
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick AI Query */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Get AI Recommendations</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onRecommendationRequest('What fertilizer should I use?')}
            className="p-2 text-xs bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
          >
            Fertilizer Advice
          </button>
          <button
            onClick={() => onRecommendationRequest('When should I irrigate?')}
            className="p-2 text-xs bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            Irrigation Timing
          </button>
          <button
            onClick={() => onRecommendationRequest('How to manage pests?')}
            className="p-2 text-xs bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
          >
            Pest Control
          </button>
          <button
            onClick={() => onRecommendationRequest('Market analysis and harvest timing?')}
            className="p-2 text-xs bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors"
          >
            Market Analysis
          </button>
        </div>
      </div>
    </div>
  );
}