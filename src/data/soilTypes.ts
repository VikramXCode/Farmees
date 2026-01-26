/**
 * Common soil types in India with regional prioritization
 */

export interface SoilType {
  name: string;
  localName: string;
  description?: string;
  regions?: string[];
}

export const SOIL_TYPES: SoilType[] = [
  {
    name: 'Red Soil',
    localName: 'சிவப்பு மண்',
    description: 'Common in Tamil Nadu, Karnataka, Andhra Pradesh',
    regions: ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala']
  },
  {
    name: 'Black Soil',
    localName: 'கருப்பு மண்',
    description: 'Cotton-growing regions, high water retention',
    regions: ['Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Karnataka']
  },
  {
    name: 'Alluvial Soil',
    localName: 'வண்டல் மண்',
    description: 'Most fertile, found in river plains',
    regions: ['Punjab', 'Haryana', 'Uttar Pradesh', 'West Bengal']
  },
  {
    name: 'Laterite Soil',
    localName: 'லேட்டரைட் மண்',
    description: 'Tropical regions with high rainfall',
    regions: ['Kerala', 'Karnataka', 'Tamil Nadu', 'Maharashtra']
  },
  {
    name: 'Sandy Soil',
    localName: 'மணல் மண்',
    description: 'Coastal areas, good drainage',
    regions: ['Rajasthan', 'Gujarat', 'Coastal regions']
  },
  {
    name: 'Clay Soil',
    localName: 'களிமண்',
    description: 'Heavy soil, retains water well',
    regions: ['Kerala', 'Tamil Nadu', 'Karnataka']
  },
  {
    name: 'Loamy Soil',
    localName: 'கலப்பு மண்',
    description: 'Mix of sand, silt, and clay - ideal for farming',
    regions: ['All regions']
  },
  {
    name: 'Mountain Soil',
    localName: 'மலை மண்',
    description: 'Hilly and mountainous regions',
    regions: ['Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir']
  }
];

/**
 * Get prioritized soil types based on state/region
 * @param location Location string (e.g., "Erode, Tamil Nadu")
 * @returns Sorted soil types with regional ones first
 */
export function getSoilTypeSuggestions(location: string): SoilType[] {
  if (!location) return SOIL_TYPES;
  
  // Extract state (second part after comma)
  const parts = location.split(',').map(s => s.trim());
  const state = parts.length > 1 ? parts[1] : parts[0];
  
  // Prioritize soil types common in this state
  const prioritized = SOIL_TYPES.filter(soil => 
    soil.regions?.some(region => region.toLowerCase().includes(state.toLowerCase()))
  );
  
  const others = SOIL_TYPES.filter(soil => 
    !soil.regions?.some(region => region.toLowerCase().includes(state.toLowerCase()))
  );
  
  return [...prioritized, ...others];
}

/**
 * Filter soil types by search query
 * @param query Search query
 * @returns Filtered soil types
 */
export function filterSoilTypes(query: string): SoilType[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return SOIL_TYPES.filter(soil => 
    soil.name.toLowerCase().includes(lowerQuery) ||
    soil.description?.toLowerCase().includes(lowerQuery)
  );
}
