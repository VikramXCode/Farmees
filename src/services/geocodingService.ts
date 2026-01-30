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

  const queryNominatim = async (params: Record<string, string>) => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    // Common required params
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Farmees/1.0 (contact: support@farmees.app)'
      }
    });

    if (!response.ok) {
      return [] as any[];
    }

    return response.json();
  };

  const parseResult = (item: any) => {
    const address = item?.address || {};

    const area = address.suburb ||
                 address.neighbourhood ||
                 address.locality ||
                 address.hamlet ||
                 address.quarter ||
                 '';

    const city = address.city ||
                 address.town ||
                 address.village ||
                 address.municipality ||
                 address.county ||
                 address.district ||
                 '';

    const state = address.state || address.region || address.province || '';

    // Build displayName avoiding duplicates
    let displayName = '';
    const parts: string[] = [];
    
    // Add area only if it's different from city
    if (area && area.toLowerCase() !== city.toLowerCase()) {
      parts.push(area);
    }
    
    // Add city
    if (city) {
      parts.push(city);
    }
    
    // Add state only if different from city
    if (state && state.toLowerCase() !== city.toLowerCase()) {
      parts.push(state);
    }
    
    displayName = parts.length > 0 ? parts.join(', ') : item.display_name;

    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      area,
      city,
      state,
      displayName
    };
  };

  try {
    // Primary lookup using postalcode param (most accurate)
    const primaryResults = await queryNominatim({
      postalcode: pincode,
      countrycodes: 'in',
      limit: '1'
    });

    if (primaryResults && primaryResults.length > 0) {
      return parseResult(primaryResults[0]);
    }

    // Fallback 1: Try with 'in' as country parameter instead of countrycodes
    const fallback1Results = await queryNominatim({
      postalcode: pincode,
      country: 'India',
      limit: '1'
    });

    if (fallback1Results && fallback1Results.length > 0) {
      return parseResult(fallback1Results[0]);
    }

    // Fallback 2: Broader search by query string (helps with pincodes missing postalcode index)
    const fallback2Results = await queryNominatim({
      q: `${pincode} India`,
      countrycodes: 'in',
      limit: '5'
    });

    if (fallback2Results && fallback2Results.length > 0) {
      // Find the best match (prefer results with postalcode in address)
      const bestMatch = fallback2Results.find((r: any) => 
        r.address?.postcode === pincode || 
        r.address?.postal_code === pincode
      ) || fallback2Results[0];
      
      return parseResult(bestMatch);
    }

    // Fallback 3: Try without countrycodes restriction
    const fallback3Results = await queryNominatim({
      postalcode: pincode,
      limit: '1'
    });

    if (fallback3Results && fallback3Results.length > 0) {
      return parseResult(fallback3Results[0]);
    }

    return null;
  } catch (error) {
    console.error('Pincode geocoding error:', error);
    return null;
  }
}
