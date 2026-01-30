import groqService from './groqService.js';
import { Groq } from 'groq-sdk';

class BudgetPlanningService {
  /**
   * Generate detailed budget breakdown and optimal land allocation using Groq AI
   * @param {Object} params - Planning parameters
   * @param {string} params.cropName - Name of the crop to grow
   * @param {number} params.totalBudget - Total budget in INR
   * @param {number} params.availableLandAcres - Total available land in acres
   * @param {string} params.soilType - Type of soil
   * @param {string} params.location - Location (state, district)
   * @param {boolean} params.includeFertilizers - Whether to include fertilizer costs
   * @param {string} params.season - Current season (kharif/rabi/zaid)
   * @returns {Promise<Object>} Detailed budget plan with land allocation
   */
  async generateBudgetPlan(params) {
    try {
      const {
        cropName,
        totalBudget,
        availableLandAcres,
        soilType,
        location,
        includeFertilizers = true,
        season = 'kharif'
      } = params;

      const apiKey = groqService.getCurrentKey();
      const groq = new Groq({ apiKey });

      const prompt = `You are an expert agricultural economist and farm advisor in India. 

**TASK**: Create a detailed, realistic budget breakdown and land allocation plan for a farmer.

**FARMER'S CONSTRAINTS**:
- Crop: ${cropName}
- Total Budget: ₹${totalBudget.toLocaleString('en-IN')}
- Available Land: ${availableLandAcres} acres
- Soil Type: ${soilType}
- Location: ${location}
- Season: ${season}
- Include Fertilizers: ${includeFertilizers ? 'Yes' : 'No'}

**YOUR ANALYSIS MUST INCLUDE**:

1. **OPTIMAL LAND ALLOCATION**:
   - Calculate the maximum acres that can be cultivated with the given budget
   - If budget is insufficient for full land, specify exact acres to use
   - Provide reasoning for land allocation decision

2. **DETAILED COST BREAKDOWN** (per acre and total):
   a) **Land Preparation**: Ploughing, leveling, etc.
   b) **Seeds**: Variety recommendation, quantity (kg/acre), cost
   c) **Fertilizers** (if included): 
      - Basal dose (DAP, Urea, Potash) - quantities and costs
      - Top dressing schedule (timing, quantities, costs)
   d) **Labor Costs**: 
      - Land preparation labor
      - Sowing labor
      - Weeding/maintenance labor
      - Harvesting labor
   e) **Irrigation**: Water charges, electricity/diesel
   f) **Pesticides/Herbicides**: Expected spray rounds
   g) **Other Costs**: Bags, transportation, contingency (10%)

3. **FINANCIAL PROJECTIONS**:
   - Expected yield (quintals/acre)
   - Total production (quintals)
   - Current market price (₹/quintal)
   - Gross revenue
   - Net profit
   - ROI percentage
   - Break-even analysis

4. **BUDGET FEASIBILITY ALERT**:
   - Is budget sufficient for optimal production?
   - If not, what is the realistic land coverage?
   - Recommendations to maximize returns within budget

5. **CROP-SPECIFIC RECOMMENDATIONS**:
   - Best seed variety for the soil and location
   - Critical fertilizer application timings
   - Water requirements and irrigation schedule

**OUTPUT FORMAT** (Must be valid JSON):
\`\`\`json
{
  "feasibilityStatus": "sufficient" | "partial" | "insufficient",
  "landAllocation": {
    "recommendedAcres": <number>,
    "reasoning": "<explanation why this many acres>",
    "isFullLand": <boolean>
  },
  "budgetBreakdown": {
    "perAcre": {
      "landPreparation": <number>,
      "seeds": {
        "cost": <number>,
        "variety": "<seed variety name>",
        "quantityKg": <number>
      },
      "fertilizers": {
        "basalDose": {
          "dap": { "kg": <number>, "cost": <number> },
          "urea": { "kg": <number>, "cost": <number> },
          "potash": { "kg": <number>, "cost": <number> }
        },
        "topDressing": [
          {
            "timing": "<e.g., 30 days after sowing>",
            "urea": { "kg": <number>, "cost": <number> }
          }
        ],
        "totalCost": <number>
      },
      "labor": {
        "landPreparation": <number>,
        "sowing": <number>,
        "weeding": <number>,
        "harvesting": <number>,
        "totalCost": <number>
      },
      "irrigation": <number>,
      "pesticides": <number>,
      "otherCosts": <number>,
      "totalPerAcre": <number>
    },
    "totalCosts": {
      "landPreparation": <number>,
      "seeds": <number>,
      "fertilizers": <number>,
      "labor": <number>,
      "irrigation": <number>,
      "pesticides": <number>,
      "otherCosts": <number>,
      "grandTotal": <number>
    }
  },
  "financialProjections": {
    "expectedYieldPerAcre": <number in quintals>,
    "totalYield": <number in quintals>,
    "marketPricePerQuintal": <number>,
    "grossRevenue": <number>,
    "netProfit": <number>,
    "roi": <number percentage>,
    "breakEvenYield": <number in quintals>
  },
  "recommendations": {
    "seedVariety": "<specific variety name and details>",
    "fertilizerSchedule": [
      {
        "stage": "<e.g., At sowing, 30 DAS, 60 DAS>",
        "fertilizers": "<what to apply>",
        "quantity": "<how much>"
      }
    ],
    "irrigationSchedule": "<watering frequency and timing>",
    "criticalAlerts": [
      "<alert 1: e.g., Budget only covers 2 acres out of 6 available>",
      "<alert 2: e.g., Consider leasing remaining land>"
    ]
  }
}
\`\`\`

**IMPORTANT INSTRUCTIONS**:
1. Use REAL, CURRENT market prices for ${location}, India
2. Base calculations on standard agricultural practices for ${cropName} in ${season} season
3. If budget is insufficient, CLEARLY state how many acres can be cultivated
4. Include 10% contingency in "otherCosts"
5. Fertilizer costs should be 25-35% of total budget if included
6. Labor typically accounts for 20-25% of costs
7. Be specific with seed varieties (e.g., "DHM-117" for wheat, "Pusa Basmati 1509" for rice)

Respond ONLY with the JSON object, no additional text.`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert agricultural economist specializing in Indian farming. Provide accurate, realistic budget breakdowns based on current market conditions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('No response from Groq API');
      }

      const budgetPlan = JSON.parse(responseText);

      // Validate the response structure
      this.validateBudgetPlan(budgetPlan);

      // Add metadata
      budgetPlan.metadata = {
        generatedAt: new Date().toISOString(),
        model: "llama-3.3-70b-versatile",
        inputParams: params
      };

      return budgetPlan;

    } catch (error) {
      console.error('Error generating budget plan:', error);
      
      // If Groq fails, return a basic fallback plan
      if (error.message.includes('API') || error.message.includes('rate limit')) {
        return this.generateFallbackBudgetPlan(params);
      }
      
      throw error;
    }
  }

  /**
   * Validate the structure of the budget plan from Groq
   */
  validateBudgetPlan(plan) {
    const requiredFields = [
      'feasibilityStatus',
      'landAllocation',
      'budgetBreakdown',
      'financialProjections',
      'recommendations'
    ];

    for (const field of requiredFields) {
      if (!plan[field]) {
        throw new Error(`Invalid budget plan: missing ${field}`);
      }
    }

    if (!plan.landAllocation.recommendedAcres || plan.landAllocation.recommendedAcres <= 0) {
      throw new Error('Invalid land allocation in budget plan');
    }

    if (!plan.budgetBreakdown.totalCosts || !plan.budgetBreakdown.totalCosts.grandTotal) {
      throw new Error('Invalid budget breakdown in plan');
    }
  }

  /**
   * Generate a basic fallback plan if Groq API fails
   */
  generateFallbackBudgetPlan(params) {
    const {
      cropName,
      totalBudget,
      availableLandAcres,
      includeFertilizers
    } = params;

    // Simple cost estimation (₹30,000-50,000 per acre for most crops)
    const estimatedCostPerAcre = includeFertilizers ? 45000 : 35000;
    const recommendedAcres = Math.min(
      Math.floor(totalBudget / estimatedCostPerAcre),
      availableLandAcres
    );

    const actualBudget = recommendedAcres * estimatedCostPerAcre;

    return {
      feasibilityStatus: recommendedAcres >= availableLandAcres ? 'sufficient' : 'partial',
      landAllocation: {
        recommendedAcres: recommendedAcres,
        reasoning: `Based on estimated cost of ₹${estimatedCostPerAcre.toLocaleString()} per acre, your budget of ₹${totalBudget.toLocaleString()} can cover ${recommendedAcres} acres out of ${availableLandAcres} available.`,
        isFullLand: recommendedAcres >= availableLandAcres
      },
      budgetBreakdown: {
        perAcre: {
          landPreparation: 5000,
          seeds: {
            cost: includeFertilizers ? 4000 : 5000,
            variety: `Standard ${cropName} variety`,
            quantityKg: 25
          },
          fertilizers: includeFertilizers ? {
            basalDose: {
              dap: { kg: 50, cost: 1500 },
              urea: { kg: 40, cost: 800 },
              potash: { kg: 25, cost: 700 }
            },
            topDressing: [
              {
                timing: "30 days after sowing",
                urea: { kg: 40, cost: 800 }
              }
            ],
            totalCost: 3800
          } : null,
          labor: {
            landPreparation: 4000,
            sowing: 2500,
            weeding: 3000,
            harvesting: 4000,
            totalCost: 13500
          },
          irrigation: 3000,
          pesticides: 2500,
          otherCosts: includeFertilizers ? 4500 : 3500,
          totalPerAcre: estimatedCostPerAcre
        },
        totalCosts: {
          landPreparation: 5000 * recommendedAcres,
          seeds: (includeFertilizers ? 4000 : 5000) * recommendedAcres,
          fertilizers: includeFertilizers ? 3800 * recommendedAcres : 0,
          labor: 13500 * recommendedAcres,
          irrigation: 3000 * recommendedAcres,
          pesticides: 2500 * recommendedAcres,
          otherCosts: (includeFertilizers ? 4500 : 3500) * recommendedAcres,
          grandTotal: actualBudget
        }
      },
      financialProjections: {
        expectedYieldPerAcre: 25,
        totalYield: 25 * recommendedAcres,
        marketPricePerQuintal: 2500,
        grossRevenue: 25 * recommendedAcres * 2500,
        netProfit: (25 * recommendedAcres * 2500) - actualBudget,
        roi: (((25 * recommendedAcres * 2500) - actualBudget) / actualBudget * 100).toFixed(2),
        breakEvenYield: actualBudget / 2500
      },
      recommendations: {
        seedVariety: `Consult local agriculture office for best ${cropName} variety`,
        fertilizerSchedule: includeFertilizers ? [
          {
            stage: "At sowing",
            fertilizers: "DAP, Urea, Potash (basal dose)",
            quantity: "As per soil test report"
          },
          {
            stage: "30 days after sowing",
            fertilizers: "Urea (top dressing)",
            quantity: "40 kg/acre"
          }
        ] : [],
        irrigationSchedule: "As per crop water requirement and local conditions",
        criticalAlerts: [
          recommendedAcres < availableLandAcres 
            ? `⚠️ Budget limitation: Can only cultivate ${recommendedAcres} acres out of ${availableLandAcres} available. Consider additional financing for full land utilization.`
            : "✓ Budget is sufficient for all available land",
          "This is a basic estimate. Consult with local agriculture experts for detailed planning."
        ]
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        model: "fallback",
        note: "This is a basic estimation. For detailed analysis, ensure Groq API is available."
      }
    };
  }

  /**
   * Quick budget feasibility check
   */
  async checkBudgetFeasibility(totalBudget, cropName, landAcres) {
    // Quick estimation without full Groq call
    const avgCostPerAcre = 40000; // Average cost across most crops
    const recommendedAcres = Math.floor(totalBudget / avgCostPerAcre);
    
    return {
      isFeasible: recommendedAcres > 0,
      canCoverFullLand: recommendedAcres >= landAcres,
      recommendedAcres: Math.min(recommendedAcres, landAcres),
      estimatedCostPerAcre: avgCostPerAcre,
      message: recommendedAcres >= landAcres 
        ? `Budget is sufficient to cultivate all ${landAcres} acres`
        : `Budget can cover ${recommendedAcres} acres out of ${landAcres} available`
    };
  }
}

export default new BudgetPlanningService();
