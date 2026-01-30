// Service to generate AI-powered suggestions for next steps in farming plan

export async function generateNextStepSuggestions(plan) {
  const suggestions = [];
  const now = new Date();
  
  // Get completed activities
  const completedActivities = plan.activities.filter(a => a.status === 'completed');
  const lastActivity = completedActivities[completedActivities.length - 1];
  
  // Stage-based suggestions
  switch (plan.progress.currentStage) {
    case 'planning':
      if (plan.status === 'active') {
        suggestions.push({
          suggestionText: 'Start land preparation. Clear the field and test soil moisture levels.',
          priority: 'high',
          category: 'next_step',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
        });
      }
      break;
      
    case 'preparation':
      const hasPloughing = completedActivities.some(a => a.activityType === 'ploughing');
      if (!hasPloughing) {
        suggestions.push({
          suggestionText: 'Plough the land to prepare soil for sowing. Ideal depth: 15-20cm.',
          priority: 'high',
          category: 'next_step',
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
        });
      } else {
        suggestions.push({
          suggestionText: 'Proceed with seed sowing. Weather conditions are favorable.',
          priority: 'high',
          category: 'next_step',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        });
      }
      break;
      
    case 'sowing':
      const hasSowing = completedActivities.some(a => a.activityType === 'seed_sowing');
      if (hasSowing && lastActivity?.completedDate) {
        const daysSinceSowing = Math.floor((now - lastActivity.completedDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceSowing >= 7 && daysSinceSowing < 10) {
          suggestions.push({
            suggestionText: 'First irrigation recommended. Ensure adequate soil moisture for germination.',
            priority: 'urgent',
            category: 'next_step',
            dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
          });
        }
        
        if (daysSinceSowing >= 15 && plan.includeFertilizers) {
          const hasFirstFertilizer = completedActivities.some(
            a => a.activityType === 'fertilizer_application' && 
            a.description?.includes('first') || a.description?.includes('basal')
          );
          
          if (!hasFirstFertilizer) {
            suggestions.push({
              suggestionText: 'Apply first dose of fertilizer (basal application). ' +
                `Recommended: ${plan.fertilizerDetails[0]?.name || 'NPK fertilizer'} @ ` +
                `${plan.fertilizerDetails[0]?.quantityKg || 'as planned'} kg per hectare.`,
              priority: 'high',
              category: 'next_step',
              dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
            });
          }
        }
      }
      break;
      
    case 'growth':
      if (lastActivity?.completedDate) {
        const daysSinceLastActivity = Math.floor((now - lastActivity.completedDate) / (1000 * 60 * 60 * 24));
        
        // Irrigation reminder
        if (daysSinceLastActivity >= 5) {
          suggestions.push({
            suggestionText: 'Monitor soil moisture. Irrigation may be needed based on weather conditions.',
            priority: 'medium',
            category: 'reminder',
            dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
          });
        }
        
        // Weeding suggestion
        const hasWeeding = completedActivities.some(a => a.activityType === 'weeding');
        if (!hasWeeding && daysSinceLastActivity >= 20) {
          suggestions.push({
            suggestionText: 'Weeding recommended to prevent competition for nutrients and water.',
            priority: 'high',
            category: 'next_step',
            dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
          });
        }
      }
      break;
      
    case 'maintenance':
      // Pest monitoring
      suggestions.push({
        suggestionText: 'Regular pest and disease monitoring recommended. Check for common ' +
          `${plan.cropName} pests.`,
        priority: 'medium',
        category: 'reminder',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      });
      
      // Second fertilizer dose
      if (plan.includeFertilizers && plan.fertilizerDetails.length > 1) {
        const hasSecondFertilizer = completedActivities.some(
          a => a.activityType === 'fertilizer_application' && 
          (a.description?.includes('second') || a.description?.includes('top'))
        );
        
        if (!hasSecondFertilizer) {
          suggestions.push({
            suggestionText: 'Apply second dose of fertilizer (top dressing). ' +
              'This boosts vegetative growth and yield.',
            priority: 'high',
            category: 'next_step',
            dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
          });
        }
      }
      break;
      
    case 'harvesting':
      suggestions.push({
        suggestionText: 'Harvest when crop reaches maturity. Check moisture content and grain filling.',
        priority: 'urgent',
        category: 'next_step',
        dueDate: plan.expectedHarvestDate || new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
      });
      break;
  }
  
  // Budget warnings
  if (plan.actualCosts.totalSpent > plan.totalBudget * 0.9) {
    suggestions.push({
      suggestionText: `Budget alert: You've used ${Math.round((plan.actualCosts.totalSpent / plan.totalBudget) * 100)}% ` +
        `of your total budget (₹${plan.actualCosts.totalSpent.toLocaleString()} / ₹${plan.totalBudget.toLocaleString()}). ` +
        'Plan remaining expenses carefully.',
      priority: 'high',
      category: 'warning',
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    });
  }
  
  // Weather-based suggestions
  const daysSinceStart = Math.floor((now - plan.startDate) / (1000 * 60 * 60 * 24));
  if (daysSinceStart >= 30 && daysSinceStart <= 45) {
    suggestions.push({
      suggestionText: 'Monitor weather forecasts. Heavy rain or drought can impact crop health. ' +
        'Plan irrigation or drainage accordingly.',
      priority: 'medium',
      category: 'reminder',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    });
  }
  
  // Generic optimization suggestions
  if (completedActivities.length >= 5) {
    const avgCost = completedActivities.reduce((sum, a) => sum + (a.cost || 0), 0) / completedActivities.length;
    if (avgCost > plan.totalBudget / 10) {
      suggestions.push({
        suggestionText: 'Consider optimizing costs. Some activities are exceeding average planned expenses. ' +
          'Review labor and input costs.',
        priority: 'low',
        category: 'optimization',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      });
    }
  }
  
  return suggestions;
}

// Generate suggestions based on crop type and season
export function generateCropSpecificSuggestions(cropName, stage, season) {
  const suggestions = [];
  
  // Crop-specific recommendations
  const cropRecommendations = {
    'Rice': {
      sowing: ['Maintain 2-3 cm water level after sowing', 'Use disease-free certified seeds'],
      growth: ['Keep water level at 5-10 cm during vegetative stage', 'Watch for stem borers'],
      maintenance: ['Apply potash during panicle initiation', 'Control weeds before flowering']
    },
    'Wheat': {
      sowing: ['Sow at optimal depth of 5-6 cm', 'Ensure good seed-soil contact'],
      growth: ['First irrigation at crown root initiation (20-25 days)', 'Monitor for rust diseases'],
      maintenance: ['Apply nitrogen in split doses', 'Control aphids during grain filling']
    },
    'Cotton': {
      sowing: ['Pre-monsoon sowing for better establishment', 'Use bt cotton seeds for pest resistance'],
      growth: ['Regular monitoring for bollworm', 'Maintain soil moisture'],
      maintenance: ['Remove affected bolls', 'Apply micronutrients during flowering']
    }
  };
  
  if (cropRecommendations[cropName] && cropRecommendations[cropName][stage]) {
    cropRecommendations[cropName][stage].forEach(rec => {
      suggestions.push({
        suggestionText: rec,
        priority: 'medium',
        category: 'optimization'
      });
    });
  }
  
  return suggestions;
}

export default {
  generateNextStepSuggestions,
  generateCropSpecificSuggestions
};
