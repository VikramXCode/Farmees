/**
 * District-wise crop suggestions for smart input
 * Based on common crops grown in different regions of India
 */

export interface CropSuggestion {
  name: string;
  tamilName: string;
  icon?: string;
}

export const DISTRICT_CROP_MAP: Record<string, CropSuggestion[]> = {
  // Tamil Nadu
  'Erode': [
    { name: 'Turmeric', tamilName: 'மஞ்சள்', icon: '🌿' },
    { name: 'Sugarcane', tamilName: 'கரும்பு', icon: '🎋' },
    { name: 'Banana', tamilName: 'வாழை', icon: '🍌' },
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Maize', tamilName: 'சோளம்', icon: '🌽' }
  ],
  'Coimbatore': [
    { name: 'Coconut', tamilName: 'தேங்காய்', icon: '🥥' },
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Cotton', tamilName: 'பருத்தி', icon: '⚪' },
    { name: 'Groundnut', tamilName: 'வேர்க்கடலை', icon: '🥜' },
    { name: 'Sugarcane', tamilName: 'கரும்பு', icon: '🎋' }
  ],
  'Madurai': [
    { name: 'Cotton', tamilName: 'பருத்தி', icon: '⚪' },
    { name: 'Groundnut', tamilName: 'வேர்க்கடலை', icon: '🥜' },
    { name: 'Chilli', tamilName: 'மிளகாய்', icon: '🌶️' },
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Sorghum', tamilName: 'சோளம்', icon: '🌾' }
  ],
  'Thanjavur': [
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Sugarcane', tamilName: 'கரும்பு', icon: '🎋' },
    { name: 'Groundnut', tamilName: 'வேர்க்கடலை', icon: '🥜' },
    { name: 'Banana', tamilName: 'வாழை', icon: '🍌' }
  ],
  'Salem': [
    { name: 'Mango', tamilName: 'மாம்பழம்', icon: '🥭' },
    { name: 'Tamarind', tamilName: 'புளி', icon: '🌳' },
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Ragi', tamilName: 'கேழ்வரகு', icon: '🌾' },
    { name: 'Maize', tamilName: 'சோளம்', icon: '🌽' }
  ],
  
  // Kerala
  'Palakkad': [
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Coconut', tamilName: 'தேங்காய்', icon: '🥥' },
    { name: 'Banana', tamilName: 'வாழை', icon: '🍌' },
    { name: 'Areca Nut', tamilName: 'பாக்கு', icon: '🌰' }
  ],
  'Wayanad': [
    { name: 'Coffee', tamilName: 'காபி', icon: '☕' },
    { name: 'Tea', tamilName: 'தேநீர்', icon: '🍵' },
    { name: 'Pepper', tamilName: 'மிளகு', icon: '⚫' },
    { name: 'Cardamom', tamilName: 'ஏலக்காய்', icon: '🌿' },
    { name: 'Ginger', tamilName: 'இஞ்சி', icon: '🫚' }
  ],
  'Thrissur': [
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Coconut', tamilName: 'தேங்காய்', icon: '🥥' },
    { name: 'Rubber', tamilName: 'ரப்பர்', icon: '🌳' },
    { name: 'Banana', tamilName: 'வாழை', icon: '🍌' }
  ],
  'Kollam': [
    { name: 'Coconut', tamilName: 'தேங்காய்', icon: '🥥' },
    { name: 'Cashew', tamilName: 'முந்திரி', icon: '🌰' },
    { name: 'Rubber', tamilName: 'ரப்பர்', icon: '🌳' },
    { name: 'Tapioca', tamilName: 'மரவள்ளி', icon: '🥔' }
  ],
  
  // Karnataka
  'Bangalore': [
    { name: 'Ragi', tamilName: 'கேழ்வரகு', icon: '🌾' },
    { name: 'Tomato', tamilName: 'தக்காளி', icon: '🍅' },
    { name: 'Potato', tamilName: 'உருளைக்கிழங்கு', icon: '🥔' },
    { name: 'Maize', tamilName: 'சோளம்', icon: '🌽' }
  ],
  'Mysore': [
    { name: 'Sugarcane', tamilName: 'கரும்பு', icon: '🎋' },
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Ragi', tamilName: 'கேழ்வரகு', icon: '🌾' },
    { name: 'Mulberry', tamilName: 'மல்பெரி', icon: '🌿' }
  ],
  
  // Andhra Pradesh
  'Guntur': [
    { name: 'Chilli', tamilName: 'மிளகாய்', icon: '🌶️' },
    { name: 'Cotton', tamilName: 'பருத்தி', icon: '⚪' },
    { name: 'Tobacco', tamilName: 'புகையிலை', icon: '🌿' },
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' }
  ],
  'Krishna': [
    { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
    { name: 'Sugarcane', tamilName: 'கரும்பு', icon: '🎋' },
    { name: 'Tobacco', tamilName: 'புகையிலை', icon: '🌿' },
    { name: 'Turmeric', tamilName: 'மஞ்சள்', icon: '🌿' }
  ]
};
/**
 * Common crops across India (fallback suggestions)
 */
export const COMMON_CROPS: CropSuggestion[] = [
  { name: 'Paddy', tamilName: 'நெல்', icon: '🌾' },
  { name: 'Wheat', tamilName: 'கோதுமை', icon: '🌾' },
  { name: 'Maize', tamilName: 'சோளம்', icon: '🌽' },
  { name: 'Sugarcane', tamilName: 'கரும்பு', icon: '🎋' },
  { name: 'Cotton', tamilName: 'பருத்தி', icon: '⚪' },
  { name: 'Groundnut', tamilName: 'வேர்க்கடலை', icon: '🥜' },
  { name: 'Coconut', tamilName: 'தேங்காய்', icon: '🥥' },
  { name: 'Banana', tamilName: 'வாழை', icon: '🍌' },
  { name: 'Mango', tamilName: 'மாம்பழம்', icon: '🥭' },
  { name: 'Turmeric', tamilName: 'மஞ்சள்', icon: '🌿' },
  { name: 'Onion', tamilName: 'வெங்காயம்', icon: '🧅' },
  { name: 'Tomato', tamilName: 'தக்காளி', icon: '🍅' },
  { name: 'Potato', tamilName: 'உருளைக்கிழங்கு', icon: '🥔' },
  { name: 'Chilli', tamilName: 'மிளகாய்', icon: '🌶️' },
  { name: 'Pulses', tamilName: 'பருப்பு', icon: '🫘' },
  { name: 'Millets', tamilName: 'சிறுதானியங்கள்', icon: '🌾' },
  { name: 'Vegetables', tamilName: 'காய்கறிகள்', icon: '🥬' },
  { name: 'Coffee', tamilName: 'காபி', icon: '☕' },
  { name: 'Tea', tamilName: 'தேநீர்', icon: '🍵' },
  { name: 'Rubber', tamilName: 'ரப்பர்', icon: '🌳' },
];

/**
 * Get crop suggestions for a given location
 * @param location Location string (e.g., "Erode, Tamil Nadu")
 * @returns Array of crop suggestions
 */
export function getCropSuggestions(location: string): CropSuggestion[] {
  if (!location) {
    // Return major Indian crops when no location selected
    return COMMON_CROPS.slice(0, 10);
  }
  
  // Extract district name (first part before comma)
  const district = location.split(',')[0].trim();
  
  // Check if we have specific suggestions for this district
  if (DISTRICT_CROP_MAP[district]) {
    return DISTRICT_CROP_MAP[district];
  }
  
  // Fallback to common crops
  return COMMON_CROPS.slice(0, 10);
}

/**
 * Filter crops by search query
 * @param query Search query
 * @param suggestions Crop suggestions to filter
 * @returns Filtered crop suggestions
 */
export function filterCrops(query: string, suggestions: CropSuggestion[] = COMMON_CROPS): CropSuggestion[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return suggestions.filter(crop => 
    crop.name.toLowerCase().includes(lowerQuery)
  );
}
