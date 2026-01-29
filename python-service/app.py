"""Crop Recommendation Microservice - FastAPI"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd
from datetime import datetime
from functools import lru_cache

from recommender.season import get_season_from_date
from recommender.soil_filter import filter_soil_crops
from recommender.ranking import rank_crops
from recommender.yield_estimation import estimate_yield
from recommender.budget import plan_with_budget

app = FastAPI(title="Crop Recommendation Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your Express backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class CropRecommendationRequest(BaseModel):
    """Input schema for crop recommendation"""
    state: str = Field(..., description="State name (e.g., 'Tamil Nadu')")
    district: str = Field(..., description="District name (e.g., 'Coimbatore')")
    land_area_hectare: float = Field(..., gt=0, description="Land area in hectares")
    budget_inr: float = Field(..., gt=0, description="Available budget in INR")
    planning_months: int = Field(..., gt=0, le=12, description="Planning horizon in months")
    date: str = Field(..., description="Planting date in YYYY-MM-DD format")
    soil_type: Optional[str] = Field(None, description="Soil type (e.g., 'Loamy', 'Clay')")
    ph: Optional[float] = Field(None, ge=0, le=14, description="Soil pH value")
    temperature: Optional[float] = Field(None, description="Average temperature in Celsius")
    soil_report_uploaded: bool = Field(False, description="Whether soil report was uploaded")


class BudgetResult(BaseModel):
    """Budget planning result"""
    status: str = Field(..., description="'fits', 'ask_increase', or 'reduce_area'")
    planned_area_hectare: float
    cost_per_hectare: float
    estimated_cost: float
    budget_remaining: Optional[float] = None
    required_extra_budget: Optional[float] = None


class CropRecommendationResponse(BaseModel):
    """Output schema for crop recommendation"""
    recommended_crop: str
    planned_area_hectare: float
    expected_yield_ton_per_hectare: float
    total_production_tons: float
    budget_summary: BudgetResult
    confidence: str = Field(..., description="'High', 'Medium', or 'Low'")
    explanation: str
    season: str
    alternative_crops: Optional[List[str]] = None
    disclaimer: str = "Results depend on weather conditions and farm practices. This is an estimation based on historical data."


SOIL_CROP_REQUIREMENTS_PATH = "data/soil_crop_requirements.csv"
CROP_HISTORY_PATH = "data/final_crop_historical_dataset.csv"


@lru_cache(maxsize=1)
def load_soil_crop_data() -> pd.DataFrame:
    """Load soil-crop compatibility data from CSV - Cached for performance"""
    csv_path = SOIL_CROP_REQUIREMENTS_PATH
    try:
        df = pd.read_csv(csv_path)
        df.columns = df.columns.str.strip()
        return df
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail=f"Soil crop requirements file not found: {csv_path}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading soil crop data: {str(e)}"
        )


@lru_cache(maxsize=1)
def load_crop_history_data() -> pd.DataFrame:
    """Load historical crop yield data from CSV - Cached for performance"""
    csv_path = CROP_HISTORY_PATH
    try:
        df = pd.read_csv(csv_path)
        # Clean column names to match expected format
        df.columns = df.columns.str.strip().str.lower()
        return df
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail=f"Historical crop dataset not found: {csv_path}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading crop history data: {str(e)}"
        )


def load_cost_data() -> dict:
    """
    Load crop cultivation cost data (per hectare in INR)
    Based on Indian agricultural cost estimates
    """
    return {
        "Rice": 40000,
        "Wheat": 35000,
        "Maize": 30000,
        "Cotton": 50000,
        "Sugarcane": 80000,
        "Jowar": 25000,
        "Bajra": 22000,
        "Ragi": 28000,
        "Groundnut": 45000,
        "Sunflower": 38000,
        "Soyabean": 32000,
        "Sesamum": 30000,
        "Gram": 28000,
        "Tur": 35000,
        "Urad": 33000,
        "Moong": 31000,
        "Masoor": 29000,
        "Black pepper": 120000,
        "Dry chillies": 55000,
        "Turmeric": 65000,
        "Coriander": 40000,
        "Potato": 70000,
        "Onion": 60000,
        "Tomato": 75000,
        "Cabbage": 50000,
        "Cauliflower": 52000,
        "Brinjal": 48000,
        "Banana": 90000,
        "Mango": 85000,
        "Coconut": 55000,
        "Arecanut": 95000,
        "Cashewnut": 100000,
        "Tea": 110000,
        "Coffee": 105000,
        "Rubber": 95000,
        "Jute": 35000,
        "Mesta": 32000,
        "Tobacco": 65000,
        "Ginger": 80000,
        "Garlic": 70000,
        "Cardamom": 150000,
        "Safflower": 36000,
        "Niger seed": 27000,
        "Castor seed": 34000,
        "Linseed": 30000,
        "Rapeseed & Mustard": 31000,
        "Small millets": 20000,
        "Barley": 32000,
        "Peas & beans": 35000,
        "Khesari": 26000,
        "Cowpea": 28000,
        "Horse-gram": 24000,
        "Sweet potato": 45000,
        "Tapioca": 40000,
        "Oilseeds total": 35000,
        "Pulses total": 30000
    }


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Crop Recommendation Microservice",
        "status": "active",
        "version": "1.0.0"
    }


@app.post("/crop-recommendation", response_model=CropRecommendationResponse)
async def recommend_crop(request: CropRecommendationRequest):
    """
    Main crop recommendation endpoint
    
    Uses EXACT provided Python logic - DO NOT MODIFY FORMULAS
    """
    try:
        # Step 1: Determine season from date
        season = get_season_from_date(request.date)
        
        # Step 2: Load data
        soil_df = load_soil_crop_data()
        crop_hist = load_crop_history_data()
        cost_table = load_cost_data()
        
        # Normalize state and district for case-insensitive matching
        request_state = request.state.strip()
        request_district = request.district.strip()
        
        # Step 3: Filter crops based on soil conditions
        if request.soil_type and request.ph and request.temperature:
            farmer_params = {
                "soil_type": request.soil_type,
                "ph": request.ph,
                "temp": request.temperature,
                "season": season,
                "future_months": request.planning_months
            }
            suitable_crops = filter_soil_crops(soil_df, farmer_params)
        else:
            # If soil data not provided, use all crops for the region
            suitable_crops = soil_df["crop"].unique().tolist()
        
        if not suitable_crops:
            raise HTTPException(
                status_code=400,
                detail="No suitable crops found for the given conditions"
            )
        
        # Step 4: Rank crops by historical performance (case-insensitive matching)
        region_crops = crop_hist[
            (crop_hist["state"].str.lower() == request_state.lower()) &
            (crop_hist["district"].str.lower() == request_district.lower()) &
            (crop_hist["crop"].isin(suitable_crops))
        ].copy()
        
        if region_crops.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No historical data found for {request_district}, {request_state}"
            )
        
        ranked = rank_crops(region_crops)
        
        # Step 5: Get top recommended crop
        top_crop = ranked.iloc[0]["crop"]
        alternative_crops = ranked.iloc[1:4]["crop"].tolist() if len(ranked) > 1 else []
        
        # Step 6: Estimate yield for recommended crop (use original case-insensitive filter)
        yield_crop_hist = crop_hist[
            (crop_hist["state"].str.lower() == request_state.lower()) &
            (crop_hist["district"].str.lower() == request_district.lower()) &
            (crop_hist["crop"] == top_crop)
        ].copy()
        
        if yield_crop_hist.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No yield data found for {top_crop} in {request_district}, {request_state}"
            )
        
        # Calculate yield estimate
        last_10_years = yield_crop_hist.sort_values("year").tail(10)
        yield_est = {
            "expected_yield_ton_per_hectare": round(last_10_years["yield_ton_per_hectare"].mean(), 2),
            "min_yield": round(last_10_years["yield_ton_per_hectare"].min(), 2),
            "max_yield": round(last_10_years["yield_ton_per_hectare"].max(), 2),
            "years_used": len(last_10_years)
        }
        
        # Step 7: Plan with budget constraints
        budget_result = plan_with_budget(
            top_crop,
            request.land_area_hectare,
            request.budget_inr,
            cost_table,
            tolerance=1000
        )
        
        if budget_result is None:
            raise HTTPException(
                status_code=400,
                detail=f"Cost data not available for {top_crop}"
            )
        
        # Step 8: Calculate total production
        planned_area = budget_result["planned_area_hectare"]
        total_production = round(
            planned_area * yield_est["expected_yield_ton_per_hectare"],
            2
        )
        
        # Step 9: Determine confidence level
        confidence = "High" if yield_est["years_used"] >= 5 else \
                     "Medium" if yield_est["years_used"] >= 3 else "Low"
        
        # Step 10: Generate explanation
        explanation = f"{top_crop} is recommended based on {yield_est['years_used']} years of data "
        explanation += f"showing average yield of {yield_est['expected_yield_ton_per_hectare']} tons/hectare. "
        
        if budget_result["status"] == "fits":
            explanation += f"Your budget covers the full {planned_area} hectare area."
        elif budget_result["status"] == "ask_increase":
            explanation += f"Consider increasing budget by ₹{budget_result['required_extra_budget']} to cover full area."
        else:
            explanation += f"Budget allows cultivation of {planned_area} hectares (reduced from {request.land_area_hectare})."
        
        return CropRecommendationResponse(
            recommended_crop=top_crop,
            planned_area_hectare=planned_area,
            expected_yield_ton_per_hectare=yield_est["expected_yield_ton_per_hectare"],
            total_production_tons=total_production,
            budget_summary=BudgetResult(**budget_result),
            confidence=confidence,
            explanation=explanation,
            season=season,
            alternative_crops=alternative_crops if alternative_crops else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
