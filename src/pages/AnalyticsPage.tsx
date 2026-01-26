import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Leaf, 
  DollarSign, 
  BarChart3, 
  Target,
  Calendar,
  Droplets,
  ThermometerSun,
  Bug,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';
import { PageContainer } from '../components/layout/AppShell';
import { 
  getAnalytics, 
  AnalyticsData, 
  formatCurrency, 
  getTrendIcon,
  getRiskColor,
  getPriorityColor
} from '../services/analyticsService';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const { lands } = useFarm();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'yield' | 'price' | 'risk'>('overview');
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  // Generate yield improvement recommendations based on factors
  const getYieldRecommendations = (factors: any, comparedToAverage: number) => {
    const recommendations: { title: string; description: string; impact: string; icon: string }[] = [];
    
    // Soil health recommendations
    if (factors.soilHealth === 'poor' || factors.soilHealth === 'average') {
      recommendations.push({
        title: 'Improve Soil Health',
        description: 'Add organic compost (2-3 tonnes/acre) and green manure. Consider soil testing to identify specific nutrient deficiencies.',
        impact: '+15-20% yield',
        icon: '🌱'
      });
      recommendations.push({
        title: 'Balanced Fertilization',
        description: 'Apply NPK fertilizers based on soil test results. Split nitrogen application into 2-3 doses for better absorption.',
        impact: '+10-15% yield',
        icon: '🧪'
      });
    } else if (factors.soilHealth === 'good') {
      recommendations.push({
        title: 'Maintain Soil Quality',
        description: 'Continue crop rotation practices. Add organic matter annually to sustain soil health.',
        impact: 'Maintains yield',
        icon: '✅'
      });
    }
    
    // Weather-based recommendations
    if (factors.weatherCondition === 'drought' || factors.weatherRisk === 'high') {
      recommendations.push({
        title: 'Water Management',
        description: 'Install drip irrigation to reduce water usage by 40%. Apply mulching to retain soil moisture.',
        impact: '+20-25% yield',
        icon: '💧'
      });
    } else if (factors.weatherCondition === 'excess_rain' || factors.weatherCondition === 'flood') {
      recommendations.push({
        title: 'Drainage Improvement',
        description: 'Create proper drainage channels. Raise bed height for sensitive crops.',
        impact: '+15-20% yield',
        icon: '🌊'
      });
    }
    
    // Pest pressure recommendations
    if (factors.pestPressure === 'high' || factors.pestPressure === 'medium') {
      recommendations.push({
        title: 'Integrated Pest Management',
        description: 'Use pheromone traps for monitoring. Apply neem-based pesticides as first line of defense. Introduce beneficial insects.',
        impact: '+10-15% yield',
        icon: '🐛'
      });
      recommendations.push({
        title: 'Timely Pesticide Application',
        description: 'Scout fields weekly. Apply pesticides early morning or evening for best results.',
        impact: '+8-12% yield',
        icon: '🎯'
      });
    }
    
    // General yield improvement tips
    if (comparedToAverage < 10) {
      recommendations.push({
        title: 'Use Quality Seeds',
        description: 'Switch to certified high-yielding varieties (HYV). Replace seeds every 3-4 seasons.',
        impact: '+15-25% yield',
        icon: '🌾'
      });
      recommendations.push({
        title: 'Optimal Plant Spacing',
        description: 'Maintain recommended spacing for better sunlight and air circulation. Avoid overcrowding.',
        impact: '+5-10% yield',
        icon: '📏'
      });
    }
    
    // Always add these general tips
    recommendations.push({
      title: 'Timely Operations',
      description: 'Sow within recommended window. Harvest at right maturity to minimize losses.',
      impact: '+5-8% yield',
      icon: '⏰'
    });
    
    return recommendations.slice(0, 5); // Return top 5 recommendations
  };

  // Get user's crops from lands
  const userCrops = lands.map(l => l.currentCrop).filter(Boolean);
  const totalArea = lands.reduce((sum, l) => sum + (l.area || 0), 0);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalytics({
        crops: userCrops.length > 0 ? userCrops : ['Rice'],
        area: totalArea || 5,
        location: user?.district || 'Tamil Nadu'
      });
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [lands.length]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Analyzing your farm data...</p>
          <p className="text-gray-400 text-sm mt-2">Generating predictions</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !analytics) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-600 font-medium">{error || 'Failed to load analytics'}</p>
          <button 
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  const { yieldPrediction, priceForecast, riskAssessment, potentialRevenue, insights } = analytics;

  // Defensive checks for missing data
  if (!priceForecast || !priceForecast.forecast) {
    console.error('Price forecast data missing:', analytics);
  }

  return (
    <PageContainer>
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              <h1 className="text-xl font-bold">Predictive Analytics</h1>
            </div>
            <button 
              onClick={loadAnalytics}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-green-100 text-sm">
            AI-powered predictions for {userCrops.length > 0 ? userCrops.join(', ') : 'your crops'} • {totalArea || 5} acres
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Predicted Yield */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Leaf className="w-5 h-5" />
              <span className="text-xs font-medium">Expected Yield</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {(yieldPrediction.predictedYieldKg / 1000).toFixed(1)}
              <span className="text-sm font-normal text-gray-500 ml-1">tonnes</span>
            </p>
            <div className="flex items-center mt-1">
              <span className={`text-xs ${yieldPrediction.comparedToAverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yieldPrediction.comparedToAverage >= 0 ? '↑' : '↓'} {Math.abs(yieldPrediction.comparedToAverage)}% vs avg
              </span>
            </div>
          </div>

          {/* Expected Revenue */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-xs font-medium">Expected Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(potentialRevenue.expected)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Range: {formatCurrency(potentialRevenue.minimum)} - {formatCurrency(potentialRevenue.maximum)}
            </div>
          </div>

          {/* Price Trend */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-medium">Price Trend</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ₹{priceForecast?.currentPrice || '--'}
              <span className="text-sm font-normal text-gray-500 ml-1">/kg</span>
            </p>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-600">
                {priceForecast?.trend ? `${getTrendIcon(priceForecast.trend)} ${priceForecast.trend.charAt(0).toUpperCase() + priceForecast.trend.slice(1)}` : 'Loading...'}
              </span>
            </div>
          </div>

          {/* Risk Level */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-xs font-medium">Risk Level</span>
            </div>
            <p className={`text-2xl font-bold ${
              riskAssessment.overallRiskLevel === 'high' ? 'text-red-600' :
              riskAssessment.overallRiskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {riskAssessment.overallRiskLevel.charAt(0).toUpperCase() + riskAssessment.overallRiskLevel.slice(1)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              {riskAssessment.risks.length} risk factor{riskAssessment.risks.length !== 1 ? 's' : ''} detected
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow p-4 border border-yellow-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h2 className="font-semibold text-gray-800">AI Insights</h2>
          </div>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{insight.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        insight.actionType === 'immediate' ? 'bg-red-200 text-red-700' :
                        insight.actionType === 'planned' ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {insight.actionType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex border-b">
            {(['overview', 'yield', 'price', 'risk'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Best Time to Sell: {priceForecast?.bestSellingPeriod || 'Calculating...'}
                </h3>
                
                {/* Mini Price Chart */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Price Forecast (6 months)</p>
                  {priceForecast?.forecast && priceForecast.forecast.length > 0 ? (
                    (() => {
                      const prices = priceForecast.forecast.map(f => f.predictedPrice || 0);
                      const maxPrice = Math.max(...prices);
                      const minPrice = Math.min(...prices);
                      const range = maxPrice - minPrice;
                      
                      // Dynamic Y-axis scaling based on price range
                      // Add padding of 10% above and below
                      const padding = range > 0 ? range * 0.1 : 1;
                      const yMin = Math.floor(minPrice - padding);
                      const yMax = Math.ceil(maxPrice + padding);
                      const yRange = yMax - yMin;
                      
                      return (
                        <>
                          <div className="flex">
                            {/* Y-axis labels */}
                            <div className="flex flex-col justify-between h-28 pr-2 text-[9px] text-gray-500">
                              <span>₹{yMax.toFixed(0)}</span>
                              <span>₹{((yMax + yMin) / 2).toFixed(0)}</span>
                              <span>₹{yMin.toFixed(0)}</span>
                            </div>
                            
                            {/* Bars */}
                            <div className="flex-1 flex items-end justify-between h-28 gap-1 border-l border-b border-gray-300">
                              {priceForecast.forecast.map((item, idx) => {
                                // Calculate height as percentage of Y-axis range
                                const barHeight = yRange > 0 
                                  ? ((item.predictedPrice - yMin) / yRange) * 100 
                                  : 50;
                                return (
                                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                                    <div className="text-[8px] text-gray-600 mb-0.5 font-medium">
                                      ₹{item.predictedPrice?.toFixed(1)}
                                    </div>
                                    <div 
                                      className={`w-full rounded-t transition-all ${item.isPeakSeason ? 'bg-green-500' : 'bg-blue-400'}`}
                                      style={{ height: `${Math.max(barHeight, 5)}%` }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* X-axis labels */}
                          <div className="flex ml-8">
                            {priceForecast.forecast.map((item, idx) => (
                              <div key={idx} className="flex-1 text-center">
                                <span className="text-[10px] text-gray-500">{item.month}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-green-500 rounded"></span> Peak Season
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-blue-400 rounded"></span> Regular
                            </span>
                            <span className="text-gray-400 text-[10px]">
                              (Range: ₹{range.toFixed(1)})
                            </span>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="h-28 flex items-center justify-center text-gray-400 text-sm">
                      Loading price data...
                    </div>
                  )}
                </div>

                {/* Confidence Meter */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Prediction Confidence</span>
                    <span className="text-sm font-bold text-green-600">{yieldPrediction.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                      style={{ width: `${yieldPrediction.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Yield Tab */}
            {activeTab === 'yield' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-green-600">
                    {(yieldPrediction.predictedYieldKg / 1000).toFixed(2)}
                  </p>
                  <p className="text-gray-500">tonnes expected</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Range: {(yieldPrediction.rangeMin / 1000).toFixed(2)} - {(yieldPrediction.rangeMax / 1000).toFixed(2)} tonnes
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Droplets className="w-4 h-4" />
                      <span className="text-xs">Soil Health</span>
                    </div>
                    <p className="font-semibold capitalize">{yieldPrediction.factors.soilHealth}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <ThermometerSun className="w-4 h-4" />
                      <span className="text-xs">Weather</span>
                    </div>
                    <p className="font-semibold capitalize">{yieldPrediction.factors.weatherCondition}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Bug className="w-4 h-4" />
                      <span className="text-xs">Pest Pressure</span>
                    </div>
                    <p className="font-semibold capitalize">{yieldPrediction.factors.pestPressure}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Yield/Acre</span>
                    </div>
                    <p className="font-semibold">{yieldPrediction.yieldPerAcre} kg</p>
                  </div>
                </div>

                {/* Yield Improvement Recommendations */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-800">How to Improve Your Yield</h3>
                  </div>
                  <div className="space-y-3">
                    {getYieldRecommendations(yieldPrediction.factors, yieldPrediction.comparedToAverage).map((rec, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{rec.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-800">{rec.title}</h4>
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                {rec.impact}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Price Tab */}
            {activeTab === 'price' && (
              <div className="space-y-4">
                {priceForecast && priceForecast.forecast ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Current Price</p>
                        <p className="text-3xl font-bold text-gray-800">
                          ₹{priceForecast.currentPrice}<span className="text-sm font-normal">/kg</span>
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        priceForecast.trend === 'rising' ? 'bg-green-100 text-green-700' :
                        priceForecast.trend === 'falling' ? 'bg-red-100 text-red-700' :
                        priceForecast.trend === 'volatile' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getTrendIcon(priceForecast.trend)} {priceForecast.trend}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">6-Month Forecast</p>
                      {priceForecast.forecast.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{item.month} {item.year}</span>
                            {item.isPeakSeason && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                🌟 Peak
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{item.predictedPrice?.toFixed(2) || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{item.confidence}% confidence</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm text-green-800">
                        💡 <strong>Recommendation:</strong> Best time to sell is <strong>{priceForecast.bestSellingPeriod}</strong> with expected peak price of <strong>₹{priceForecast.expectedPeakPrice}</strong>/kg
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Price forecast data not available</p>
                    <button 
                      onClick={loadAnalytics}
                      className="mt-2 text-green-600 underline"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Risk Tab */}
            {activeTab === 'risk' && (
              <div className="space-y-4">
                {/* Overall Risk Score */}
                <div className="text-center py-3">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                    riskAssessment.overallRiskLevel === 'high' ? 'bg-red-100' :
                    riskAssessment.overallRiskLevel === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <span className={`text-2xl font-bold ${
                      riskAssessment.overallRiskLevel === 'high' ? 'text-red-600' :
                      riskAssessment.overallRiskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {riskAssessment.overallScore}%
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">Overall Risk Score</p>
                </div>

                {/* Individual Risks */}
                <div className="space-y-2">
                  {riskAssessment.risks.map((risk, idx) => (
                    <div 
                      key={idx}
                      className={`rounded-lg border ${getRiskColor(risk.severity)} overflow-hidden`}
                    >
                      <button
                        onClick={() => setExpandedRisk(expandedRisk === risk.type ? null : risk.type)}
                        className="w-full p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{risk.icon}</span>
                          <div className="text-left">
                            <p className="font-medium">{risk.title}</p>
                            <p className="text-xs opacity-75">{risk.probability}% probability</p>
                          </div>
                        </div>
                        {expandedRisk === risk.type ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      
                      {expandedRisk === risk.type && (
                        <div className="px-3 pb-3 border-t border-current/10">
                          <p className="text-sm my-2">{risk.description}</p>
                          <p className="text-xs font-medium mb-1">Recommendations:</p>
                          <ul className="text-xs space-y-1">
                            {risk.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <p className="text-xs text-gray-400 text-center">
          Last updated: {new Date(analytics.generatedAt).toLocaleString()}
        </p>
      </div>
    </PageContainer>
  );
};

export default AnalyticsPage;
