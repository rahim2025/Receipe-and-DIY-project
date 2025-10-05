import { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Store, Clock, Phone, ExternalLink, Plus, Heart, Star, Navigation, Map, Calendar, CheckCircle, XCircle, Package, DollarSign, Sparkles, TrendingUp, MessageSquare, Mail, Flag } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { getCurrentLocation, formatDistance, calculateDistance, VENDOR_TYPES, VENDOR_CATEGORIES } from '../lib/location';
import { useAuthStore } from '../store/useAuthStore';
import LocationSelector from '../components/LocationSelector';
import MapboxMap from '../components/MapboxMap';
import VendorErrorBoundary from '../components/VendorErrorBoundary';
import VendorItems from '../components/VendorItems';
import VendorReviews from '../components/VendorReviews';
import VendorReportModal from '../components/VendorReportModal';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const VendorsPage = () => {
  const { authUser } = useAuthStore();
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(25); // km
  const [showFilters, setShowFilters] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [selectedVendorForItems, setSelectedVendorForItems] = useState(null);
  const [selectedVendorForReviews, setSelectedVendorForReviews] = useState(null);
  const [selectedVendorForReport, setSelectedVendorForReport] = useState(null);
  const [newVendor, setNewVendor] = useState({
    name: '',
    type: '',
    categories: [],
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    contact: {
      phone: '',
      website: '',
      email: ''
    },
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: false }
    }
  });

  useEffect(() => {
    loadVendors();
    detectUserLocation();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm, selectedCategory, selectedType, userLocation, maxDistance]);

  // Reload vendors when location changes
  useEffect(() => {
    if (userLocation && (userLocation.latitude || userLocation.isManualEntry)) {
      loadVendors();
    }
  }, [userLocation, maxDistance]);

  const detectUserLocation = async () => {
    try {
      const position = await getCurrentLocation();
      setUserLocation({
        latitude: position.latitude,
        longitude: position.longitude
      });
    } catch (error) {
      console.log('Could not get user location:', error.message);
    }
  };

  const handleLocationChange = (location) => {
    if (location && location.coordinates) {
      // Convert location to the format expected by userLocation
      const formattedLocation = {
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
        city: location.city,
        state: location.state,
        country: location.country,
        displayLocation: location.displayLocation
      };
      setUserLocation(formattedLocation);
    } else if (location && location.displayLocation) {
      // For manual entries without coordinates, we'll need to use the city/state for filtering
      setUserLocation({
        displayLocation: location.displayLocation,
        city: location.city,
        state: location.state,
        country: location.country,
        isManualEntry: true
      });
    } else {
      setUserLocation(null);
    }
  };

  const loadVendors = async () => {
    setLoading(true);
    try {
  // Backend vendor router is mounted at /api/vendors
  let endpoint = '/api/vendors';
      const params = new URLSearchParams();
      
      // Only add location parameters if we have coordinates
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        params.append('lat', userLocation.latitude);
        params.append('lng', userLocation.longitude);
        params.append('maxDistance', maxDistance * 1000); // Convert km to meters
      }
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const response = await axiosInstance.get(endpoint);
      setVendors(response.data.vendors || response.data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    let filtered = vendors;

    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.address.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(vendor =>
        vendor.categories.includes(selectedCategory)
      );
    }

    if (selectedType) {
      filtered = filtered.filter(vendor =>
        vendor.type === selectedType
      );
    }

    setFilteredVendors(filtered);
  };

  const addVendor = async () => {
    try {
      console.log('Sending vendor data:', newVendor); // Debug log
  const response = await axiosInstance.post('/api/vendors', newVendor);
      console.log('Vendor created successfully:', response.data); // Debug log
      
      toast.success('Vendor added successfully!');
      setShowAddVendor(false);
      setNewVendor({
        name: '',
        type: '',
        categories: [],
        description: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        contact: {
          phone: '',
          website: '',
          email: ''
        },
        businessHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: false }
        }
      });
      loadVendors();
    } catch (error) {
      console.error('Error adding vendor:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 'Failed to add vendor. Please try again.';
      toast.error(errorMessage);
    }
  };

  const toggleFollowVendor = async (vendorId) => {
    try {
  await axiosInstance.post(`/api/vendors/${vendorId}/follow`);
      loadVendors();
    } catch (error) {
      console.error('Error following vendor:', error);
    }
  };

  const formatBusinessHours = (hours) => {
    if (!hours || !Array.isArray(hours)) {
      return 'Hours not available';
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = hours.find(h => h.day === today);
    
    if (!todayHours) {
      return 'Hours not available';
    }
    
    if (todayHours.closed) {
      return 'Closed today';
    }
    
    if (!todayHours.open || !todayHours.close) {
      return 'Hours not available';
    }
    
    return `${todayHours.open} - ${todayHours.close}`;
  };

  const isOpenNow = (hours) => {
    if (!hours || !Array.isArray(hours)) {
      return false;
    }

    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = hours.find(h => h.day === today);
    
    if (!todayHours || todayHours.closed || !todayHours.open || !todayHours.close) {
      return false;
    }
    
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const openTime = parseInt(todayHours.open.replace(':', ''));
    const closeTime = parseInt(todayHours.close.replace(':', ''));
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const VendorCard = ({ vendor }) => {
    // Safety check for vendor data
    if (!vendor) {
      return <div className="glass-panel p-6">Invalid vendor data</div>;
    }

    // Additional safety checks for critical properties
    const safeVendor = {
      ...vendor,
      name: vendor.name || 'Unknown Vendor',
      type: vendor.type || 'other',
      description: vendor.description || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      website: vendor.website || '',
      address: vendor.address || { street: '', city: '', state: '', coordinates: null },
      hours: Array.isArray(vendor.hours) ? vendor.hours : [],
      categories: Array.isArray(vendor.categories) ? vendor.categories : [],
      followers: Array.isArray(vendor.followers) ? vendor.followers : []
    };

  const actionButtonClasses = "glass-post-interaction flex items-center justify-center gap-1 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap rounded-lg min-w-[68px]";
  const primaryActionButtonClasses = `${actionButtonClasses} bg-gradient-to-r from-teal-400/60 to-violet-500/60 border border-white/30 text-white`;

    return (
      <div className="glass-post-card group glass-fade-in">
        <div className="glass-post-content p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="glass-post-title text-xl mb-0 font-['Poppins']">{safeVendor.name}</h3>
                {isOpenNow(safeVendor.hours) ? (
                  <span className="glass-badge glass-badge-teal text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Open
                  </span>
                ) : (
                  <span className="glass-badge text-xs">
                    <XCircle className="w-3 h-3" />
                    Closed
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                <Store className="h-4 w-4" />
                <span>{VENDOR_TYPES.find(t => t.value === safeVendor.type)?.label || safeVendor.type}</span>
              </div>
            </div>
            
            {authUser && (
              <button
                onClick={() => toggleFollowVendor(safeVendor._id)}
                className={`glass-post-interaction w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 ${
                  safeVendor.followers?.includes(authUser._id) ? 'text-red-400' : 'text-white/70'
                }`}
              >
                <Heart className={`w-5 h-5 ${
                  safeVendor.followers?.includes(authUser._id) ? 'fill-current' : ''
                }`} />
              </button>
            )}
          </div>

          {safeVendor.description && (
            <p className="glass-post-description text-sm mb-4 leading-relaxed">{safeVendor.description}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{safeVendor.address.street}, {safeVendor.address.city}, {safeVendor.address.state}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
            <Clock className="h-4 w-4" />
            <span>{formatBusinessHours(safeVendor.hours)}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {safeVendor.categories.slice(0, 3).map((category) => (
              <span key={category} className="glass-post-badge text-xs">
                {VENDOR_CATEGORIES.find(c => c.value === category)?.label || category}
              </span>
            ))}
            {safeVendor.categories.length > 3 && (
              <span className="glass-post-badge text-xs">
                +{safeVendor.categories.length - 3}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-white/80 font-medium">
                {safeVendor.rating ? safeVendor.rating.toFixed(1) : 'New'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-white/60" />
              <span className="text-xs text-white/60">
                {safeVendor.followers?.length || 0} followers
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-post-actions">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
              <button
                onClick={() => setSelectedVendorForItems(safeVendor)}
                className={actionButtonClasses}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Items</span>
              </button>
              
              <button
                onClick={() => setSelectedVendorForReviews(safeVendor)}
                className={actionButtonClasses}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reviews ({safeVendor.reviewCount || 0})</span>
              </button>
              
              {safeVendor.phone && (
                <a
                  href={`tel:${safeVendor.phone}`}
                  className={actionButtonClasses}
                >
                  <Phone className="w-3 h-3" />
                  <span>Call</span>
                </a>
              )}
              {safeVendor.email && (
                <a
                  href={`mailto:${safeVendor.email}`}
                  className={actionButtonClasses}
                >
                  <Mail className="w-3 h-3" />
                  <span>Email</span>
                </a>
              )}
              {authUser && (
                <button
                  onClick={() => setSelectedVendorForReport(safeVendor)}
                  className={`${actionButtonClasses} text-orange-300 hover:text-orange-200`}
                  title="Report this vendor"
                >
                  <Flag className="w-3 h-3" />
                  <span>Report</span>
                </button>
              )}
            </div>
            
            {safeVendor.website && (
              <a
                href={safeVendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className={`${primaryActionButtonClasses} ml-auto`}
              >
                <ExternalLink className="w-3 h-3" />
                Visit
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-40 pb-8">
      {/* Floating Action Button */}
      {authUser && (
        <button
          onClick={() => setShowAddVendor(true)}
          className="glass-fab"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Hero Section with Search */}
        <div className="mb-8 glass-fade-in">
          <div className="glass-panel p-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-['Poppins']">
              Discover Local
              <span className="bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent ml-3">
                Vendors & Stores
              </span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto font-light">
              Find local stores for ingredients, craft supplies, and specialty items near you
            </p>
            
            {/* Search Bar */}
            <form 
  onSubmit={(e) => e.preventDefault()} 
  className="relative max-w-lg mx-auto flex items-center 
             backdrop-blur-lg bg-white/10 border border-white/20 
             rounded-full shadow-md transition-all duration-300 
             focus-within:shadow-lg hover:shadow-lg px-4"
>
  {/* Left Search Icon */}
  <span className="absolute left-5 text-gray-300">
    <Search className="w-5 h-5" />
  </span>

  {/* Input */}
  <input
    type="text"
    placeholder="Search vendors, stores..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full pl-12 pr-16 py-3 bg-transparent text-white
               placeholder-white focus:outline-none font-medium"
  />

  {/* Map Toggle Button */}
  <button
    type="button"
    onClick={() => setShowMapView(!showMapView)}
    className="absolute right-2 p-2 rounded-full 
               bg-gradient-to-r from-teal-400 to-violet-500 
               hover:opacity-90 transition-all duration-300 shadow-md"
  >
    <Map className="w-4 h-4 text-white" />
  </button>
</form>

            
            <div className="mt-6">
              <Link 
                to="/price-comparison"
                className="glass-btn text-sm px-4 py-2 text-white/90 hover:text-white font-medium"
              >
                <DollarSign className="w-4 h-4" />
                Compare Prices
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* Filters */}
              <div className="glass-sidebar p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-semibold text-white font-['Poppins']">Filters</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      Vendor Type
                    </h4>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="glass-input"
                    >
                      <option value="">All Types</option>
                      {VENDOR_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                      Category
                    </h4>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="glass-input"
                    >
                      <option value="">All Categories</option>
                      {VENDOR_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Location
                    </h4>
                    <div className="glass-panel p-4">
                      <LocationSelector
                        onLocationChange={handleLocationChange}
                        initialLocation={userLocation}
                        showCurrentLocation={true}
                        showManualEntry={true}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      Distance: {maxDistance}km
                    </h4>
                    <div className="glass-panel p-4">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${maxDistance}%, rgba(255,255,255,0.2) ${maxDistance}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                      <div className="text-center text-sm text-white/80 mt-3">
                        1km - {maxDistance}km
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-sidebar p-6 rounded-2xl shadow-xl border border-white/20">
  {/* Header */}
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 bg-gradient-to-tr from-teal-400 via-indigo-400 to-violet-400 rounded-xl flex items-center justify-center shadow-md">
      <Sparkles className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-lg font-semibold text-white tracking-wide font-['Poppins']">
      Quick Actions
    </h3>
  </div>

  {/* Actions */}
  <div className="space-y-4">
    <button
      onClick={() => setShowMapView(!showMapView)}
      className={`flex items-center gap-2 px-4 py-3 w-full rounded-xl transition-all duration-200
        ${showMapView 
          ? "bg-gradient-to-r from-teal-400 to-violet-500 text-white shadow-md" 
          : "glass-btn hover:bg-white/10 text-white/90"}`
      }
    >
      <Map className="w-5 h-5" />
      <span className="font-medium">
        {showMapView ? "List View" : "Map View"}
      </span>
    </button>

    {authUser && (
      <button
        onClick={() => setShowAddVendor(true)}
        className="flex items-center gap-2 px-4 py-3 w-full rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Plus className="w-5 h-5" />
        <span>Add Vendor</span>
      </button>
    )}
  </div>
</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Vendor Section */}
            {filteredVendors.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-teal-400" />
                  <h2 className="text-2xl font-bold text-white font-['Poppins']">Featured Vendor</h2>
                </div>
                
                <div className="glass-featured glass-hover-lift">
                  <div className="p-8">
                    <h3 className="text-3xl font-bold text-white mb-4 font-['Poppins']">
                      {filteredVendors[0]?.name || "Featured Vendor"}
                    </h3>
                    <p className="text-white/80 mb-6 text-lg leading-relaxed">
                      {filteredVendors[0]?.description || "Discover amazing local vendors in your area!"}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="glass-badge glass-badge-teal">
                        <Store className="w-4 h-4" />
                        {VENDOR_TYPES.find(t => t.value === filteredVendors[0]?.type)?.label || 'Local Store'}
                      </div>
                      
                      {filteredVendors[0]?.address && (
                        <div className="glass-badge glass-badge-violet">
                          <MapPin className="w-4 h-4" />
                          {filteredVendors[0].address.city}
                        </div>
                      )}
                      
                      {userLocation && filteredVendors[0]?.address?.coordinates && (
                        <div className="glass-badge glass-badge-blue">
                          <Navigation className="w-4 h-4" />
                          {formatDistance(calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            filteredVendors[0].address.coordinates[1],
                            filteredVendors[0].address.coordinates[0]
                          ))} away
                        </div>
                      )}
                      
                      <div className="glass-badge">
                        <Heart className="w-4 h-4" />
                        {filteredVendors[0]?.followers?.length || 0} followers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Grid */}
            {loading ? (
              <div className="glass-panel p-12 text-center">
                <div className="glass-loading mx-auto mb-6"></div>
                <h3 className="text-lg font-semibold text-white mb-2">Loading amazing vendors...</h3>
                <p className="text-white/70">Discovering local stores and suppliers for you</p>
              </div>
            ) : showMapView ? (
          /* Map View */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {userLocation && userLocation.displayLocation ? 
                    `Vendors near ${userLocation.displayLocation}` : 
                    'All Vendors'
                  } ({filteredVendors.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {userLocation && userLocation.displayLocation ?
                    `Showing vendors within ${maxDistance}km of your selected location. Click markers for details.` :
                    'Click on markers to view vendor details. Use location filter to find vendors near you.'
                  }
                </p>
              </div>
              
              <div className="relative">
                <MapboxMap
                  vendors={filteredVendors}
                  userLocation={userLocation}
                  center={userLocation && userLocation.longitude && userLocation.latitude ? 
                    [userLocation.longitude, userLocation.latitude] : 
                    filteredVendors.length > 0 && filteredVendors[0].address?.coordinates ?
                    filteredVendors[0].address.coordinates : 
                    undefined
                  }
                  height="500px"
                  onVendorClick={(vendor) => {
                    // Scroll to vendor in list or show details
                    toast.success(`Selected: ${vendor.name}`);
                  }}
                />
              </div>
            </div>
            
            {/* Vendor List below map for easy reference */}
            {filteredVendors.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Vendor Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVendors.slice(0, 6).map((vendor) => (
                    <VendorErrorBoundary key={vendor._id}>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h5 className="font-medium text-gray-900">{vendor.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{vendor.description}</p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          {vendor.phone && (
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {vendor.phone}
                            </span>
                          )}
                          {userLocation && vendor.address?.coordinates && (
                            <span className="flex items-center">
                              <Navigation className="h-3 w-3 mr-1" />
                              {formatDistance(calculateDistance(
                                userLocation.latitude,
                                userLocation.longitude,
                                vendor.address.coordinates[1],
                                vendor.address.coordinates[0]
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </VendorErrorBoundary>
                  ))}
                </div>
                {filteredVendors.length > 6 && (
                  <p className="text-sm text-gray-600 text-center">
                    ...and {filteredVendors.length - 6} more vendors. Switch to list view to see all.
                  </p>
                )}
              </div>
            )}
            
            {filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory || selectedType
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to add a vendor in your area'}
                </p>
              </div>
            )}
          </div>
            ) : showMapView ? (
              /* Map View */
              <div className="glass-panel overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-xl font-bold text-white font-['Poppins'] mb-2">
                    {userLocation && userLocation.displayLocation ? 
                      `Vendors near ${userLocation.displayLocation}` : 
                      'All Vendors'
                    } ({filteredVendors.length})
                  </h3>
                  <p className="text-white/70">
                    {userLocation && userLocation.displayLocation ?
                      `Showing vendors within ${maxDistance}km of your selected location` :
                      'Click on markers to view vendor details'
                    }
                  </p>
                </div>
                
                <div className="relative">
                  <MapboxMap
                    vendors={filteredVendors}
                    userLocation={userLocation}
                    center={userLocation && userLocation.longitude && userLocation.latitude ? 
                      [userLocation.longitude, userLocation.latitude] : 
                      filteredVendors.length > 0 && filteredVendors[0].address?.coordinates ?
                      filteredVendors[0].address.coordinates : 
                      undefined
                    }
                    height="500px"
                    onVendorClick={(vendor) => {
                      toast.success(`Selected: ${vendor.name}`);
                    }}
                  />
                </div>
              </div>
            ) : (
              /* List View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor, index) => (
                    <VendorErrorBoundary key={vendor._id}>
                      <div style={{ animationDelay: `${index * 0.1}s` }}>
                        <VendorCard vendor={vendor} />
                      </div>
                    </VendorErrorBoundary>
                  ))
                ) : (
                  <div className="col-span-full glass-panel p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-violet-400 rounded-full flex items-center justify-center">
                      <Store className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 font-['Poppins']">No Vendors Found</h3>
                    <p className="text-white/80 mb-6 text-lg max-w-md mx-auto">
                      {searchTerm || selectedCategory || selectedType
                        ? 'Try adjusting your search or filters to find more vendors'
                        : 'Be the first to add a vendor in your area!'}
                    </p>
                    {authUser && (
                      <button 
                        onClick={() => setShowAddVendor(true)}
                        className="glass-btn-primary text-lg px-8 py-4"
                      >
                        <Plus className="w-5 h-5" />
                        Add First Vendor
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Vendor Modal */}
        {showAddVendor && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40 border-2 border-white/20 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden relative">
              {/* Close Button */}
              <button
                onClick={() => setShowAddVendor(false)}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full backdrop-blur-lg bg-white/10 border border-white/20 hover:bg-white/20 hover:rotate-90 transition-all duration-300 flex items-center justify-center group"
                aria-label="Close modal"
              >
                <XCircle className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
              </button>

              <div className="p-8 overflow-y-auto max-h-[90vh]">
                <h2 className="text-3xl font-bold text-white mb-6 font-['Poppins'] flex items-center gap-3 pr-12">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center shadow-lg">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  Add New Vendor
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                      className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/50 transition-all"
                      placeholder="Enter vendor name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                      Type *
                    </label>
                    <select
                      value={newVendor.type}
                      onChange={(e) => setNewVendor({...newVendor, type: e.target.value})}
                      className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/50 transition-all"
                    >
                      <option value="" className="bg-gray-900">Select type</option>
                      {VENDOR_TYPES.map((type) => (
                        <option key={type.value} value={type.value} className="bg-gray-900">
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      Description
                    </label>
                    <textarea
                      value={newVendor.description}
                      onChange={(e) => setNewVendor({...newVendor, description: e.target.value})}
                      className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all resize-none"
                      rows="3"
                      placeholder="Describe what this vendor offers"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={newVendor.address.street}
                        onChange={(e) => setNewVendor({
                          ...newVendor,
                          address: {...newVendor.address, street: e.target.value}
                        })}
                        className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                        placeholder="Street address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        City *
                      </label>
                      <input
                        type="text"
                        value={newVendor.address.city}
                        onChange={(e) => setNewVendor({
                          ...newVendor,
                          address: {...newVendor.address, city: e.target.value}
                        })}
                        className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                        placeholder="City"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        State *
                      </label>
                      <input
                        type="text"
                        value={newVendor.address.state}
                        onChange={(e) => setNewVendor({
                          ...newVendor,
                          address: {...newVendor.address, state: e.target.value}
                        })}
                        className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                        placeholder="State"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        Country *
                      </label>
                      <input
                        type="text"
                        value={newVendor.address.country}
                        onChange={(e) => setNewVendor({
                          ...newVendor,
                          address: {...newVendor.address, country: e.target.value}
                        })}
                        className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                        placeholder="Country"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={newVendor.address.zipCode}
                        onChange={(e) => setNewVendor({
                          ...newVendor,
                          address: {...newVendor.address, zipCode: e.target.value}
                        })}
                        className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                        placeholder="Zip code"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={newVendor.contact.phone}
                        onChange={(e) => setNewVendor({
                          ...newVendor,
                          contact: {...newVendor.contact, phone: e.target.value}
                        })}
                        className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all"
                        placeholder="Phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        Website
                      </label>
                      <input
                        type="url"
                        value={newVendor.contact.website}
                        onChange={(e) => setNewVendor({
                          ...newVendor,
                          contact: {...newVendor.contact, website: e.target.value}
                        })}
                        className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  
                  {/* Business Hours Section */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-white/90 mb-3 gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      Business Hours
                    </label>
                    <div className="space-y-3 backdrop-blur-lg bg-white/5 border border-white/10 p-5 rounded-2xl">
                      {Object.entries(newVendor.businessHours).map(([day, schedule]) => (
                        <div key={day} className="flex items-center space-x-3 p-3 rounded-xl backdrop-blur-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                          <div className="w-24 text-sm font-medium text-white capitalize flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-teal-400" />
                            {day}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setNewVendor({
                                ...newVendor,
                                businessHours: {
                                  ...newVendor.businessHours,
                                  [day]: {
                                    ...schedule,
                                    closed: !schedule.closed
                                  }
                                }
                              })}
                              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-md ${
                                !schedule.closed 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:scale-105' 
                                  : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                              }`}
                            >
                              {!schedule.closed ? (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Open</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  <span>Closed</span>
                                </>
                              )}
                            </button>
                          </div>
                          
                          {!schedule.closed && (
                            <div className="flex items-center space-x-3 ml-4">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm text-white/80 font-medium">From:</label>
                                <input
                                  type="time"
                                  value={schedule.open}
                                  onChange={(e) => setNewVendor({
                                    ...newVendor,
                                    businessHours: {
                                      ...newVendor.businessHours,
                                      [day]: {
                                        ...schedule,
                                        open: e.target.value
                                      }
                                    }
                                  })}
                                  className="px-3 py-2 backdrop-blur-lg bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                                />
                              </div>
                              
                              <span className="text-white/40 font-bold">—</span>
                              
                              <div className="flex items-center space-x-2">
                                <label className="text-sm text-white/80 font-medium">To:</label>
                                <input
                                  type="time"
                                  value={schedule.close}
                                  onChange={(e) => setNewVendor({
                                    ...newVendor,
                                    businessHours: {
                                      ...newVendor.businessHours,
                                      [day]: {
                                        ...schedule,
                                        close: e.target.value
                                      }
                                    }
                                  })}
                                  className="px-3 py-2 backdrop-blur-lg bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                                />
                              </div>
                            </div>
                          )}
                          
                          {schedule.closed && (
                            <span className="text-sm text-white/60 italic ml-4 flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-400" />
                              Closed all day
                            </span>
                          )}
                        </div>
                      ))}
                      
                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            const updatedHours = {};
                            Object.keys(newVendor.businessHours).forEach(day => {
                              updatedHours[day] = {
                                open: '09:00',
                                close: '17:00',
                                closed: false
                              };
                            });
                            setNewVendor({
                              ...newVendor,
                              businessHours: updatedHours
                            });
                          }}
                          className="text-xs px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-medium"
                        >
                          Set All 9 AM - 5 PM
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const updatedHours = {};
                            Object.keys(newVendor.businessHours).forEach(day => {
                              updatedHours[day] = {
                                open: '09:00',
                                close: '17:00',
                                closed: day === 'sunday'
                              };
                            });
                            setNewVendor({
                              ...newVendor,
                              businessHours: updatedHours
                            });
                          }}
                          className="text-xs px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-medium"
                        >
                          Mon-Sat 9-5
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const updatedHours = {};
                            Object.keys(newVendor.businessHours).forEach(day => {
                              updatedHours[day] = {
                                open: '09:00',
                                close: '17:00',
                                closed: true
                              };
                            });
                            setNewVendor({
                              ...newVendor,
                              businessHours: updatedHours
                            });
                          }}
                          className="text-xs px-4 py-2 backdrop-blur-lg bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 hover:scale-105 transition-all font-medium"
                        >
                          Close All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowAddVendor(false)}
                    className="px-6 py-3 backdrop-blur-lg bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 hover:scale-105 transition-all font-medium shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addVendor}
                    disabled={!newVendor.name || !newVendor.type || !newVendor.address.street}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 via-blue-500 to-violet-500 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Vendor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Items Modal */}
        {selectedVendorForItems && (
          <VendorItems
            vendor={selectedVendorForItems}
            onClose={() => setSelectedVendorForItems(null)}
          />
        )}

        {/* Vendor Reviews Modal */}
        {selectedVendorForReviews && (
          <VendorReviews
            vendor={selectedVendorForReviews}
            onClose={() => setSelectedVendorForReviews(null)}
          />
        )}

        {/* Vendor Report Modal */}
        {selectedVendorForReport && (
          <VendorReportModal
            vendor={selectedVendorForReport}
            onClose={() => setSelectedVendorForReport(null)}
          />
        )}
      </div>
    </div>
  );
};

export default VendorsPage;