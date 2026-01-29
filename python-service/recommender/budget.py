"""Budget planning logic - DO NOT MODIFY"""

def plan_with_budget(crop, land_area, budget, cost_table, tolerance=1000):
    """
    Plans cultivation area based on budget constraints
    
    Args:
        crop: Crop name
        land_area: Total land area in hectares
        budget: Available budget in INR
        cost_table: Dict mapping crop to cost_per_hectare
        tolerance: Budget shortfall tolerance (default 1000 INR)
    
    Returns:
        Dict with status, planned_area_hectare, cost_per_hectare, 
        estimated_cost, and budget_remaining or required_extra_budget
    """
    cost_per_ha = cost_table.get(crop)
    if cost_per_ha is None:
        return None

    max_affordable_area = budget / cost_per_ha

    if max_affordable_area >= land_area:
        estimated_cost = land_area * cost_per_ha
        return {
            "status": "fits",
            "planned_area_hectare": land_area,
            "cost_per_hectare": cost_per_ha,
            "estimated_cost": round(estimated_cost, 2),
            "budget_remaining": round(budget - estimated_cost, 2)
        }

    shortfall = (land_area * cost_per_ha) - budget
    if 0 < shortfall <= tolerance:
        return {
            "status": "ask_increase",
            "required_extra_budget": round(shortfall, 2),
            "planned_area_hectare": land_area,
            "cost_per_hectare": cost_per_ha,
            "estimated_cost": round(land_area * cost_per_ha, 2)
        }

    planned_area = int(max_affordable_area * 100) / 100
    estimated_cost = planned_area * cost_per_ha

    return {
        "status": "reduce_area",
        "planned_area_hectare": planned_area,
        "cost_per_hectare": cost_per_ha,
        "estimated_cost": round(estimated_cost, 2),
        "budget_remaining": round(budget - estimated_cost, 2)
    }
