import { useState, useEffect } from 'react';
import { MapPin, Compass, Filter, ChevronDown } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { getCurrentLocation, formatDistance, CUISINES, CULTURAL_ORIGINS } from '../lib/location';
import PostCard from './PostCard';

const RegionalPosts = ({ className = "" }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(50); // km
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [locationStatus, setLocationStatus] = useState('detecting'); // detecting, enabled, disabled, error

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadRegionalPosts();
    }
  }, [userLocation, maxDistance, selectedCuisine, selectedOrigin]);

  const detectLocation = async () => {
    setLocationStatus('detecting');
    try {
      const position = await getCurrentLocation();
      setUserLocation({
        latitude: position.latitude,
        longitude: position.longitude
      });
      setLocationStatus('enabled');
    } catch (error) {
      console.log('Could not detect location:', error.message);
      setLocationStatus('disabled');
      // Load posts without location filtering
      loadGeneralPosts();
    }
  };

  const loadRegionalPosts = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: userLocation.latitude.toString(),
        lng: userLocation.longitude.toString(),
        maxDistance: maxDistance.toString()
      });

      if (selectedCuisine) {
        params.append('cuisine', selectedCuisine);
      }
      if (selectedOrigin) {
        params.append('culturalOrigin', selectedOrigin);
      }

      const response = await axiosInstance.get(`/posts/location?${params.toString()}`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading regional posts:', error);
      // Fallback to general posts
      loadGeneralPosts();
    } finally {
      setLoading(false);
    }
  };

  const loadGeneralPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '12' });
      
      if (selectedCuisine) {
        params.append('cuisine', selectedCuisine);
      }
      if (selectedOrigin) {
        params.append('culturalOrigin', selectedOrigin);
      }

      const response = await axiosInstance.get(`/posts?${params.toString()}`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryLocation = () => {
    detectLocation();
  };

  if (locationStatus === 'detecting') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Detecting your location...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {locationStatus === 'enabled' ? (
              <MapPin className="h-5 w-5 text-green-600" />
            ) : (
              <Compass className="h-5 w-5 text-blue-600" />
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {locationStatus === 'enabled' ? 'Near You' : 'Discover'}
            </h2>
          </div>
          
          {locationStatus === 'enabled' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Within {maxDistance}km
            </span>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filters</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Location Status */}
      {locationStatus === 'disabled' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Location access disabled
              </p>
              <p className="text-xs text-yellow-700">
                Enable location to discover recipes and crafts near you
              </p>
            </div>
            <button
              onClick={retryLocation}
              className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-xs hover:bg-yellow-300"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locationStatus === 'enabled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance: {maxDistance}km
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine
              </label>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Cuisines</option>
                {CUISINES.map((cuisine) => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultural Origin
              </label>
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Origins</option>
                {CULTURAL_ORIGINS.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-video rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              showDistance={locationStatus === 'enabled' && userLocation}
              userLocation={userLocation}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {locationStatus === 'enabled' ? (
              <MapPin className="h-12 w-12 mx-auto" />
            ) : (
              <Compass className="h-12 w-12 mx-auto" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {locationStatus === 'enabled' 
              ? 'No posts found in your area' 
              : 'No posts found'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {locationStatus === 'enabled'
              ? 'Try increasing the distance or adjusting your filters'
              : 'Try adjusting your filters or create the first post!'
            }
          </p>
          {locationStatus === 'enabled' && (
            <button
              onClick={() => setMaxDistance(100)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Expand Search Area
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionalPosts;