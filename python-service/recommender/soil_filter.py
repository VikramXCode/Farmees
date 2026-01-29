"""Soil-based crop filtering logic - DO NOT MODIFY"""

def filter_soil_crops(soil_df, farmer):
    """
    Filters crops based on soil conditions and farmer parameters
    
    Args:
        soil_df: DataFrame with columns: crop, soil_type, ph_min, ph_max, 
                 temp_min_c, temp_max_c, season, duration_months
        farmer: Dict with keys: soil_type, ph, temp, season, future_months
    
    Returns:
        Sorted list of crop names matching conditions
    """
    df = soil_df[
        (soil_df["soil_type"] == farmer["soil_type"]) &
        (soil_df["ph_min"] <= farmer["ph"]) &
        (soil_df["ph_max"] >= farmer["ph"]) &
        (soil_df["temp_min_c"] <= farmer["temp"]) &
        (soil_df["temp_max_c"] >= farmer["temp"]) &
        (soil_df["season"].isin([farmer["season"], "Whole Year", "Zaid"])) &
        (soil_df["duration_months"] <= farmer["future_months"] + 2)
    ]
    return sorted(df["crop"].unique())
