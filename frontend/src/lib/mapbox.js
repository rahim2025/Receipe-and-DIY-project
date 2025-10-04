// Mapbox integration for map interactions and geocoding
// Mapbox API is free up to 50,000 requests per month

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.your-mapbox-token-here';

// Mapbox Geocoding API
export const geocodeAddress = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [longitude, latitude] = feature.center;
      
      return {
        latitude,
        longitude,
        displayLocation: feature.place_name,
        city: extractPlaceComponent(feature, 'place'),
        state: extractPlaceComponent(feature, 'region'),
        country: extractPlaceComponent(feature, 'country'),
        address: feature.place_name
      };
    } else {
      throw new Error('No results found');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
};

// Reverse geocoding - convert coordinates to address
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      
      return {
        displayLocation: feature.place_name,
        city: extractPlaceComponent(feature, 'place'),
        state: extractPlaceComponent(feature, 'region'),
        country: extractPlaceComponent(feature, 'country'),
        address: feature.place_name
      };
    } else {
      throw new Error('No address found for coordinates');
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error(`Failed to reverse geocode: ${error.message}`);
  }
};

// Extract specific place components from Mapbox response
const extractPlaceComponent = (feature, type) => {
  const context = feature.context || [];
  const component = context.find(item => item.id.startsWith(type));
  return component ? component.text : '';
};

// Search for places with autocomplete
export const searchPlaces = async (query, proximity = null) => {
  try {
    const encodedQuery = encodeURIComponent(query);
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5&types=place,locality,neighborhood,address`;
    
    // Add proximity bias if user location is available
    if (proximity && proximity.longitude && proximity.latitude) {
      url += `&proximity=${proximity.longitude},${proximity.latitude}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Place search failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.features.map(feature => ({
      id: feature.id,
      place_name: feature.place_name,
      center: feature.center,
      city: extractPlaceComponent(feature, 'place'),
      state: extractPlaceComponent(feature, 'region'),
      country: extractPlaceComponent(feature, 'country')
    }));
  } catch (error) {
    console.error('Place search error:', error);
    throw new Error(`Failed to search places: ${error.message}`);
  }
};

// Get map style URL for Mapbox GL JS
export const getMapStyleUrl = (style = 'streets-v11') => {
  return `mapbox://styles/mapbox/${style}`;
};

// Common map styles
export const MAP_STYLES = {
  STREETS: 'streets-v11',
  OUTDOORS: 'outdoors-v11',
  LIGHT: 'light-v10',
  DARK: 'dark-v10',
  SATELLITE: 'satellite-v9',
  SATELLITE_STREETS: 'satellite-streets-v11'
};

// Mapbox GL JS configuration
export const mapboxConfig = {
  accessToken: MAPBOX_ACCESS_TOKEN,
  style: getMapStyleUrl(MAP_STYLES.STREETS),
  center: [-74.006, 40.7128], // Default to NYC
  zoom: 12,
  attributionControl: true
};

// Validate Mapbox token
export const validateMapboxToken = () => {
  if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'pk.your-mapbox-token-here') {
    console.warn('⚠️ Mapbox access token not configured. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file');
    console.warn('Get your free token at: https://account.mapbox.com/access-tokens/');
    return false;
  }
  return true;
};

// Export the access token for direct use
export { MAPBOX_ACCESS_TOKEN };