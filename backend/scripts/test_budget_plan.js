import budgetPlanningService from '../services/budgetPlanningService.js';

async function testBudgetPlanning() {
  console.log('🧪 Testing Budget Planning Service\n');
  
  // Test Case 1: Sufficient budget for all land
  console.log('Test Case 1: Sufficient Budget (₹3,00,000 for 6 acres)');
  try {
    const plan1 = await budgetPlanningService.generateBudgetPlan({
      cropName: 'Rice',
      totalBudget: 300000,
      availableLandAcres: 6,
      soilType: 'Loamy',
      location: 'Thanjavur, Tamil Nadu',
      includeFertilizers: true,
      season: 'kharif'
    });
    
    console.log('✅ Land Allocation:', plan1.landAllocation.recommendedAcres, 'acres');
    console.log('✅ Total Cost:', '₹' + plan1.budgetBreakdown.totalCosts.grandTotal.toLocaleString());
    console.log('✅ Cost per Acre:', '₹' + plan1.budgetBreakdown.perAcre.totalPerAcre.toLocaleString());
    console.log('✅ Seed Variety:', plan1.budgetBreakdown.perAcre.seeds.variety);
    console.log('✅ Expected ROI:', plan1.financialProjections.roi + '%');
    console.log('✅ Net Profit:', '₹' + plan1.financialProjections.netProfit.toLocaleString());
    console.log('');
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
  }

  // Test Case 2: Insufficient budget
  console.log('Test Case 2: Insufficient Budget (₹50,000 for 6 acres)');
  try {
    const plan2 = await budgetPlanningService.generateBudgetPlan({
      cropName: 'Wheat',
      totalBudget: 50000,
      availableLandAcres: 6,
      soilType: 'Clay',
      location: 'Punjab, India',
      includeFertilizers: true,
      season: 'rabi'
    });
    
    console.log('✅ Feasibility:', plan2.feasibilityStatus);
    console.log('✅ Can cultivate:', plan2.landAllocation.recommendedAcres, 'acres out of 6');
    console.log('✅ Reasoning:', plan2.landAllocation.reasoning);
    console.log('✅ Critical Alerts:', plan2.recommendations.criticalAlerts.length);
    console.log('');
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
  }

  // Test Case 3: Without fertilizers
  console.log('Test Case 3: Without Fertilizers (₹1,00,000 for 3 acres)');
  try {
    const plan3 = await budgetPlanningService.generateBudgetPlan({
      cropName: 'Cotton',
      totalBudget: 100000,
      availableLandAcres: 3,
      soilType: 'Black Soil',
      location: 'Vidarbha, Maharashtra',
      includeFertilizers: false,
      season: 'kharif'
    });
    
    console.log('✅ Land Allocation:', plan3.landAllocation.recommendedAcres, 'acres');
    console.log('✅ Fertilizer Cost:', plan3.budgetBreakdown.totalCosts.fertilizers || 0);
    console.log('✅ Total Cost:', '₹' + plan3.budgetBreakdown.totalCosts.grandTotal.toLocaleString());
    console.log('');
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
  }

  console.log('✅ All tests completed!');
  process.exit(0);
}

testBudgetPlanning().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
