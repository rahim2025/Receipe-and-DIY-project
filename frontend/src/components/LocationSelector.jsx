import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { getCurrentLocation, getLocationPermissionStatus, COMMON_LOCATIONS } from '../lib/location';
import { geocodeAddress, searchPlaces, validateMapboxToken, reverseGeocode } from '../lib/mapbox';

const LocationSelector = ({ 
  onLocationChange, 
  initialLocation = null, 
  showManualEntry = true,
  showCurrentLocation = true,
  className = ""
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

  return (
<div className={`space-y-3 relative ${className}`}>
  {/* Header with subtle design */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 via-purple-500 to-fuchsia-500"></div>
      <label
        className="text-sm font-bold tracking-tight text-gray-800"
      >
        Location Filter
      </label>
      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
        Optional
      </span>
    </div>
    {location && (
      <button
        type="button"
        onClick={clearLocation}
        className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all hover:scale-105 `}
      >
        Clear
      </button>
    )}
  </div>

  {/* Current Location Display - Compact & Modern */}
{location && (
  <div
    className="group relative overflow-hidden rounded-2xl transition-all duration-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md"
  >
    {/* Decorative background pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}></div>
    </div>
    
    <div className="relative flex items-center gap-3 p-3.5">
      <div className="flex-shrink-0 p-2 rounded-xl bg-emerald-100">
        <MapPin className="h-5 w-5 text-emerald-600" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate text-gray-900">
          {location.displayLocation}
        </p>
        {location.isCurrentLocation && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-600"></div>
            <p className="text-xs font-medium text-emerald-700">
              Current Location
            </p>
          </div>
        )}
      </div>
      
      {/* Success checkmark */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-emerald-600">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  </div>
)}



  {/* Error Display - Modern Alert */}
  {error && (
    <div className="flex items-center gap-3 p-3 rounded-xl border-l-4 bg-red-50 border-red-500 text-red-800">
      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
      <p className="text-xs font-medium flex-1">{error}</p>
    </div>
  )}

  {/* Location Options - Smart Layout */}
  {!location && (
    <div className="space-y-2.5">
      {/* Current Location Button - Premium Design */}
      {showCurrentLocation && (
        <button
          type="button"
          onClick={detectCurrentLocation}
          disabled={isDetecting || permissionStatus === "denied"}
          className={`group w-full relative overflow-hidden rounded-xl font-semibold transition-all duration-300 ${
            isDetecting || permissionStatus === "denied"
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] shadow-md"
          }`}
        >
          {/* Animated background shimmer */}
          {!isDetecting && permissionStatus !== "denied" && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          )}
          
          <div className="relative flex items-center justify-center gap-2.5 px-5 py-3.5">
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
              isDetecting || permissionStatus === "denied"
                ? 'bg-gray-200'
                : 'bg-white/20 backdrop-blur-sm'
            }`}>
              {isDetecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </div>
            <span className="text-sm font-bold tracking-wide">
              {isDetecting ? "Detecting Location..." : "Use My Current Location"}
            </span>
          </div>
        </button>
      )}

      {/* Divider with "OR" */}
      {showCurrentLocation && showManualEntry && (
        <div className="relative flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs font-semibold text-gray-400">
            OR
          </span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
      )}

      {/* Manual Entry - Smart Search Box */}
      {showManualEntry && (
        <div className="relative z-10">
          {!showManualInput ? (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="group w-full relative overflow-hidden rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 border-2 border-violet-400 hover:border-violet-500 text-violet-900 hover:text-violet-950 shadow-md hover:shadow-lg"
            >
              <div className="relative flex items-center justify-center gap-2.5 px-5 py-3.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/30 text-violet-900 group-hover:bg-violet-500/40">
                  <Search className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold tracking-wide">
                  {isMapboxEnabled ? "Search by City or Address" : "Enter Location Manually"}
                </span>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl p-4 space-y-3 bg-gradient-to-br from-violet-200 via-purple-200 to-fuchsia-200 border-2 border-violet-300 shadow-xl">
              {/* Search Input with Icon */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="h-5 w-5 text-violet-400" />
                </div>
                <input
                  type="text"
                  value={manualAddress}
                  onChange={handleAddressInputChange}
                  placeholder={
                    isMapboxEnabled
                      ? "Type a city, state, or full address..."
                      : "Enter city, state or address..."
                  }
                  autoFocus
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl font-medium text-sm transition-all bg-violet-100/80 border-2 border-violet-300 focus:border-violet-500 focus:bg-violet-100 text-gray-900 placeholder-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-200"
                  onKeyPress={(e) => e.key === "Enter" && handleManualAddress()}
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleManualAddress}
                  disabled={isSearching || !manualAddress.trim()}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                    isSearching || !manualAddress.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isSearching ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    "Set Location"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualInput(false);
                    setManualAddress("");
                    setShowSuggestions(false);
                    setSearchSuggestions([]);
                    if (searchTimeout.current) clearTimeout(searchTimeout.current);
                  }}
                  className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300"
                >
                  Cancel
                </button>
              </div>
              
              {/* Suggestions Dropdown - Smart Design */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="rounded-xl overflow-hidden border-2 bg-gradient-to-br from-violet-800 via-purple-800 to-fuchsia-800 border-violet-500 shadow-2xl">
                  <div className="px-3 py-2 border-b text-xs font-bold bg-violet-900/70 text-white border-violet-600">
                    {searchSuggestions.length} {searchSuggestions.length === 1 ? 'Result' : 'Results'} Found
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id || index}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-3.5 py-3 flex items-start gap-3 transition-all border-b last:border-b-0 bg-violet-800/40 hover:bg-violet-700/60 active:bg-violet-700 border-violet-700"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-violet-900/40">
                          <MapPin className="h-4 w-4 text-violet-200" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-sm font-bold break-words text-white">
                            {suggestion.place_name}
                          </p>
                          {suggestion.city && (
                            <p className="text-xs mt-0.5 break-words text-violet-200">
                              {[suggestion.city, suggestion.state, suggestion.country]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )}

  {/* Permission Help - Informative Banner */}
  {permissionStatus === "denied" && showCurrentLocation && !location && (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border-l-4 bg-amber-50 border-amber-500 text-amber-900">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100">
        <AlertCircle className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold mb-1 text-amber-900">
          Location Access Denied
        </p>
        <p className="text-xs text-amber-700">
          Enable location permissions in your browser settings to use this feature.
        </p>
      </div>
    </div>
  )}
</div>

  );
};

export default LocationSelector;