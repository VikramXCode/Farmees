import api from './api';

// Types for analytics data
export interface YieldPrediction {
  crop: string;
  areaAcres: number;
  predictedYieldKg: number;
  yieldPerAcre: number;
  rangeMin: number;
  rangeMax: number;
  confidence: number;
  factors: {
    soilHealth: string;
    weatherCondition: string;
    pestPressure: string;
    weatherRisk: string;
  };
  comparedToAverage: number;
  unit: string;
}

export interface PriceForecastItem {
  month: string;
  year: number;
  predictedPrice: number;
  confidence: number;
  isPeakSeason: boolean;
  recommendation: string;
}

export interface PriceForecast {
  crop: string;
  currentPrice: number;
  trend: 'rising' | 'falling' | 'stable' | 'volatile';
  priceUnit: string;
  forecast: PriceForecastItem[];
  bestSellingPeriod: string;
  expectedPeakPrice: number;
  seasonalPeakMonths: string[];
}

export interface Risk {
  type: string;
  title: string;
  description: string;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  recommendations: string[];
  affectedPests?: string[];
}

export interface RiskAssessment {
  risks: Risk[];
  overallRiskLevel: 'low' | 'medium' | 'high';
  overallScore: number;
  assessmentDate: string;
  location: string;
}

export interface Insight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionType: 'immediate' | 'planned' | 'monitor';
}

export interface PotentialRevenue {
  minimum: number;
  expected: number;
  maximum: number;
  currency: string;
}

export interface AnalyticsData {
  crops: string[];
  yieldPrediction: YieldPrediction;
  priceForecast: PriceForecast;
  riskAssessment: RiskAssessment;
  potentialRevenue: PotentialRevenue;
  insights: Insight[];
  generatedAt: string;
}

export interface CropInfo {
  name: string;
  key: string;
  avgYield: number;
  priceInfo: {
    current: number;
    min: number;
    max: number;
    trend: string;
    seasonalPeak: string[];
  };
}

// Fetch comprehensive analytics
export async function getAnalytics(params?: {
  crops?: string[];
  area?: number;
  soilHealth?: string;
  location?: string;
}): Promise<AnalyticsData> {
  const query = new URLSearchParams();
  if (params?.crops) query.append('crops', params.crops.join(','));
  if (params?.area) query.append('area', params.area.toString());
  if (params?.soilHealth) query.append('soilHealth', params.soilHealth);
  if (params?.location) query.append('location', params.location);

  const queryString = query.toString();
  const url = queryString ? `/analytics?${queryString}` : '/analytics';
  
  return api.get<AnalyticsData>(url);
}

// Fetch yield prediction only
export async function getYieldPrediction(params: {
  crop: string;
  area: number;
  soilHealth?: string;
  weather?: string;
  pestPressure?: string;
}): Promise<YieldPrediction> {
  const query = new URLSearchParams({
    crop: params.crop,
    area: params.area.toString(),
    soilHealth: params.soilHealth || 'good',
    weather: params.weather || 'normal',
    pestPressure: params.pestPressure || 'low'
  });

  return api.get<YieldPrediction>(`/analytics/yield?${query.toString()}`);
}

// Fetch price forecast only
export async function getPriceForecast(crop: string, months: number = 6): Promise<PriceForecast> {
  return api.get<PriceForecast>(`/analytics/price?crop=${encodeURIComponent(crop)}&months=${months}`);
}

// Fetch risk assessment only
export async function getRiskAssessment(params: {
  crops: string[];
  location?: string;
}): Promise<RiskAssessment> {
  const query = new URLSearchParams({
    crops: params.crops.join(','),
    location: params.location || 'Tamil Nadu'
  });

  return api.get<RiskAssessment>(`/analytics/risk?${query.toString()}`);
}

// Fetch supported crops list
export async function getSupportedCrops(): Promise<CropInfo[]> {
  return api.get<CropInfo[]>('/analytics/crops');
}

// Format currency for display
export function formatCurrency(amount: number, currency: string = '₹'): string {
  if (amount >= 100000) {
    return `${currency}${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `${currency}${(amount / 1000).toFixed(1)}K`;
  }
  return `${currency}${amount.toFixed(0)}`;
}

// Get trend icon
export function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'rising': return '📈';
    case 'falling': return '📉';
    case 'volatile': return '📊';
    default: return '➡️';
  }
}

// Get risk color
export function getRiskColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

// Get priority color
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'text-red-700 bg-red-100 border-red-300';
    case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    case 'low': return 'text-green-700 bg-green-100 border-green-300';
    default: return 'text-gray-700 bg-gray-100 border-gray-300';
  }
}
