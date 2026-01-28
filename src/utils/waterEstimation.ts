// Water Requirement Estimation Utility
// Calculates irrigation needs based on land area, crop type, and weather conditions

import type { WaterRequirementEstimate } from '../types/boundary';

// Crop water requirements in mm/day (average growing season)
// Based on FAO crop coefficient (Kc) and reference evapotranspiration
const CROP_WATER_REQUIREMENTS: Record<string, { minMmPerDay: number; maxMmPerDay: number }> = {
  // Cereals
  rice: { minMmPerDay: 5, maxMmPerDay: 8 },
  wheat: { minMmPerDay: 3, maxMmPerDay: 5 },
  maize: { minMmPerDay: 4, maxMmPerDay: 6 },
  corn: { minMmPerDay: 4, maxMmPerDay: 6 },
  millet: { minMmPerDay: 2, maxMmPerDay: 4 },
  sorghum: { minMmPerDay: 3, maxMmPerDay: 5 },
  
  // Pulses
  groundnut: { minMmPerDay: 3, maxMmPerDay: 5 },
  peanut: { minMmPerDay: 3, maxMmPerDay: 5 },
  chickpea: { minMmPerDay: 2, maxMmPerDay: 4 },
  lentil: { minMmPerDay: 2, maxMmPerDay: 4 },
  soybean: { minMmPerDay: 3, maxMmPerDay: 5 },
  
  // Vegetables
  tomato: { minMmPerDay: 4, maxMmPerDay: 6 },
  onion: { minMmPerDay: 3, maxMmPerDay: 5 },
  potato: { minMmPerDay: 4, maxMmPerDay: 6 },
  brinjal: { minMmPerDay: 3, maxMmPerDay: 5 },
  cabbage: { minMmPerDay: 3, maxMmPerDay: 5 },
  cauliflower: { minMmPerDay: 3, maxMmPerDay: 5 },
  carrot: { minMmPerDay: 3, maxMmPerDay: 5 },
  
  // Fruits
  banana: { minMmPerDay: 4, maxMmPerDay: 7 },
  mango: { minMmPerDay: 3, maxMmPerDay: 5 },
  coconut: { minMmPerDay: 3, maxMmPerDay: 5 },
  papaya: { minMmPerDay: 4, maxMmPerDay: 6 },
  grapes: { minMmPerDay: 4, maxMmPerDay: 6 },
  pomegranate: { minMmPerDay: 3, maxMmPerDay: 5 },
  
  // Cash crops
  sugarcane: { minMmPerDay: 5, maxMmPerDay: 8 },
  cotton: { minMmPerDay: 4, maxMmPerDay: 6 },
  tobacco: { minMmPerDay: 3, maxMmPerDay: 5 },
  jute: { minMmPerDay: 4, maxMmPerDay: 6 },
  tea: { minMmPerDay: 3, maxMmPerDay: 5 },
  coffee: { minMmPerDay: 3, maxMmPerDay: 5 },
  
  // Spices
  turmeric: { minMmPerDay: 3, maxMmPerDay: 5 },
  ginger: { minMmPerDay: 3, maxMmPerDay: 5 },
  chilli: { minMmPerDay: 3, maxMmPerDay: 5 },
  cardamom: { minMmPerDay: 3, maxMmPerDay: 5 },
  
  // Default for unknown crops
  default: { minMmPerDay: 3, maxMmPerDay: 5 },
};

// Soil type water retention factors
// Higher values mean soil retains water better (needs less frequent irrigation)
const SOIL_RETENTION_FACTORS: Record<string, number> = {
  'clay': 1.2,
  'clay soil': 1.2,
  'black soil': 1.15,
  'black cotton soil': 1.15,
  'loamy': 1.0,
  'loamy soil': 1.0,
  'alluvial': 1.0,
  'alluvial soil': 1.0,
  'red soil': 0.9,
  'red': 0.9,
  'laterite': 0.85,
  'laterite soil': 0.85,
  'sandy': 0.75,
  'sandy soil': 0.75,
  'sandy loam': 0.85,
  'default': 1.0,
};

// Weather condition factors (multipliers)
const WEATHER_FACTORS: Record<string, number> = {
  'hot': 1.3,
  'sunny': 1.2,
  'clear': 1.1,
  'partly cloudy': 1.0,
  'cloudy': 0.9,
  'overcast': 0.85,
  'rainy': 0.5,
  'light rain': 0.6,
  'heavy rain': 0.3,
  'humid': 0.9,
  'dry': 1.25,
  'default': 1.0,
};

/**
 * Find the best matching crop water requirement
 */
function getCropWaterRequirement(cropName: string): { minMmPerDay: number; maxMmPerDay: number } {
  const normalizedCrop = cropName.toLowerCase().trim();
  
  // Direct match
  if (CROP_WATER_REQUIREMENTS[normalizedCrop]) {
    return CROP_WATER_REQUIREMENTS[normalizedCrop];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(CROP_WATER_REQUIREMENTS)) {
    if (normalizedCrop.includes(key) || key.includes(normalizedCrop)) {
      return value;
    }
  }
  
  return CROP_WATER_REQUIREMENTS.default;
}

/**
 * Get soil retention factor
 */
function getSoilFactor(soilType: string): number {
  const normalizedSoil = soilType.toLowerCase().trim();
  
  if (SOIL_RETENTION_FACTORS[normalizedSoil]) {
    return SOIL_RETENTION_FACTORS[normalizedSoil];
  }
  
  for (const [key, value] of Object.entries(SOIL_RETENTION_FACTORS)) {
    if (normalizedSoil.includes(key) || key.includes(normalizedSoil)) {
      return value;
    }
  }
  
  return SOIL_RETENTION_FACTORS.default;
}

/**
 * Get weather adjustment factor
 */
function getWeatherFactor(weatherCondition: string): number {
  const normalizedWeather = weatherCondition.toLowerCase().trim();
  
  if (WEATHER_FACTORS[normalizedWeather]) {
    return WEATHER_FACTORS[normalizedWeather];
  }
  
  for (const [key, value] of Object.entries(WEATHER_FACTORS)) {
    if (normalizedWeather.includes(key) || key.includes(normalizedWeather)) {
      return value;
    }
  }
  
  return WEATHER_FACTORS.default;
}

export interface WaterEstimationInput {
  landAreaSqMeters: number;
  cropType: string;
  soilType: string;
  weatherCondition?: string;
  temperature?: number; // in Celsius
}

/**
 * Estimate water requirement for a farm
 * 
 * @param input - Farm parameters for estimation
 * @returns Water requirement estimate
 */
export function estimateWaterRequirement(input: WaterEstimationInput): WaterRequirementEstimate {
  const {
    landAreaSqMeters,
    cropType,
    soilType,
    weatherCondition = 'default',
    temperature,
  } = input;

  // Get base water requirement for the crop
  const cropReq = getCropWaterRequirement(cropType);
  const soilFactor = getSoilFactor(soilType);
  const weatherFactor = getWeatherFactor(weatherCondition);
  
  // Temperature adjustment (if provided)
  let tempFactor = 1.0;
  if (temperature !== undefined) {
    if (temperature > 35) tempFactor = 1.3;
    else if (temperature > 30) tempFactor = 1.15;
    else if (temperature > 25) tempFactor = 1.0;
    else if (temperature > 20) tempFactor = 0.9;
    else tempFactor = 0.8;
  }

  // Calculate average water requirement in mm/day
  const avgMmPerDay = ((cropReq.minMmPerDay + cropReq.maxMmPerDay) / 2) 
    * weatherFactor 
    * tempFactor 
    / soilFactor;

  // Convert mm/day to liters/day
  // 1 mm over 1 sq meter = 1 liter
  const dailyLiters = avgMmPerDay * landAreaSqMeters;
  const weeklyLiters = dailyLiters * 7;
  const monthlyLiters = dailyLiters * 30;

  return {
    dailyLiters: Math.round(dailyLiters),
    weeklyLiters: Math.round(weeklyLiters),
    monthlyLiters: Math.round(monthlyLiters),
    source: 'Estimated based on crop type, soil, and weather conditions',
    factors: {
      cropType,
      landArea: landAreaSqMeters,
      weatherCondition,
      soilType,
    },
  };
}

/**
 * Format water volume for display
 */
export function formatWaterVolume(liters: number): string {
  if (liters >= 1000000) {
    return `${(liters / 1000000).toFixed(2)} million liters`;
  } else if (liters >= 1000) {
    return `${(liters / 1000).toFixed(1)}k liters`;
  }
  return `${liters.toFixed(0)} liters`;
}

/**
 * Get rainfall impact assessment
 */
export function assessRainfallImpact(
  expectedRainfallMm: number,
  landAreaSqMeters: number,
  estimatedDailyNeed: number
): {
  rainfallProvides: number;
  deficit: number;
  surplus: number;
  status: 'deficit' | 'adequate' | 'surplus';
  recommendation: string;
} {
  // Convert rainfall mm to liters over the land area
  const rainfallLiters = expectedRainfallMm * landAreaSqMeters;
  
  const deficit = Math.max(0, estimatedDailyNeed - rainfallLiters);
  const surplus = Math.max(0, rainfallLiters - estimatedDailyNeed);
  
  let status: 'deficit' | 'adequate' | 'surplus';
  let recommendation: string;
  
  if (deficit > estimatedDailyNeed * 0.2) {
    status = 'deficit';
    recommendation = `Irrigation needed. Supplement with approximately ${formatWaterVolume(deficit)} per day.`;
  } else if (surplus > estimatedDailyNeed * 0.5) {
    status = 'surplus';
    recommendation = 'Good rainfall expected. Reduce irrigation and ensure proper drainage to prevent waterlogging.';
  } else {
    status = 'adequate';
    recommendation = 'Rainfall should meet most water needs. Monitor soil moisture and irrigate only if needed.';
  }
  
  return {
    rainfallProvides: Math.round(rainfallLiters),
    deficit: Math.round(deficit),
    surplus: Math.round(surplus),
    status,
    recommendation,
  };
}
