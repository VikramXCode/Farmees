import api from './api';

export interface CropRecommendationRequestPayload {
  state: string;
  district: string;
  land_area_hectare: number;
  budget_inr: number;
  planning_months: number;
  date: string;
  soil_type?: string | null;
  ph?: number | null;
  temperature?: number | null;
  soil_report_uploaded?: boolean;
}

export interface CropBudgetSummary {
  status: 'fits' | 'ask_increase' | 'reduce_area';
  planned_area_hectare: number;
  cost_per_hectare: number;
  estimated_cost: number;
  budget_remaining?: number | null;
  required_extra_budget?: number | null;
  fertilizer_cost?: number;
  seed_cost?: number;
  labor_cost?: number;
  other_costs?: number;
}

export interface CropFinancials {
  total_investment: number;
  expected_yield_tons: number;
  market_price_per_ton: number;
  gross_revenue: number;
  net_profit: number;
  roi_percentage: number;
}

export interface CropRecommendationResponse {
  recommended_crop: string;
  planned_area_hectare: number;
  expected_yield_ton_per_hectare: number;
  total_production_tons: number;
  budget_summary: CropBudgetSummary;
  financials?: CropFinancials;
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
  season: string;
  alternative_crops?: string[] | null;
  disclaimer: string;
  ai_insights?: string;
}

export async function getCropRecommendation(payload: CropRecommendationRequestPayload): Promise<CropRecommendationResponse> {
  return api.post('/crop-recommendation', payload);
}

export default {
  getCropRecommendation
};
