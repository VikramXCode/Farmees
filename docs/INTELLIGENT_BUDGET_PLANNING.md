# Intelligent Budget Planning System

## Overview
The Budget Planning System uses Groq AI (Llama 3.3 70B) to generate detailed, realistic budget breakdowns and optimal land allocation plans for farmers based on their constraints.

## Key Features

### 1. **Intelligent Land Allocation**
- Automatically calculates the maximum cultivable area based on budget
- **Example**: Farmer has 6 acres but only ₹50,000 budget
  - System determines: "You can only cultivate **2 acres** with your current budget"
  - Provides clear reasoning for the allocation decision

### 2. **Detailed Cost Breakdown**
Per-acre and total costs for:
- **Land Preparation**: Ploughing, leveling
- **Seeds**: Specific variety recommendations with quantity (kg/acre) and costs
- **Fertilizers** (if included):
  - Basal dose: DAP, Urea, Potash with quantities and costs
  - Top dressing schedule with timings (e.g., "30 days after sowing")
- **Labor**: Broken down by activity (preparation, sowing, weeding, harvesting)
- **Irrigation**: Water charges and electricity costs
- **Pesticides/Herbicides**: Expected spray rounds
- **Other Costs**: 10% contingency for unforeseen expenses

### 3. **Financial Projections**
- Expected yield per acre and total
- Current market prices
- Gross revenue calculation
- Net profit estimation
- ROI percentage
- Break-even analysis

### 4. **Crop-Specific Recommendations**
- Best seed varieties for soil and location
- Fertilizer application schedule with timing
- Irrigation schedule and water requirements

## API Endpoints

### Generate Detailed Budget Plan
```http
POST /api/crop-recommendations/budget-plan
```

**Request Body:**
```json
{
  "cropName": "Rice",
  "totalBudget": 50000,
  "availableLandAcres": 6,
  "soilType": "Loamy",
  "state": "Tamil Nadu",
  "district": "Thanjavur",
  "includeFertilizers": true,
  "season": "kharif"
}
```

**Response:**
```json
{
  "success": true,
  "budgetPlan": {
    "feasibilityStatus": "partial",
    "landAllocation": {
      "recommendedAcres": 2,
      "reasoning": "Based on estimated cost of ₹45,000 per acre, your budget of ₹50,000 can cover 2 acres out of 6 available.",
      "isFullLand": false
    },
    "budgetBreakdown": {
      "perAcre": {
        "landPreparation": 5000,
        "seeds": {
          "cost": 4000,
          "variety": "Pusa Basmati 1509",
          "quantityKg": 25
        },
        "fertilizers": {
          "basalDose": {
            "dap": { "kg": 50, "cost": 1500 },
            "urea": { "kg": 40, "cost": 800 },
            "potash": { "kg": 25, "cost": 700 }
          },
          "topDressing": [
            {
              "timing": "30 days after sowing",
              "urea": { "kg": 40, "cost": 800 }
            }
          ],
          "totalCost": 3800
        },
        "labor": {
          "landPreparation": 4000,
          "sowing": 2500,
          "weeding": 3000,
          "harvesting": 4000,
          "totalCost": 13500
        },
        "irrigation": 3000,
        "pesticides": 2500,
        "otherCosts": 4500,
        "totalPerAcre": 45000
      },
      "totalCosts": {
        "landPreparation": 10000,
        "seeds": 8000,
        "fertilizers": 7600,
        "labor": 27000,
        "irrigation": 6000,
        "pesticides": 5000,
        "otherCosts": 9000,
        "grandTotal": 50000
      }
    },
    "financialProjections": {
      "expectedYieldPerAcre": 25,
      "totalYield": 50,
      "marketPricePerQuintal": 2500,
      "grossRevenue": 125000,
      "netProfit": 75000,
      "roi": 150,
      "breakEvenYield": 20
    },
    "recommendations": {
      "seedVariety": "Pusa Basmati 1509 - Recommended for loamy soil in Tamil Nadu",
      "fertilizerSchedule": [
        {
          "stage": "At sowing",
          "fertilizers": "DAP, Urea, Potash (basal dose)",
          "quantity": "As per soil test report"
        },
        {
          "stage": "30 days after sowing",
          "fertilizers": "Urea (top dressing)",
          "quantity": "40 kg/acre"
        }
      ],
      "irrigationSchedule": "First irrigation 7 days after sowing, then every 10-12 days based on soil moisture",
      "criticalAlerts": [
        "⚠️ Budget limitation: Can only cultivate 2 acres out of 6 available. Consider additional financing for full land utilization.",
        "✓ Expected ROI of 150% is excellent for this crop"
      ]
    }
  }
}
```

