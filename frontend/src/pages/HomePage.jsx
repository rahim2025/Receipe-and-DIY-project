import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, Flame, DollarSign, TrendingUp, Heart, Eye, MessageCircle, Filter, Search, Bookmark, Sparkles } from 'lucide-react';
import AIAssistant from '../components/AIAssistant';
import { useAuthStore } from '../store/useAuthStore';
import { usePostStore } from '../store/usePostStore';
import useInteractionStore from '../store/useInteractionStore';
import toast from 'react-hot-toast';
import PostCard from '../components/PostCard';

const HomePage = () => {
  const { authUser } = useAuthStore();
  const { posts, isLoading, getPosts } = usePostStore();
  const { interactions, toggleLike, toggleBookmark, setInteraction } = useInteractionStore();
  const [priceRange, setPriceRange] = useState(5000);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: [],
    time: [],
    dietary: [],
    category: 'all'
  });
  const [filteredPosts, setFilteredPosts] = useState([]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [filterType]: newValues };
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search is handled by the useEffect
  };

  const handleLike = async (post) => {
    if (!authUser) {
      toast.error('Please login to like posts');
      return;
    }
    await toggleLike(post._id);
  };

  const handleBookmark = async (post) => {
    if (!authUser) {
      toast.error('Please login to bookmark posts');
      return;
    }
    await toggleBookmark(post._id);
  };

  useEffect(() => {
    // Fetch real posts from database
    getPosts();
  }, [getPosts]);

  // Listen for category changes from Navbar
  useEffect(() => {
    const handleCategoryChange = (event) => {
      setFilters(prev => ({ ...prev, category: event.detail.category }));
    };

    window.addEventListener('categoryChange', handleCategoryChange);
    return () => window.removeEventListener('categoryChange', handleCategoryChange);
  }, []);

  // Filter posts based on current filters
  useEffect(() => {
    let filtered = [...posts];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.ingredients?.some(ingredient => {
          // Handle both string ingredients and ingredient objects
          if (typeof ingredient === 'string') {
            return ingredient.toLowerCase().includes(searchQuery.toLowerCase());
          } else if (ingredient && typeof ingredient === 'object' && ingredient.name) {
            return ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
          }
          return false;
        })
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(post => {
        if (filters.category === 'recipe') {
          return post.type === 'recipe';
        }
        if (filters.category === 'diy') {
          return post.type === 'diy';
        }
        return true;
      });
    }

    // Difficulty filter
    if (filters.difficulty.length > 0) {
      filtered = filtered.filter(post => 
        filters.difficulty.includes(post.difficulty?.toLowerCase())
      );
    }

    // Time filter
    if (filters.time.length > 0) {
      filtered = filtered.filter(post => {
        const cookingTime = parseInt(post.cookingTime || post.duration || '0');
        return filters.time.some(timeRange => {
          if (timeRange === 'under-30' && cookingTime < 30) return true;
          if (timeRange === '30-60' && cookingTime >= 30 && cookingTime <= 60) return true;
          if (timeRange === '1-2-hours' && cookingTime > 60 && cookingTime <= 120) return true;
          if (timeRange === '2-plus' && cookingTime > 120) return true;
          return false;
        });
      });
    }

    // Dietary filter
    if (filters.dietary.length > 0) {
      filtered = filtered.filter(post => 
        filters.dietary.some(diet => 
          post.dietaryRestrictions?.includes(diet.toLowerCase()) ||
          post.tags?.includes(diet.toLowerCase())
        )
      );
    }

    // Price filter
    if (priceRange < 5000) {
      filtered = filtered.filter(post => 
        (post.totalCostEstimate || 0) <= priceRange
      );
    }

    setFilteredPosts(filtered);
  }, [posts, searchQuery, filters, priceRange]);

  // Initialize interactions for posts
  useEffect(() => {
    filteredPosts.forEach(post => {
      if (!interactions[post._id]) {
        setInteraction(post._id, {
          isLiked: post.likes?.some(like => like.toString() === authUser?._id?.toString()) || false,
          likeCount: post.likes?.length || 0,
          isBookmarked: post.bookmarks?.some(bookmark => bookmark.toString() === authUser?._id?.toString()) || false,
          bookmarkCount: post.bookmarks?.length || 0,
          commentCount: post.comments?.length || 0
        });
      }
    });
  }, [filteredPosts, authUser, interactions, setInteraction]);

  return (
    <div className="min-h-screen pt-40 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Hero Section with Search */}
        <div className="mb-8 glass-fade-in">
          <div className="glass-panel p-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-['Poppins']">
              Discover Amazing
              <span className="bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent ml-3">
                Recipes & Crafts
              </span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto font-light">
              Explore a world of culinary delights and creative DIY projects shared by our passionate community
            </p>
            
            {/* Search Bar */}
            <form 
            onSubmit={handleSearchSubmit} 
            className="relative max-w-lg mx-auto flex items-center backdrop-blur-lg bg-white/10 border border-white/20 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
            >
  {/* Search Icon inside left */}
  <span className="absolute left-4 text-gray-300">
    <Search className="w-5 h-5" />
  </span>

  {/* Input */}
  <input
    type="text"
    placeholder="Search recipes or crafts..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-12 pr-16 py-3 bg-transparent text-center text-gray-500 placeholder-gray-400 focus:outline-none font-medium"
  />

  {/* Button */}
  <button
    type="submit"
    className="absolute right-3 p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 transition-all duration-300 shadow-md"
  >
    <Search className="w-4 h-4 text-white" />
  </button>
</form>

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
                      Difficulty
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Beginner', value: 'beginner' },
                        { label: 'Intermediate', value: 'intermediate' },
                        { label: 'Advanced', value: 'advanced' }
                      ].map((level) => (
                        <label key={level.value} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={filters.difficulty.includes(level.value)}
                              onChange={() => handleFilterChange('difficulty', level.value)}
                            />
                            <div className="w-4 h-4 bg-white/10 border border-white/30 rounded peer-checked:bg-teal-400 peer-checked:border-teal-400 transition-all duration-200"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-200">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <span className="text-sm text-white/80 group-hover:text-white transition-colors">{level.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                      Time
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Under 30 min', value: 'under-30' },
                        { label: '30-60 min', value: '30-60' },
                        { label: '1-2 hours', value: '1-2-hours' },
                        { label: '2+ hours', value: '2-plus' }
                      ].map((time) => (
                        <label key={time.value} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={filters.time.includes(time.value)}
                              onChange={() => handleFilterChange('time', time.value)}
                            />
                            <div className="w-4 h-4 bg-white/10 border border-white/30 rounded peer-checked:bg-violet-400 peer-checked:border-violet-400 transition-all duration-200"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-200">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                          <span className="text-sm text-white/80 group-hover:text-white transition-colors">{time.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>


                  <div>
                    <h4 className="text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      Price Range
                    </h4>
                    <div className="glass-panel p-4">
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(priceRange/5000)*100}%, rgba(255,255,255,0.2) ${(priceRange/5000)*100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                      <div className="text-center text-sm text-white/80 mt-3">
                        $0 - ${priceRange.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assistant (Enhanced) */}
              <AIAssistant />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Today Section */}
            {filteredPosts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-teal-400" />
                  <h2 className="text-2xl font-bold text-white font-['Poppins']">Featured Today</h2>
                </div>
                
                <div className="glass-featured glass-hover-lift">
                  <div className="relative overflow-hidden rounded-t-3xl">
                    <img
                      src={filteredPosts[0]?.images?.[0] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=300&fit=crop"}
                      alt={filteredPosts[0]?.title || "Featured Post"}
                      className="w-full h-80 object-cover transition-transform duration-700 hover:scale-105"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    
                    {/* Badges */}
                    <div className="absolute top-6 right-6 flex gap-2">
                      <span className={`glass-badge ${filteredPosts[0]?.type === 'recipe' ? 'glass-badge-teal' : 'glass-badge-violet'}`}>
                        {filteredPosts[0]?.type === 'recipe' ? '🍳 Recipe' : '🎨 DIY Craft'}
                      </span>
                    </div>
                    
                    {/* Featured Badge */}
                    <div className="absolute top-6 left-6">
                      <div className="glass-badge glass-badge-blue">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </div>
                    </div>
                    
                    {/* Floating Action */}
                    <div className="absolute bottom-6 right-6">
                      <Link 
                        to={`/post/${filteredPosts[0]._id}`}
                        className="glass-btn-primary"
                      >
                        <Eye className="w-4 h-4" />
                        View Recipe
                      </Link>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-3xl font-bold text-white mb-4 font-['Poppins']">
                      {filteredPosts[0]?.title || "Featured Post"}
                    </h3>
                    <p className="text-white/80 mb-6 text-lg leading-relaxed">
                      {filteredPosts[0]?.description || "Discover amazing content from our community!"}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="glass-badge glass-badge-teal">
                        <Clock className="w-4 h-4" />
                        {filteredPosts[0]?.cookingTime || filteredPosts[0]?.duration || '30 min'}
                      </div>
                      
                      {filteredPosts[0]?.calories && (
                        <div className="glass-badge glass-badge-violet">
                          <Flame className="w-4 h-4" />
                          {filteredPosts[0].calories}
                        </div>
                      )}
                      
                      <div className="glass-badge glass-badge-blue">
                        {/* <DollarSign className="w-4 h-4" /> */}
                        ৳{filteredPosts[0]?.totalCostEstimate?.toFixed(2) || '0.00'}
                      </div>
                      
                      <div className="glass-badge">
                        <Heart className="w-4 h-4" />
                        {filteredPosts[0]?.likes?.length || 0} likes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full glass-panel p-12 text-center">
                  <div className="glass-loading mx-auto mb-6"></div>
                  <h3 className="text-lg font-semibold text-white mb-2">Loading amazing content...</h3>
                  <p className="text-white/70">Discovering the best recipes and crafts for you</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="col-span-full glass-panel p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-violet-400 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 font-['Poppins']">Start Something Amazing</h3>
                  <p className="text-white/80 mb-6 text-lg max-w-md mx-auto">
                    Be the first to share your incredible recipes and creative DIY projects with our community!
                  </p>
                  {authUser && (
                    <Link to="/create" className="glass-btn-primary text-lg px-8 py-4">
                      <Plus className="w-5 h-5" />
                      Create First Post
                    </Link>
                  )}
                </div>
              ) : (
                filteredPosts.map((post, index) => (
                  <div key={post._id} className={`glass-post-card group glass-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="glass-post-image h-48">
                      <img
                        src={post.images?.[0] || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop"}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Type Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`glass-post-badge ${post.type === 'recipe' ? 'glass-post-badge-recipe' : 'glass-post-badge-diy'}`}>
                          {post.type === 'recipe' ? '🍳 Recipe' : '🎨 DIY'}
                        </span>
                      </div>
                      
                      {/* Time Badge */}
                      <div className="absolute top-3 right-3">
                        <div className="glass-post-badge flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.cookingTime || post.duration || '30min'}
                        </div>
                      </div>
                      
                      {/* Floating Actions */}
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button 
                          onClick={() => handleBookmark(post)}
                          className={`glass-post-interaction w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 ${
                            interactions[post._id]?.isBookmarked ? 'text-yellow-400' : 'text-white/70'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${
                            interactions[post._id]?.isBookmarked ? 'fill-current' : ''
                          }`} />
                        </button>
                        <button 
                          onClick={() => handleLike(post)}
                          className={`glass-post-interaction w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 ${
                            interactions[post._id]?.isLiked ? 'text-red-400' : 'text-white/70'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${
                            interactions[post._id]?.isLiked ? 'fill-current' : ''
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="glass-post-content p-5">
                      <h3 className="glass-post-title text-lg mb-2 line-clamp-1 font-['Poppins']">
                        {post.title}
                      </h3>
                      <p className="glass-post-description text-sm mb-4 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>
                      
                      {/* Author */}
                      <div className="glass-post-author mb-4">
                        <img
                          src={post.author?.profilePic || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"}
                          alt={post.author?.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="glass-post-author-name text-sm">{post.author?.username}</div>
                          <div className="glass-post-author-meta text-xs">
                            ৳{post.totalCostEstimate?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="glass-post-actions">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleLike(post)}
                            className={`glass-post-interaction flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                              interactions[post._id]?.isLiked ? 'text-red-400' : 'text-white/70'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${
                              interactions[post._id]?.isLiked ? 'fill-current' : ''
                            }`} />
                            <span className="text-xs font-medium">{interactions[post._id]?.likeCount || post.likes?.length || 0}</span>
                          </button>
                          <button className="glass-post-interaction flex items-center gap-1 px-2 py-1 rounded-lg">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">{post.comments?.length || 0}</span>
                          </button>
                          <button 
                            onClick={() => handleBookmark(post)}
                            className={`glass-post-interaction flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                              interactions[post._id]?.isBookmarked ? 'text-yellow-400' : 'text-white/70'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 ${
                              interactions[post._id]?.isBookmarked ? 'fill-current' : ''
                            }`} />
                          </button>
                        </div>
                        <Link 
                          to={`/post/${post._id}`}
                          className="glass-post-button text-xs px-4 py-2 rounded-lg flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;