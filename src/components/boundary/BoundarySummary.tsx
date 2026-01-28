// Boundary Summary Card Component
// Displays farm boundary info, area, and water estimation

import React, { useMemo } from 'react';
import { 
  Map, 
  Ruler, 
  Droplets, 
  CloudRain, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import type { FarmBoundaryData, LandSize } from '../../types/land';
import { formatArea } from '../../utils/geoCalculations';
import { 
  estimateWaterRequirement, 
  formatWaterVolume,
  assessRainfallImpact 
} from '../../utils/waterEstimation';

interface BoundarySummaryProps {
  boundary?: FarmBoundaryData;
  landSize?: LandSize;
  cropType: string;
  soilType: string;
  weatherCondition?: string;
  expectedRainfallMm?: number;
  temperature?: number;
  language?: 'english' | 'tamil';
  compact?: boolean;
}

const translations = {
  english: {
    boundaryMapped: 'Farm Boundary Mapped',
    landArea: 'Land Area',
    perimeter: 'Perimeter',
    waterNeeds: 'Water Requirements',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    rainfallImpact: 'Rainfall Impact',
    mappedVia: 'Mapped via',
    walkMode: 'GPS Walk',
    drawMode: 'Manual Draw',
    approximate: 'Approximate values for advisory purposes',
    notMapped: 'Boundary not mapped',
    mapNow: 'Map your farm to get accurate area & water estimates',
  },
  tamil: {
    boundaryMapped: 'பண்ணை எல்லை வரைபடம்',
    landArea: 'நில பரப்பளவு',
    perimeter: 'சுற்றளவு',
    waterNeeds: 'நீர் தேவைகள்',
    daily: 'தினசரி',
    weekly: 'வாராந்திர',
    monthly: 'மாதாந்திர',
    rainfallImpact: 'மழை தாக்கம்',
    mappedVia: 'வழியாக வரையப்பட்டது',
    walkMode: 'GPS நடை',
    drawMode: 'கைமுறை வரைதல்',
    approximate: 'ஆலோசனை நோக்கங்களுக்கான தோராயமான மதிப்புகள்',
    notMapped: 'எல்லை வரையப்படவில்லை',
    mapNow: 'துல்லியமான பரப்பளவு மற்றும் நீர் மதிப்பீடுகளைப் பெற உங்கள் பண்ணையை வரையுங்கள்',
  },
};

export default function BoundarySummary({
  boundary,
  landSize,
  cropType,
  soilType,
  weatherCondition = 'default',
  expectedRainfallMm,
  temperature,
  language = 'english',
  compact = false,
}: BoundarySummaryProps) {
  const t = translations[language];

  // Get land area in square meters
  const areaSqMeters = useMemo(() => {
    if (boundary?.area?.sqMeters) {
      return boundary.area.sqMeters;
    }
    if (landSize?.value) {
      switch (landSize.unit) {
        case 'acres':
          return landSize.value * 4046.86;
        case 'hectares':
          return landSize.value * 10000;
        case 'sqMeters':
        default:
          return landSize.value;
      }
    }
    return 0;
  }, [boundary, landSize]);

  // Calculate water requirements
  const waterEstimate = useMemo(() => {
    if (areaSqMeters <= 0 || !cropType) return null;
    
    return estimateWaterRequirement({
      landAreaSqMeters: areaSqMeters,
      cropType,
      soilType,
      weatherCondition,
      temperature,
    });
  }, [areaSqMeters, cropType, soilType, weatherCondition, temperature]);

  // Calculate rainfall impact
  const rainfallImpact = useMemo(() => {
    if (!waterEstimate || !expectedRainfallMm) return null;
    
    return assessRainfallImpact(
      expectedRainfallMm,
      areaSqMeters,
      waterEstimate.dailyLiters
    );
  }, [waterEstimate, expectedRainfallMm, areaSqMeters]);

  if (!boundary && !landSize) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <Map className="w-5 h-5" />
          <div>
            <p className="font-medium">{t.notMapped}</p>
            <p className="text-xs">{t.mapNow}</p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        {areaSqMeters > 0 && (
          <div className="flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-green-600" />
            <span className="font-medium">{formatArea(areaSqMeters)}</span>
          </div>
        )}
        {waterEstimate && (
          <div className="flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{formatWaterVolume(waterEstimate.dailyLiters)}/day</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-white/50 border-b border-green-100">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-800">{t.boundaryMapped}</h3>
        </div>
        {boundary && (
          <p className="text-xs text-green-600 mt-1">
            {t.mappedVia}: {boundary.mappingMode === 'walk' ? t.walkMode : t.drawMode}
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Area and Perimeter */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Ruler className="w-4 h-4" />
              <span className="text-xs">{t.landArea}</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {formatArea(areaSqMeters)}
            </div>
          </div>

          {boundary?.perimeter && (
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Map className="w-4 h-4" />
                <span className="text-xs">{t.perimeter}</span>
              </div>
              <div className="text-xl font-bold text-gray-800">
                {(boundary.perimeter / 1000).toFixed(2)} km
              </div>
            </div>
          )}
        </div>

        {/* Water Requirements */}
        {waterEstimate && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Droplets className="w-4 h-4" />
              <span className="text-sm font-medium">{t.waterNeeds}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-gray-500">{t.daily}</div>
                <div className="font-bold text-blue-700">
                  {formatWaterVolume(waterEstimate.dailyLiters)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{t.weekly}</div>
                <div className="font-bold text-blue-700">
                  {formatWaterVolume(waterEstimate.weeklyLiters)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{t.monthly}</div>
                <div className="font-bold text-blue-700">
                  {formatWaterVolume(waterEstimate.monthlyLiters)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rainfall Impact */}
        {rainfallImpact && (
          <div className={`rounded-lg p-3 ${
            rainfallImpact.status === 'deficit' ? 'bg-yellow-50 border border-yellow-200' :
            rainfallImpact.status === 'surplus' ? 'bg-blue-50 border border-blue-200' :
            'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <CloudRain className={`w-4 h-4 ${
                rainfallImpact.status === 'deficit' ? 'text-yellow-600' :
                rainfallImpact.status === 'surplus' ? 'text-blue-600' :
                'text-green-600'
              }`} />
              <span className="text-sm font-medium">{t.rainfallImpact}</span>
            </div>
            
            <div className="flex items-start gap-2">
              {rainfallImpact.status === 'deficit' && (
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              {rainfallImpact.status === 'adequate' && (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              {rainfallImpact.status === 'surplus' && (
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-gray-700">{rainfallImpact.recommendation}</p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center">
          {t.approximate}
        </p>
      </div>
    </div>
  );
}
