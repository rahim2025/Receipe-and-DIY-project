import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { getCurrentLocation, getLocationPermissionStatus, COMMON_LOCATIONS } from '../lib/location';
import { geocodeAddress, searchPlaces, validateMapboxToken, reverseGeocode } from '../lib/mapbox';

const LocationSelector = ({ 
  onLocationChange, 
  initialLocation = null, 
  showManualEntry = true,
  showCurrentLocation = true,
  className = "",
  forceLightTheme = true // ensures readable dark text on light / white panels
}) => {
  const [location, setLocation] = useState(initialLocation);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef(null);
  const [isMapboxEnabled, setIsMapboxEnabled] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
    setIsMapboxEnabled(validateMapboxToken());
  }, []);

  const checkPermissionStatus = async () => {
    const status = await getLocationPermissionStatus();
    setPermissionStatus(status);
  };

  const detectCurrentLocation = async () => {
    setIsDetecting(true);
    setError('');
    
    try {
      const position = await getCurrentLocation();
      let address;
      
      // Try Mapbox reverse geocoding if available
      if (isMapboxEnabled) {
        try {
          address = await reverseGeocode(position.latitude, position.longitude);
        } catch (mapboxError) {
          console.warn('Mapbox reverse geocoding failed, using coordinates only:', mapboxError);
          // Fallback to coordinates only
          address = {
            displayLocation: `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`,
            city: '',
            state: '',
            country: ''
          };
        }
      } else {
        // No Mapbox token, use coordinates
        address = {
          displayLocation: `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`,
          city: '',
          state: '',
          country: ''
        };
      }
      
      const locationData = {
        coordinates: [position.longitude, position.latitude],
        city: address.city || '',
        state: address.state || '',
        country: address.country || '',
        displayLocation: address.displayLocation,
        isCurrentLocation: true
      };
      
      setLocation(locationData);
      onLocationChange(locationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDetecting(false);
    }
  };

  const selectCommonLocation = (locationKey, locationData) => {
    const locationObj = {
      city: locationData.city,
      state: locationData.state,
      country: locationData.country,
      displayLocation: locationKey,
      isCurrentLocation: false
    };
    
    setLocation(locationObj);
    onLocationChange(locationObj);
    setShowDropdown(false);
  };

  const handleManualAddress = async () => {
    if (!manualAddress.trim()) return;

    const address = manualAddress.trim();
    setIsSearching(true);
    setError('');

    try {
      // Try Mapbox geocoding first if available
      if (isMapboxEnabled) {
        const geocoded = await geocodeAddress(address);
        const locationObj = {
          coordinates: [geocoded.longitude, geocoded.latitude],
          city: geocoded.city,
          state: geocoded.state,
          country: geocoded.country,
          displayLocation: geocoded.displayLocation,
          isCurrentLocation: false,
          isMapboxGeocoded: true
        };
        
        setLocation(locationObj);
        onLocationChange(locationObj);
      } else {
        // Fallback to manual entry
        const locationObj = {
          displayLocation: address,
          isCurrentLocation: false,
          isManualEntry: true
        };
        
        setLocation(locationObj);
        onLocationChange(locationObj);
      }
      
      setShowManualInput(false);
      setManualAddress('');
      setShowSuggestions(false);
    } catch (err) {
      console.error('Geocoding error:', err);
      // Fallback to manual entry on error
      const locationObj = {
        displayLocation: address,
        isCurrentLocation: false,
        isManualEntry: true
      };
      
      setLocation(locationObj);
      onLocationChange(locationObj);
      setShowManualInput(false);
      setManualAddress('');
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Search for places with Mapbox
  const searchForPlaces = async (query) => {
    if (!query.trim() || !isMapboxEnabled) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const currentLoc = location?.coordinates 
        ? { longitude: location.coordinates[0], latitude: location.coordinates[1] }
        : null;
      
      const places = await searchPlaces(query, currentLoc);
      setSearchSuggestions(places);
      setShowSuggestions(places.length > 0);
    } catch (error) {
      console.error('Place search error:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle address input change with debounced search
  const handleAddressInputChange = (e) => {
    const value = e.target.value;
    setManualAddress(value);

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce search
    if (value.trim() && isMapboxEnabled) {
      searchTimeout.current = setTimeout(() => {
        searchForPlaces(value);
      }, 300);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select suggestion
  const selectSuggestion = (suggestion) => {
    const locationObj = {
      coordinates: suggestion.center,
      city: suggestion.city,
      state: suggestion.state,
      country: suggestion.country,
      displayLocation: suggestion.place_name,
      isCurrentLocation: false,
      isMapboxGeocoded: true
    };

    setLocation(locationObj);
    onLocationChange(locationObj);
    setShowManualInput(false);
    setManualAddress('');
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  const clearLocation = () => {
    setLocation(null);
    onLocationChange(null);
    setError('');
  };

  const lightTextClasses = forceLightTheme ? 'text-gray-800' : '';
  const lightInputClasses = forceLightTheme ? 'bg-white text-gray-900 placeholder-gray-400' : '';
  const lightButtonText = forceLightTheme ? 'text-gray-700' : '';

  return (
    <div className={`space-y-3 ${lightTextClasses} ${className}`}>
      <div className="flex items-center justify-between">
        <label className={`block text-sm font-medium ${forceLightTheme ? 'text-gray-700' : 'text-gray-100'}`}>
          Location (Optional)
        </label>
        {location && (
          <button
            type="button"
            onClick={clearLocation}
            className={`text-xs ${forceLightTheme ? 'text-red-600 hover:text-red-700' : 'text-red-300 hover:text-red-200'}`}
          >
            Clear
          </button>
        )}
      </div>

      {/* Current Location Display */}
      {location && (
        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <MapPin className="h-4 w-4 text-green-600 mr-2" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              {location.displayLocation}
            </p>
            {location.isCurrentLocation && (
              <p className="text-xs text-green-600">Current location detected</p>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Location Options */}
      {!location && (
        <div className="space-y-2">
          {/* Current Location Button */}
          {showCurrentLocation && (
            <button
              type="button"
              onClick={detectCurrentLocation}
              disabled={isDetecting || permissionStatus === 'denied'}
              className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg ${lightButtonText} bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isDetecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {isDetecting ? 'Detecting...' : 'Use Current Location'}
            </button>
          )}

          {/* Common Locations Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 ${lightButtonText}`}
            >
              <span className="text-sm font-medium">Choose from common locations</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto text-gray-700">
                <div className="p-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    US Cities
                  </h4>
                  {Object.entries(COMMON_LOCATIONS.US).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectCommonLocation(key, value)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700"
                    >
                      {key}
                    </button>
                  ))}
                </div>
                
                <div className="border-t border-gray-100 p-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    International
                  </h4>
                  {Object.entries(COMMON_LOCATIONS.INTERNATIONAL).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectCommonLocation(key, value)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry with Mapbox Search */}
          {showManualEntry && (
            <div className="relative">
              {!showManualInput ? (
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm ${lightButtonText}`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isMapboxEnabled ? 'Search for location' : 'Enter location manually'}
                </button>
              ) : (
                <div>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={handleAddressInputChange}
                        placeholder={isMapboxEnabled ? "Search for city, state or address..." : "Enter city, state or address"}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 ${lightInputClasses}`}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualAddress()}
                        autoComplete="off"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleManualAddress}
                      disabled={isSearching || !manualAddress.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualInput(false);
                        setManualAddress('');
                        setShowSuggestions(false);
                        setSearchSuggestions([]);
                        if (searchTimeout.current) {
                          clearTimeout(searchTimeout.current);
                        }
                      }}
                      className={`px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 ${lightButtonText}`}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Search Suggestions */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto text-gray-700">
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id || index}
                          type="button"
                          onClick={() => selectSuggestion(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start text-gray-700"
                        >
                          <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.place_name}
                            </p>
                            {suggestion.city && (
                              <p className="text-xs text-gray-500">
                                {[suggestion.city, suggestion.state, suggestion.country].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Permission Help */}
      {permissionStatus === 'denied' && showCurrentLocation && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            Location access is disabled. Enable it in your browser settings to use current location.
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;