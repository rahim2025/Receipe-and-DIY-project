// Geocoding utilities for backend
// This uses a free geocoding service to convert addresses to coordinates

import https from 'https';
import querystring from 'querystring';

/**
 * Geocode an address using Nominatim (OpenStreetMap) - Free geocoding service
 * @param {Object} address - Address object with street, city, state, country
 * @returns {Promise<Array>} [longitude, latitude] coordinates
 */
const geocodeAddress = async (address) => {
  return new Promise((resolve, reject) => {
    try {
      // Build address string
      const addressParts = [
        address.street,
        address.city,
        address.state,
        address.country
      ].filter(Boolean);
      
      if (addressParts.length === 0) {
        return reject(new Error('No address information provided'));
      }
      
      const addressString = addressParts.join(', ');
      console.log('Geocoding address:', addressString);
      
      // Use Nominatim (free OpenStreetMap geocoding service)
      const params = querystring.stringify({
        q: addressString,
        format: 'json',
        limit: 1,
        addressdetails: 1
      });
      
      const options = {
        hostname: 'nominatim.openstreetmap.org',
        path: `/search?${params}`,
        method: 'GET',
        headers: {
          'User-Agent': 'RecipeAndDIYProject/1.0 (contact@yourproject.com)' // Required by Nominatim
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const results = JSON.parse(data);
            
            if (results && results.length > 0) {
              const result = results[0];
              const longitude = parseFloat(result.lon);
              const latitude = parseFloat(result.lat);
              
              console.log(`Geocoded "${addressString}" to [${longitude}, ${latitude}]`);
              resolve([longitude, latitude]);
            } else {
              console.log(`No geocoding results found for: ${addressString}`);
              // Return null instead of throwing error - let the model validation handle it
              resolve(null);
            }
          } catch (parseError) {
            console.error('Error parsing geocoding response:', parseError);
            reject(new Error('Failed to parse geocoding response'));
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('Geocoding request error:', error);
        reject(new Error('Geocoding service unavailable'));
      });
      
      // Set timeout
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Geocoding request timeout'));
      });
      
      req.end();
      
    } catch (error) {
      console.error('Geocoding error:', error);
      reject(error);
    }
  });
};

/**
 * Fallback geocoding using approximate city coordinates
 * @param {Object} address - Address object
 * @returns {Array|null} [longitude, latitude] or null
 */
const getFallbackCoordinates = (address) => {
  // Common city coordinates as fallback
  const cityCoordinates = {
    // US Major Cities
    'new york': [-74.0060, 40.7128],
    'los angeles': [-118.2437, 34.0522],
    'chicago': [-87.6298, 41.8781],
    'houston': [-95.3698, 29.7604],
    'phoenix': [-112.0740, 33.4484],
    'philadelphia': [-75.1652, 39.9526],
    'san antonio': [-98.4936, 29.4241],
    'san diego': [-117.1611, 32.7157],
    'dallas': [-96.7970, 32.7767],
    'san francisco': [-122.4194, 37.7749],
    'austin': [-97.7431, 30.2672],
    'seattle': [-122.3321, 47.6062],
    'denver': [-104.9903, 39.7392],
    'boston': [-71.0589, 42.3601],
    'miami': [-80.1918, 25.7617],
    'atlanta': [-84.3880, 33.7490],
    'las vegas': [-115.1398, 36.1699],
    'portland': [-122.6765, 45.5152],
    
    // International
    'london': [-0.1276, 51.5074],
    'paris': [2.3522, 48.8566],
    'tokyo': [139.6917, 35.6895],
    'sydney': [151.2093, -33.8688],
    'toronto': [-79.3832, 43.6532],
    'vancouver': [-123.1207, 49.2827],
    'melbourne': [144.9631, -37.8136],
    'berlin': [13.4050, 52.5200],
    'amsterdam': [4.9041, 52.3676],
    'rome': [12.4964, 41.9028]
  };
  
  if (address.city) {
    const cityKey = address.city.toLowerCase();
    if (cityCoordinates[cityKey]) {
      console.log(`Using fallback coordinates for ${address.city}: ${cityCoordinates[cityKey]}`);
      return cityCoordinates[cityKey];
    }
  }
  
  return null;
};

/**
 * Geocode address with fallback options
 * @param {Object} address - Address object
 * @returns {Promise<Array>} [longitude, latitude] coordinates
 */
const geocodeWithFallback = async (address) => {
  try {
    console.log('Starting geocoding process for:', address);
    
    // Validate that we have minimum address information
    if (!address || (!address.city && !address.street)) {
      throw new Error('Address must contain at least a city or street name');
    }
    
    // First try proper geocoding
    const coordinates = await geocodeAddress(address);
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      console.log('Geocoding successful:', coordinates);
      return coordinates;
    }
    
    console.log('Geocoding failed, trying fallback...');
    
    // If geocoding fails, try fallback
    const fallbackCoords = getFallbackCoordinates(address);
    if (fallbackCoords) {
      console.log('Using fallback coordinates:', fallbackCoords);
      return fallbackCoords;
    }
    
    // If all fails, throw error with helpful message
    throw new Error(`Could not determine coordinates for address. Please provide at least a city name. Address provided: ${JSON.stringify(address)}`);
    
  } catch (error) {
    console.error('Geocoding with fallback failed:', error.message);
    throw error;
  }
};

export {
  geocodeAddress,
  getFallbackCoordinates,
  geocodeWithFallback
};