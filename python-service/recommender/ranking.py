"""Crop ranking logic - DO NOT MODIFY"""

def rank_crops(df):
    """
    Ranks crops based on historical performance
    
    Args:
        df: DataFrame with columns: crop, year, yield_ton_per_hectare, area_hectare
    
    Returns:
        DataFrame sorted by avg_yield, years_grown, avg_area (descending)
    """
    last_years = (
        df.sort_values("year")
          .groupby("crop")
          .tail(10)
    )
    ranking = (
        last_years
        .groupby("crop")
        .agg(
            avg_yield=("yield_ton_per_hectare", "mean"),
            years_grown=("year", "count"),
            avg_area=("area_hectare", "mean")
        )
        .sort_values(
            ["avg_yield", "years_grown", "avg_area"],
            ascending=False
        )
        .reset_index()
    )
    return ranking
