// Location and geolocation utilities

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unknown error occurred';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

export const geocodeAddress = async (address) => {
  // This would integrate with a geocoding service like Google Maps API
  // For now, return mock data
  return {
    latitude: 40.7128,
    longitude: -74.0060,
    city: "New York",
    state: "NY",
    country: "USA",
    displayLocation: address
  };
};

export const reverseGeocode = async (latitude, longitude) => {
  // This would integrate with a reverse geocoding service
  // For now, return mock data
  return {
    city: "New York",
    state: "NY",
    country: "USA",
    displayLocation: "New York, NY, USA"
  };
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

export const getLocationPermissionStatus = async () => {
  if (!navigator.permissions) {
    return 'unsupported';
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch (error) {
    return 'unsupported';
  }
};

// Common location options for forms
export const COMMON_LOCATIONS = {
  US: {
    'New York, NY': { city: 'New York', state: 'NY', country: 'USA' },
    'Los Angeles, CA': { city: 'Los Angeles', state: 'CA', country: 'USA' },
    'Chicago, IL': { city: 'Chicago', state: 'IL', country: 'USA' },
    'Houston, TX': { city: 'Houston', state: 'TX', country: 'USA' },
    'Miami, FL': { city: 'Miami', state: 'FL', country: 'USA' }
  },
  INTERNATIONAL: {
    'London, UK': { city: 'London', state: 'England', country: 'UK' },
    'Paris, France': { city: 'Paris', state: 'Ile-de-France', country: 'France' },
    'Tokyo, Japan': { city: 'Tokyo', state: 'Tokyo', country: 'Japan' },
    'Sydney, Australia': { city: 'Sydney', state: 'NSW', country: 'Australia' }
  }
};

export const CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai',
  'French', 'Mediterranean', 'American', 'Southern', 'BBQ',
  'Korean', 'Vietnamese', 'Greek', 'Spanish', 'Middle Eastern',
  'African', 'Caribbean', 'German', 'Russian', 'British'
];

export const CULTURAL_ORIGINS = [
  'Traditional', 'Family Recipe', 'Regional Specialty',
  'Holiday Special', 'Fusion', 'Modern Twist', 'Authentic',
  'Street Food', 'Fine Dining', 'Home Cooking'
];

export const VENDOR_TYPES = [
  { value: 'grocery', label: 'Grocery Store', icon: '🛒' },
  { value: 'farmers-market', label: 'Farmers Market', icon: '🥕' },
  { value: 'craft-store', label: 'Craft Store', icon: '🎨' },
  { value: 'hardware', label: 'Hardware Store', icon: '🔨' },
  { value: 'specialty-food', label: 'Specialty Food', icon: '🧀' },
  { value: 'bakery', label: 'Bakery', icon: '🥖' },
  { value: 'butcher', label: 'Butcher', icon: '🥩' },
  { value: 'other', label: 'Other', icon: '🏪' }
];

export const VENDOR_CATEGORIES = [
  { value: 'fresh-produce', label: 'Fresh Produce' },
  { value: 'organic', label: 'Organic' },
  { value: 'meat-seafood', label: 'Meat & Seafood' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'bakery', label: 'Bakery Items' },
  { value: 'craft-supplies', label: 'Craft Supplies' },
  { value: 'fabric', label: 'Fabric & Textiles' },
  { value: 'wood', label: 'Wood & Lumber' },
  { value: 'tools', label: 'Tools' },
  { value: 'paint', label: 'Paint & Finishes' },
  { value: 'ethnic-foods', label: 'Ethnic Foods' },
  { value: 'spices', label: 'Spices & Seasonings' },
  { value: 'specialty-ingredients', label: 'Specialty Ingredients' },
  { value: 'bulk-items', label: 'Bulk Items' }
];