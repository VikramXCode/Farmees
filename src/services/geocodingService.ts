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

/**
 * Geocode a pincode to get coordinates and location details
 * @param pincode Indian postal code (6 digits)
 * @returns Promise of location details or null if not found
 */
export async function geocodePincode(pincode: string): Promise<{
  lat: number;
  lng: number;
  area?: string;
  city?: string;
  state?: string;
  displayName: string;
} | null> {
  if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
    return null;
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('postalcode', pincode);
    url.searchParams.set('country', 'India');
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Farmees/1.0'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const item = data[0];
      const address = item.address || {};
      
      // Extract area/locality/suburb (specific area name under the pincode)
      const area = address.suburb ||
                   address.neighbourhood ||
                   address.locality ||
                   address.hamlet ||
                   address.quarter ||
                   '';
      
      // Extract city/town/village
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.municipality || 
                   address.county ||
                   address.state_district ||
                   '';
      
      const state = address.state || '';
      
      // Build displayName with area name first if available
      let displayName = '';
      if (area && city && state) {
        displayName = `${area}, ${city}, ${state}`;
      } else if (area && state) {
        displayName = `${area}, ${state}`;
      } else if (city && state) {
        displayName = `${city}, ${state}`;
      } else if (area) {
        displayName = area;
      } else if (city) {
        displayName = city;
      } else if (state) {
        displayName = state;
      } else {
        displayName = item.display_name;
      }
      
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        area,
        city,
        state,
        displayName
      };
    }

    return null;
  } catch (error) {
    console.error('Pincode geocoding error:', error);
    return null;
  }
}
