import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Grid,
  List,
  ChefHat,
  Hammer,
  Heart,
  MessageCircle,
  Share2,
  ShoppingCart,
  Zap,
  Flame,
  Eye
} from 'lucide-react';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';

const SearchAndDiscovery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { authUser } = useAuthStore();
  const { posts, getPosts, isLoading } = usePostStore();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('latest');
  
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    category: searchParams.get('category') || '',
    difficulty: searchParams.get('difficulty') || '',
    tags: searchParams.get('tags')?.split(',') || [],
    timeRange: '',
    minTime: '',
    maxTime: ''
  });

  const [activeSection, setActiveSection] = useState('all');

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters.type) params.set('type', filters.type);
    if (filters.category) params.set('category', filters.category);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    
    setSearchParams(params);
    
    // Fetch posts with filters
    const searchFilters = {
      search: searchQuery,
      ...filters,
      sortBy
    };
    
    getPosts(searchFilters);
  }, [searchQuery, filters, sortBy, getPosts, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTagToggle = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      difficulty: '',
      tags: [],
      timeRange: '',
      minTime: '',
      maxTime: ''
    });
    setSearchQuery('');
  };

  const popularTags = [
    'vegetarian', 'quick', 'healthy', 'budget-friendly', 'italian', 'mexican',
    'home-decor', 'beginner', 'upcycling', 'seasonal', 'kids', 'outdoor'
  ];

  const categories = {
    recipe: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Beverages'],
    diy: ['Home Decor', 'Furniture', 'Organization', 'Gifts', 'Seasonal', 'Kids', 'Garden', 'Repair']
  };

  const trendingPosts = posts.slice(0, 3);
  const popularPosts = posts.slice(0, 5);
  const latestPosts = posts.slice(0, 8);

  const filteredPosts = posts.filter(post => {
    // Apply additional client-side filtering if needed
    return true;
  });

  const getSectionPosts = () => {
    switch (activeSection) {
      case 'trending': return trendingPosts;
      case 'popular': return popularPosts;
      case 'latest': return latestPosts;
      default: return filteredPosts;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 pt-20">
      {/* Enhanced Search Header */}
      <div className="glass-card sticky top-16 z-40 border-b border-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Discover Amazing Content
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex rounded-lg overflow-hidden border border-white/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' 
                    ? 'bg-indigo-500 text-white' 
                    : 'glass-card text-gray-600 hover:text-indigo-500'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' 
                    ? 'bg-indigo-500 text-white' 
                    : 'glass-card text-gray-600 hover:text-indigo-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="glass-card px-4 py-2 rounded-lg border border-white/30 text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes, DIY crafts, ingredients, or materials..."
              className="w-full pl-12 pr-4 py-4 glass-card rounded-2xl border border-white/30 text-lg placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-200/50"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleFilterChange('type', filters.type === 'recipe' ? '' : 'recipe')}
              className={`filter-pill ${filters.type === 'recipe' ? 'active' : ''}`}
            >
              <ChefHat className="w-4 h-4" />
              Recipes
            </button>
            <button
              onClick={() => handleFilterChange('type', filters.type === 'diy' ? '' : 'diy')}
              className={`filter-pill ${filters.type === 'diy' ? 'active' : ''}`}
            >
              <Hammer className="w-4 h-4" />
              DIY Projects
            </button>
            {popularTags.slice(0, 6).map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`filter-pill ${filters.tags.includes(tag) ? 'active' : ''}`}
              >
                #{tag}
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-indigo-500 ml-2"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Advanced Filters Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="glass-card p-6 rounded-2xl sticky top-40">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Content Type</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value=""
                      checked={filters.type === ''}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="text-indigo-500"
                    />
                    <span className="text-sm">All Content</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="recipe"
                      checked={filters.type === 'recipe'}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="text-indigo-500"
                    />
                    <span className="text-sm">Recipes Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="diy"
                      checked={filters.type === 'diy'}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="text-indigo-500"
                    />
                    <span className="text-sm">DIY Projects Only</span>
                  </label>
                </div>
              </div>

              {/* Category Filter */}
              {filters.type && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3">Category</h4>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full p-2 glass-card rounded-lg border border-white/30 text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories[filters.type]?.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Difficulty Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Difficulty</h4>
                <div className="space-y-2">
                  {['beginner', 'intermediate', 'advanced'].map(level => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.difficulty === level}
                        onChange={(e) => handleFilterChange('difficulty', e.target.checked ? level : '')}
                        className="text-indigo-500"
                      />
                      <span className="text-sm capitalize flex items-center gap-1">
                        {level}
                        <span className="text-xs">
                          {level === 'easy' && '⭐'}
                          {level === 'medium' && '⭐⭐'}
                          {level === 'hard' && '⭐⭐⭐'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Range Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Time Range</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Under 30 min', value: '0-30' },
                    { label: '30-60 min', value: '30-60' },
                    { label: '1-2 hours', value: '60-120' },
                    { label: '2+ hours', value: '120+' }
                  ].map(range => (
                    <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.timeRange === range.value}
                        onChange={(e) => handleFilterChange('timeRange', e.target.checked ? range.value : '')}
                        className="text-indigo-500"
                      />
                      <span className="text-sm">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Popular Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-indigo-500 text-white'
                          : 'glass-card text-gray-600 hover:text-indigo-500 border border-white/30'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            {/* Section Navigation */}
            <div className="flex items-center gap-4 mb-8 overflow-x-auto">
              {[
                { id: 'all', label: 'All Content', icon: Grid },
                { id: 'trending', label: 'Trending', icon: TrendingUp },
                { id: 'popular', label: 'Popular', icon: Flame },
                { id: 'latest', label: 'Latest', icon: Zap }
              ].map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200'
                        : 'glass-card text-gray-600 hover:text-indigo-500 border border-white/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {activeSection === 'all' && `${filteredPosts.length} Results`}
                  {activeSection === 'trending' && 'Trending Now'}
                  {activeSection === 'popular' && 'Most Popular'}
                  {activeSection === 'latest' && 'Latest Posts'}
                </h2>
                {searchQuery && (
                  <p className="text-gray-600 mt-1">
                    Showing results for "{searchQuery}"
                  </p>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass-card p-6 rounded-2xl animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Content Grid/List */}
            {!isLoading && (
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-6'
              }`}>
                {getSectionPosts().map(post => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    viewMode={viewMode}
                    authUser={authUser}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && getSectionPosts().length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={clearFilters}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Post Card Component
const PostCard = ({ post, viewMode, authUser }) => {
  const { likePost } = usePostStore();
  const [isLiked, setIsLiked] = useState(
    authUser && post.likes?.includes(authUser._id)
  );

  const handleLike = async () => {
    if (!authUser) return;
    try {
      await likePost(post._id);
      setIsLiked(!isLiked);
    } catch (error) {
      // Error handled in store
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string') return time;
    return `${time} min`;
  };

  if (viewMode === 'list') {
    return (
      <div className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all">
        <div className="flex gap-6">
          <div className="w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={post.coverImage || post.images?.[0] || '/api/placeholder/300/200'}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  post.type === 'recipe' 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {post.type === 'recipe' ? <ChefHat className="w-3 h-3" /> : <Hammer className="w-3 h-3" />}
                  {post.type === 'recipe' ? 'Recipe' : 'DIY Project'}
                </span>
                <h3 className="text-xl font-semibold text-gray-800 mt-2">{post.title}</h3>
              </div>
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-colors ${
                  isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
            <p className="text-gray-600 mb-4 line-clamp-2">{post.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              {post.cookingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(post.cookingTime)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                {post.difficulty || 'Easy'}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views || 0} views
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-gray-500 hover:text-indigo-500">
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                  {post.likeCount || 0}
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-indigo-500">
                  <MessageCircle className="w-4 h-4" />
                  {post.commentCount || 0}
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-indigo-500">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              <button className="btn btn-sm btn-primary">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all">
      <div className="relative">
        <img
          src={post.coverImage || post.images?.[0] || '/api/placeholder/400/250'}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium glass-card ${
            post.type === 'recipe' 
              ? 'text-orange-600 border border-orange-200' 
              : 'text-purple-600 border border-purple-200'
          }`}>
            {post.type === 'recipe' ? <ChefHat className="w-3 h-3" /> : <Hammer className="w-3 h-3" />}
            {post.type === 'recipe' ? 'Recipe' : 'DIY'}
          </span>
          <button
            onClick={handleLike}
            className={`p-2 rounded-full glass-card transition-colors ${
              isLiked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 flex gap-2">
          {post.cookingTime && (
            <span className="flex items-center gap-1 px-2 py-1 glass-card rounded-lg text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              {formatTime(post.cookingTime)}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1 glass-card rounded-lg text-xs text-gray-600">
            <Star className="w-3 h-3" />
            {post.difficulty || 'Easy'}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {post.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {post.likeCount || 0}
            </button>
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-500">
              <MessageCircle className="w-4 h-4" />
              {post.commentCount || 0}
            </button>
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-500">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAndDiscovery;