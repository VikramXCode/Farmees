"""Yield estimation logic - DO NOT MODIFY"""

def estimate_yield(crop_hist, state, district, crop):
    """
    Estimates expected yield based on last 10 years of historical data
    
    Args:
        crop_hist: DataFrame with columns: state, district, crop, year, 
                   yield_ton_per_hectare
        state: State name
        district: District name
        crop: Crop name
    
    Returns:
        Dict with expected_yield_ton_per_hectare, min_yield, max_yield, years_used
    """
    df = crop_hist[
        (crop_hist["state"] == state) &
        (crop_hist["district"] == district) &
        (crop_hist["crop"] == crop)
    ].sort_values("year").tail(10)

    return {
        "expected_yield_ton_per_hectare": round(df["yield_ton_per_hectare"].mean(), 2),
        "min_yield": round(df["yield_ton_per_hectare"].min(), 2),
        "max_yield": round(df["yield_ton_per_hectare"].max(), 2),
        "years_used": len(df)
    }
