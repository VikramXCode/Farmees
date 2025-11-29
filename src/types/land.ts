// Land-specific data types for MongoDB integration

export interface LandData {
  _id?: string;
  landId: string;
  userId: string;
  
  // Basic Land Information
  name: string;
  location: string;
  soilType: string;
  currentCrop: string;
  waterAvailability: 'high' | 'medium' | 'low';
  
  // Soil Analysis Data
  soilReport?: {
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    organicMatter: number;
    moisture: number;
    texture: string;
    analysisDate: string;
    reportUrl?: string;
  };
  
  // Weather Data
  weatherHistory: {
    date: string;
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    conditions: string;
  }[];
  
  // Crop Management Data
  cropHistory: {
    cropName: string;
    plantingDate: string;
    harvestDate?: string;
    yield?: number;
    notes: string;
  }[];
  
  // Pest & Disease Records
  pestDiseaseHistory: {
    date: string;
    type: 'pest' | 'disease';
    name: string;
    severity: 'low' | 'medium' | 'high';
    treatment: string;
    status: 'active' | 'resolved' | 'prevented';
    images?: string[];
  }[];
  
  // Fertilizer & Treatment Records
  treatmentHistory: {
    date: string;
    type: 'fertilizer' | 'pesticide' | 'herbicide' | 'irrigation';
    product: string;
    quantity: number;
    unit: string;
    notes: string;
  }[];
  
  // Market Data
  marketData: {
    cropName: string;
    currentPrice: number;
    priceHistory: {
      date: string;
      price: number;
      market: string;
    }[];
    demand: 'low' | 'medium' | 'high';
    forecast: {
      nextMonth: number;
      nextQuarter: number;
    };
  }[];
  
  // AI Assistant Context
  aiContext: {
    lastInteraction: string;
    commonQuestions: string[];
    recommendedActions: {
      action: string;
      priority: 'low' | 'medium' | 'high';
      dueDate: string;
      status: 'pending' | 'completed' | 'overdue';
    }[];
    preferences: {
      communicationStyle: 'technical' | 'simple' | 'detailed';
      focusAreas: string[];
      alertLevel: 'low' | 'medium' | 'high';
    };
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AIInteraction {
  _id?: string;
  landId: string;
  userId: string;
  timestamp: string;
  userMessage: string;
  aiResponse: string;
  context: {
    selectedLand?: string;
    weatherData?: any;
    marketData?: any;
    recentActivities?: string[];
  };
  feedback?: {
    helpful: boolean;
    rating: number;
    comments?: string;
  };
}

export interface LandRecommendation {
  _id?: string;
  landId: string;
  userId: string;
  type: 'crop' | 'fertilizer' | 'treatment' | 'irrigation' | 'harvest';
  recommendation: string;
  confidence: number;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}