### Quick Budget Feasibility Check
```http
POST /api/crop-recommendations/budget-check
```

**Request Body:**
```json
{
  "totalBudget": 50000,
  "cropName": "Rice",
  "landAcres": 6
}
```

**Response:**
```json
{
  "success": true,
  "feasibility": {
    "isFeasible": true,
    "canCoverFullLand": false,
    "recommendedAcres": 1,
    "estimatedCostPerAcre": 40000,
    "message": "Budget can cover 1 acres out of 6 available"
  }
}
```

## Frontend Integration

### State Management
```typescript
const [detailedBudgetPlan, setDetailedBudgetPlan] = useState<any>(null);
const [loadingBudgetPlan, setLoadingBudgetPlan] = useState(false);
```

### Fetching Budget Plan
```typescript
const fetchDetailedBudgetPlan = async (
  cropName: string, 
  totalBudget: number, 
  availableLandAcres: number
) => {
  setLoadingBudgetPlan(true);
  
  const response = await fetch(`${API_BASE_URL}/crop-recommendations/budget-plan`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({
      cropName,
      totalBudget,
      availableLandAcres,
      soilType: selectedLand?.soilData?.soilType || 'Loamy',
      state: formData.state,
      district: formData.district,
      includeFertilizers: formData.includeFertilizers,
      season: getCurrentSeason()
    })
  });
  
  const data = await response.json();
  setDetailedBudgetPlan(data.budgetPlan);
  setLoadingBudgetPlan(false);
};
```

### Usage in Recommendation Flow
```typescript
// After getting crop recommendation
const data = await getCropRecommendation(payload);
setRecommendation(data);

// Fetch detailed budget plan
if (data.recommended_crop) {
  fetchDetailedBudgetPlan(
    data.recommended_crop, 
    parseFloat(budgetInr), 
    parseFloat(landAreaAcre)
  );
}
```

## UI Components

### 1. Budget Limitation Alert
Shows when budget cannot cover all available land:
```tsx
<div className="bg-orange-50 border-l-4 border-orange-500 p-4">
  <AlertCircle className="w-6 h-6 text-orange-600" />
  <h4>⚠️ Budget Limitation Alert</h4>
  <p>Your budget can only cover 2 acres out of 6 available.</p>
  <p>{detailedBudgetPlan.landAllocation.reasoning}</p>
</div>
```

### 2. Sufficient Budget Indicator
```tsx
<div className="bg-green-50 border-l-4 border-green-500 p-4">
  <CheckCircle2 className="w-6 h-6 text-green-600" />
  <h4>✓ Budget is Sufficient</h4>
  <p>You can cultivate all 6 acres with your budget.</p>
</div>
```

### 3. Land Usage Summary
```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="bg-blue-50 p-4">
    <p>Land to Use</p>
    <p className="text-2xl font-bold">
      {detailedBudgetPlan.landAllocation.recommendedAcres} acres
    </p>
  </div>
  <div className="bg-green-50 p-4">
    <p>Total Budget</p>
    <p className="text-2xl font-bold">
      ₹{detailedBudgetPlan.budgetBreakdown.totalCosts.grandTotal.toLocaleString()}
    </p>
  </div>
  <div className="bg-purple-50 p-4">
    <p>Cost per Acre</p>
    <p className="text-2xl font-bold">
      ₹{detailedBudgetPlan.budgetBreakdown.perAcre.totalPerAcre.toLocaleString()}
    </p>
  </div>
</div>
```

### 4. Detailed Cost Table
Complete breakdown showing per-acre and total costs for all categories with seed varieties, fertilizer quantities (DAP, Urea, Potash), and labor breakdown.

### 5. Financial Projections Grid
Shows expected yield, market price, gross revenue, net profit, ROI, and break-even point.

### 6. Agricultural Recommendations
- Seed variety with specific names (e.g., "Pusa Basmati 1509")
- Fertilizer schedule with timing and quantities
- Irrigation schedule
- Critical alerts

## Technical Architecture

### Backend Services

**`budgetPlanningService.js`**
```javascript
class BudgetPlanningService {
  async generateBudgetPlan(params) {
    // Uses Groq AI (Llama 3.3 70B) with structured JSON output
    // Calculates optimal land allocation
    // Generates detailed cost breakdown
    // Provides financial projections
    // Returns crop-specific recommendations
  }
  
  generateFallbackBudgetPlan(params) {
    // Provides basic estimation if AI fails
    // Uses standard cost assumptions
  }
  
  validateBudgetPlan(plan) {
    // Ensures response structure is valid
  }
}
```

