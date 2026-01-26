/**
 * Geocoding service for India location autocomplete
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

import { INDIAN_LOCATIONS, searchIndianLocations } from '../data/indianLocations';

export interface LocationSuggestion {
  displayName: string; // "Erode, Tamil Nadu, India"
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Get location suggestions with online API and offline fallback
 * @param query Search query
 * @returns Promise of location suggestions
 */
export async function getLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) {
    // Return top 10 locations
    return INDIAN_LOCATIONS.slice(0, 10).map(loc => ({
      displayName: `${loc.name}, ${loc.state}`,
      city: loc.name,
      state: loc.state,
      country: 'India'
    }));
  }

  // Always use offline data first for reliability
  const offlineResults = searchIndianLocations(query);
  const offlineSuggestions = offlineResults.map(loc => ({
    displayName: `${loc.name}, ${loc.state}`,
    city: loc.name,
    state: loc.state,
    country: 'India'
  }));

  if (offlineSuggestions.length > 0) {
    return offlineSuggestions;
  }

  // If no offline results, try API as backup
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('countrycodes', 'in'); // India only
    url.searchParams.set('limit', '8');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Farmees/1.0'
      }
    });

    if (!response.ok) {
      return offlineSuggestions;
    }

    const data = await response.json();

    const suggestions: LocationSuggestion[] = data.map((item: any) => {
      const address = item.address || {};
      
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.municipality || 
                   address.county ||
                   address.state_district ||
                   '';
      
      const state = address.state || '';

      let displayName = '';
      if (city && state) {
        displayName = `${city}, ${state}`;
      } else if (city) {
        displayName = city;
      } else if (state) {
        displayName = state;
      } else {
        displayName = item.display_name;
      }

      return {
        displayName: displayName,
        city: city,
        state: state,
        country: 'India',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      };
    });

    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex((s) => s.displayName === suggestion.displayName)
    );

    return uniqueSuggestions.length > 0 ? uniqueSuggestions : offlineSuggestions;

  } catch (error) {
    console.error('Location autocomplete error:', error);
    return offlineSuggestions;
  }
}
