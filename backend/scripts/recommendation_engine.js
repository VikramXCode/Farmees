// AI Recommendation Engine (Rule-based)
// Usage: recommendCrops(soilData, weather, market)

function recommendCrops(soil, weather = {}, market = {}) {
  const recommendations = [];
  const avoid = [];
  let summary = '';

  // Example rules
  if (soil.pH && parseFloat(soil.pH) < 6.0) {
    recommendations.push('lime-tolerant crops (e.g., potato, barley)');
    avoid.push('acid-sensitive crops (e.g., beans, peas)');
  }
  if (soil.nitrogen && parseFloat(soil.nitrogen) > 50) {
    avoid.push('nitrogen-hungry crops (e.g., maize, wheat)');
  }
  if (soil.potassium && parseFloat(soil.potassium) > 40) {
    recommendations.push('potassium-loving crops (e.g., banana, sugarcane)');
  }
  if (soil.moisture && parseFloat(soil.moisture) < 20) {
    avoid.push('water-intensive crops (e.g., paddy, sugarcane)');
  }
  // Add more rules as needed

  // Weather/market logic (example)
  if (weather.rainfall && weather.rainfall < 50) {
    avoid.push('rainfall-dependent crops (e.g., rice)');
  }
  if (market.priceTrend && market.priceTrend['millets'] > market.priceTrend['rice']) {
    recommendations.push('millets (market price is high)');
  }

  summary = `Recommended crops: ${recommendations.join(', ') || 'General crops'}\nAvoid: ${avoid.join(', ') || 'None'}\n`;
  return { recommendations, avoid, summary };
}

export { recommendCrops };