### Groq AI Integration

**Model**: `llama-3.3-70b-versatile`
**Temperature**: 0.3 (for consistent, realistic outputs)
**Response Format**: JSON object
**Max Tokens**: 4000

**Prompt Engineering**:
- Provides farmer's constraints (budget, land, location, soil)
- Requests specific calculations and reasoning
- Enforces structured JSON output format
- Includes validation rules (fertilizer 25-35%, labor 20-25%)
- Uses real market prices for location

### Error Handling
- Graceful fallback if Groq API is unavailable
- Basic estimation using standard costs
- No UI disruption if detailed plan fails

## User Experience Flow

1. **Farmer fills crop recommendation form**
   - Selects land
   - Enters budget (e.g., ₹50,000)
   - Checks "Include Fertilizers" option
   
2. **Gets basic recommendation**
   - Crop: Rice
   - Season: Kharif
   - Expected yield
   
3. **Detailed budget plan loads automatically**
   - Loading indicator: "Generating detailed budget plan with AI..."
   - Shows optimal land allocation
   
4. **Sees clear budget constraints**
   - "Your budget can only cover **2 acres** out of 6 available"
   - Complete cost breakdown per acre and total
   - Specific seed variety: "Pusa Basmati 1509"
   - Fertilizer schedule with quantities
   
5. **Views financial projections**
   - Net profit: ₹75,000
   - ROI: 150%
   - Break-even: 20 quintals
   
6. **Gets actionable recommendations**
   - When to apply fertilizers
   - How much to irrigate
   - Critical alerts about budget limitations

## Testing

Run the test script:
```bash
cd backend
node scripts/test_budget_plan.js
```

**Test Cases**:
1. Sufficient budget (₹3,00,000 for 6 acres) - Should cover all land
2. Insufficient budget (₹50,000 for 6 acres) - Should recommend 1-2 acres
3. Without fertilizers (₹1,00,000 for 3 acres) - Should show ₹0 fertilizer cost

## Benefits

### For Farmers
1. **Clear budget constraints**: Know exactly how much land they can afford to cultivate
2. **No surprises**: Detailed breakdown prevents mid-season financial stress
3. **Informed decisions**: Can adjust budget or reduce area based on realistic costs
4. **ROI visibility**: Understand potential returns before investing

### For Agricultural Planning
1. **Realistic expectations**: Based on current market prices
2. **Location-specific**: Costs vary by state and district
3. **Season-aware**: Kharif/Rabi/Zaid considerations
4. **Crop-specific**: Different crops have different cost structures

## Future Enhancements

1. **Real-time market price API integration**
2. **Historical cost tracking per region**
3. **Bulk discount calculations for inputs**
4. **Government subsidy integration**
5. **Financing options based on budget shortfall**
6. **Multi-crop rotation planning**
7. **Risk assessment and insurance recommendations**

## Configuration

### Environment Variables
```bash
# backend/.env
GROQ_API_KEYS=gsk_xxxxx,gsk_yyyyy  # Multiple keys for rate limit handling
```

### Cost Assumptions (Fallback)
- Land preparation: ₹5,000/acre
- Seeds: ₹4,000-5,000/acre
- Fertilizers: ₹3,800/acre (if included)
- Labor: ₹13,500/acre
- Irrigation: ₹3,000/acre
- Pesticides: ₹2,500/acre
- Other costs: 10% contingency

## Monitoring

### Logs
```javascript
console.log(`Loaded ${this.availableKeys.length} Groq API keys`);
console.error('Error generating budget plan:', error);
```

### Error Tracking
- API failures trigger fallback mode
- Validation errors for malformed AI responses
- Network errors handled gracefully

## Security

- API keys stored in environment variables
- Key rotation on rate limit errors
- No sensitive data in client-side code
- CORS protection on backend endpoints

## Performance

- Budget plan generation: ~3-5 seconds (AI processing)
- Fallback mode: <100ms (immediate calculation)
- Caching: None (always fresh market-based data)
- Parallel processing: Budget plan fetches alongside recommendation display

## Conclusion

The Intelligent Budget Planning System solves a critical problem for farmers: **knowing exactly what they can afford to cultivate**. Instead of vague cost estimates, farmers get:

✅ Precise land allocation based on budget
✅ Itemized cost breakdown with quantities
✅ Realistic financial projections
✅ Crop-specific recommendations
✅ Clear alerts about budget limitations

This empowers farmers to make informed decisions and prevents financial overextension.
