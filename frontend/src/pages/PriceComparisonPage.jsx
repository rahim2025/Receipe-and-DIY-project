import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Star, DollarSign, Package, Clock, ChevronDown, ChevronUp, Grid, List, Sparkles, SlidersHorizontal 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

const PriceComparisonPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonResults, setComparisonResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    inStockOnly: false,
    minPrice: '',
    maxPrice: '',
    sortBy: 'price',
    priceUnit: ''
  });
  const [showFilters, setShowFilters] = useState(false); // mobile toggle
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [userLocation, setUserLocation] = useState(null);
  const [popularItems, setPopularItems] = useState([]);
  const [priceStats, setPriceStats] = useState(null);

  // Get user location for distance sorting
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or failed:', error);
        }
      );
    }
  }, []);

  // Load popular items on component mount
  useEffect(() => {
    loadPopularItems();
  }, []);

  const loadPopularItems = async () => {
    try {
      const response = await axiosInstance.get('/api/price-comparison/popular');
      if (response.data.success) {
        setPopularItems(response.data.data);
      }
    } catch (error) {
      console.error('Error loading popular items:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        name: searchQuery,
        ...filters,
        ...(userLocation ? { userLocation: `${userLocation.lng},${userLocation.lat}` } : {})
      });

      const response = await axiosInstance.get(`/api/price-comparison/search?${params}`);
      
      if (response.data.success) {
        setComparisonResults(response.data.data.results);
        toast.success(`Found ${response.data.data.totalItems} items across ${response.data.data.totalUniqueItems} different products`);
        
        // Load price statistics for the search
        loadPriceStats();
      } else {
        toast.error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      toast.error(error.response?.data?.message || 'Failed to search for items');
    } finally {
      setLoading(false);
    }
  };

  const loadPriceStats = async () => {
    try {
      const params = new URLSearchParams({
        name: searchQuery,
        ...(filters.category && { category: filters.category }),
        ...(filters.type && { type: filters.type })
      });

      const response = await axiosInstance.get(`/api/price-comparison/stats?${params}`);
      if (response.data.success) {
        setPriceStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading price stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      type: '',
      inStockOnly: false,
      minPrice: '',
      maxPrice: '',
      sortBy: 'price',
      priceUnit: ''
    });
  };

  const formatPrice = (price) => {
    if (price.min && price.max && price.min !== price.max) {
      return `${price.currency || 'USD'} ${price.min} - ${price.max}/${price.unit || 'unit'}`;
    }
    const amount = price.min || price.max || 0;
    return `${price.currency || 'USD'} ${amount}/${price.unit || 'unit'}`;
  };

  const getStockStatus = (availability) => {
    if (availability.inStock) {
      return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
    }
    return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
  };

  const categories = [
    'vegetables', 'fruits', 'meat', 'dairy', 'grains', 'spices', 'herbs',
    'fabric', 'wood', 'metal', 'plastic', 'paper', 'paint', 'adhesives',
    'electronics', 'hardware', 'tools', 'beads', 'yarn', 'leather'
  ];

  const ComparisonTable = ({ item }) => (
    <div className="glass-panel p-0 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white capitalize font-['Poppins']">
            {item.itemName}
            <span className="text-sm text-white/60 ml-2 font-normal">({item.category})</span>
          </h3>
          <p className="text-sm text-white/60">{item.vendors.length} vendors found</p>
        </div>
        {priceStats && priceStats.itemName.toLowerCase() === item.itemName.toLowerCase() && (
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="glass-badge glass-badge-teal">Min ${priceStats.priceStats.min}</div>
            <div className="glass-badge glass-badge-violet">Max ${priceStats.priceStats.max}</div>
            <div className="glass-badge glass-badge-blue">Avg ${priceStats.priceStats.average.toFixed(2)}</div>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/10 text-white/70 text-xs uppercase tracking-wide">
              {['Vendor','Price','Stock','Location','Rating','Details'].map(head => (
                <th key={head} className="px-6 py-3 font-semibold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {item.vendors.map((vendorItem, index) => {
              const stockStatus = getStockStatus(vendorItem.availability);
              return (
                <tr 
                  key={`${vendorItem.vendor._id}-${index}`} 
                  className="border-t border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-medium text-white/90">{vendorItem.vendor.name}</div>
                    <div className="text-xs text-white/60 capitalize">{vendorItem.vendor.type}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-teal-300">{formatPrice(vendorItem.price)}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm ${vendorItem.availability.inStock ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{stockStatus.text}</span>
                      {vendorItem.availability.seasonal && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 backdrop-blur-sm">Seasonal</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start text-sm text-white/80">
                      <MapPin className="w-4 h-4 mr-1 text-teal-300" />
                      <div>
                        {vendorItem.vendor.address?.city || 'N/A'}
                        {vendorItem.distance && (
                          <div className="text-xs text-white/50">{vendorItem.distance} km</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center text-sm text-yellow-300">
                      <Star className="w-4 h-4 mr-1" />
                      {vendorItem.vendor.rating ? vendorItem.vendor.rating.toFixed(1) : 'N/A'}
                      {vendorItem.averageRating && (
                        <span className="ml-2 text-xs text-white/60">Item {vendorItem.averageRating.toFixed(1)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-xs text-white/70 space-y-2">
                    {vendorItem.description && (
                      <div className="line-clamp-2" title={vendorItem.description}>{vendorItem.description}</div>
                    )}
                    {vendorItem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {vendorItem.tags.slice(0,3).map((tag, tagIndex) => (
                          <span key={tagIndex} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200">{tag}</span>
                        ))}
                        {vendorItem.tags.length > 3 && (
                          <span className="text-[10px] text-white/50">+{vendorItem.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ComparisonGrid = ({ item }) => (
    <div className="glass-panel p-0 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-white/10 bg-white/5">
        <h3 className="text-xl font-semibold text-white capitalize font-['Poppins']">
          {item.itemName} 
          <span className="text-sm text-white/60 ml-2 font-normal">({item.category})</span>
        </h3>
        <p className="text-sm text-white/60">{item.vendors.length} vendors found</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {item.vendors.map((vendorItem, index) => {
            const stockStatus = getStockStatus(vendorItem.availability);
            return (
              <div key={`${vendorItem.vendor._id}-${index}`} className="glass-post-card p-4 !backdrop-blur-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium text-sm">{vendorItem.vendor.name}</h4>
                    <p className="text-xs text-white/60 capitalize">{vendorItem.vendor.type}</p>
                  </div>
                  <div className="text-right text-teal-300 text-sm font-semibold">
                    {formatPrice(vendorItem.price)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full backdrop-blur-sm ${vendorItem.availability.inStock ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{stockStatus.text}</span>
                    <div className="flex items-center text-yellow-300">
                      <Star className="w-3 h-3 mr-1" />
                      <span className="text-xs">{vendorItem.vendor.rating ? vendorItem.vendor.rating.toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-white/70">
                    <MapPin className="w-3 h-3 mr-1 text-teal-300" />
                    {vendorItem.vendor.address?.city || 'N/A'}{vendorItem.distance && ` (${vendorItem.distance} km)`}
                  </div>
                  {vendorItem.description && (
                    <p className="text-[11px] text-white/70 line-clamp-2">{vendorItem.description}</p>
                  )}
                  {vendorItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {vendorItem.tags.slice(0,3).map((tag, tagIndex) => (
                        <span key={tagIndex} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-40 pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Hero / Search */}
        <div className="mb-8 glass-fade-in">
          <div className="glass-panel p-8 text-center relative overflow-hidden">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-['Poppins']">
              Smart <span className="bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent">Price Comparison</span>
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto mb-8 text-lg font-light">
              Find the best prices for ingredients & crafting materials across local vendors.
            </p>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }} 
              className="relative max-w-xl mx-auto flex items-center backdrop-blur-lg bg-white/10 border border-white/20 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <span className="absolute left-4 text-white/50"><Search className="w-5 h-5" /></span>
              <input
                type="text"
                placeholder="Search ingredients or materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none text-sm"
              />
              <div className="absolute right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="glass-btn-secondary px-4 py-2 hidden sm:flex items-center gap-2 text-xs"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="glass-btn-primary px-6 py-2 text-sm"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
            <div className="sm:hidden mt-4">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className="glass-btn-secondary w-full justify-center"
              >
                <Filter className="w-4 h-4" /> Toggle Filters
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
            <div className={`lg:col-span-1 ${showFilters ? '' : 'hidden lg:block'}`}>
              <div className="sticky top-32 space-y-6">
                <div className="glass-sidebar p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Filter className="w-5 h-5 text-teal-400" />
                    <h3 className="text-lg font-semibold text-white font-['Poppins']">Filters</h3>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        Category
                      </h4>
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="glass-select w-full"
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category} className="capitalize bg-gray-900">{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                        Type
                      </h4>
                      <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="glass-select w-full"
                      >
                        <option value="">All Types</option>
                        <option value="ingredient">Ingredients</option>
                        <option value="material">Materials</option>
                      </select>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        Sort By
                      </h4>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="glass-select w-full"
                      >
                        <option value="price">Lowest Price</option>
                        <option value="rating">Vendor Rating</option>
                        <option value="vendorRating">Item Rating</option>
                        {userLocation && <option value="distance">Nearest Location</option>}
                      </select>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        Price Range
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          className="glass-input"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          className="glass-input"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.inStockOnly}
                          onChange={(e) => handleFilterChange('inStockOnly', e.target.checked)}
                          className="w-4 h-4 rounded bg-white/10 border-white/30 text-teal-400 focus:ring-teal-500"
                        />
                        In stock only
                      </label>
                      <button onClick={clearFilters} className="text-xs text-teal-300 hover:text-teal-200">Clear</button>
                    </div>
                  </div>
                </div>
                {priceStats && (
                  <div className="glass-sidebar p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-violet-400" />
                      <h3 className="text-lg font-semibold text-white font-['Poppins']">Price Stats</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="glass-panel p-3">
                        <div className="text-xs text-white/60">Min</div>
                        <div className="text-sm font-semibold text-teal-300">${priceStats.priceStats.min}</div>
                      </div>
                      <div className="glass-panel p-3">
                        <div className="text-xs text-white/60">Avg</div>
                        <div className="text-sm font-semibold text-violet-300">${priceStats.priceStats.average.toFixed(2)}</div>
                      </div>
                      <div className="glass-panel p-3">
                        <div className="text-xs text-white/60">Max</div>
                        <div className="text-sm font-semibold text-blue-300">${priceStats.priceStats.max}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Popular Items */}
            {popularItems.length > 0 && comparisonResults.length === 0 && (
              <div className="glass-panel p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-teal-300" />
                  <h2 className="text-xl font-bold text-white font-['Poppins']">Popular Items</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {popularItems.slice(0,6).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(item.name);
                        setFilters(prev => ({ ...prev, category: item.category, type: item.type }));
                      }}
                      className="glass-post-card p-4 text-left hover:scale-[1.02] transition-transform"
                    >
                      <h3 className="text-white font-medium capitalize mb-1 text-sm">{item.name}</h3>
                      <p className="text-xs text-white/60 capitalize mb-2">{item.category} • {item.type}</p>
                      <div className="flex items-center justify-between text-[11px] text-white/60">
                        <span>{item.vendorCount} vendors</span>
                        {item.avgPrice && (
                          <span className="text-teal-300 font-semibold">Avg ${item.avgPrice}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View Mode Toggle */}
            {comparisonResults.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-white/50">View:</span>
                  <div className="glass-toggle-group">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`glass-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`glass-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-white/60">
                  Found {comparisonResults.length} unique items
                </div>
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="glass-panel p-12 text-center">
                <div className="glass-loading mx-auto mb-6"></div>
                <h3 className="text-lg font-semibold text-white mb-2">Searching for best prices...</h3>
                <p className="text-white/70">Gathering vendor data</p>
              </div>
            ) : comparisonResults.length > 0 ? (
              <div>
                {comparisonResults.map((item, index) => (
                  <div key={index}>
                    {viewMode === 'table' ? (
                      <ComparisonTable item={item} />
                    ) : (
                      <ComparisonGrid item={item} />
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery && !loading ? (
              <div className="glass-panel p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-white/40 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3 font-['Poppins']">No items found</h3>
                <p className="text-white/70 mb-4">Try adjusting your search terms or filters.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceComparisonPage;