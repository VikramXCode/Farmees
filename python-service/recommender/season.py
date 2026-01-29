"""Season determination logic - DO NOT MODIFY"""

def get_season_from_date(date_str):
    """
    Determines crop season based on planting date
    
    Args:
        date_str: Date in format "YYYY-MM-DD"
    
    Returns:
        Season string: "Kharif", "Rabi", or "Zaid"
    """
    from datetime import datetime
    month = datetime.strptime(date_str, "%Y-%m-%d").month
    if 6 <= month <= 10:
        return "Kharif"
    elif month >= 11 or month <= 3:
        return "Rabi"
    else:
        return "Zaid"
