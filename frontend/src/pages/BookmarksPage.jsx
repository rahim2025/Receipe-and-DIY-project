import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChefHat,
  Hammer,
  Search,
  Filter,
  Grid3X3,
  List,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import useInteractionStore from '../store/useInteractionStore';
import InteractionBar from '../components/InteractionBar';
import toast from 'react-hot-toast';

const BookmarksPage = () => {
  const { authUser } = useAuthStore();
  const { getUserBookmarks, toggleBookmark } = useInteractionStore();

  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (authUser) {
      loadBookmarkedPosts();
    }
  }, [authUser]);

  const loadBookmarkedPosts = async () => {
    try {
      setLoading(true);
      const posts = await getUserBookmarks();
      setBookmarkedPosts(posts || []);
    } catch (error) {
      console.error('Failed to load bookmarked posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId) => {
    try {
      await toggleBookmark(postId);
      // Remove from local state
      setBookmarkedPosts(posts => posts.filter(post => post._id !== postId));
      toast.success('Removed from bookmarks');
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  };

  const filteredPosts = bookmarkedPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || post.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-40 flex items-center justify-center">
        <div className="glass-panel p-10 text-center w-full max-w-md">
          <div className="glass-loading mx-auto mb-6"></div>
          <p className="text-white/80">Loading bookmarked posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Hero Section */}
        <div className="mb-8 glass-fade-in">
          <div className="glass-panel p-8 text-center relative overflow-hidden">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 font-['Poppins']">
              Your <span className="bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent">Bookmarks</span>
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto mb-8 text-lg font-light">
              {authUser ? `${bookmarkedPosts.length} posts saved for later exploration.` : 'Login to start saving your favorite recipes & crafts.'}
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative max-w-xl mx-auto flex items-center backdrop-blur-lg bg-white/10 border border-white/20 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <span className="absolute left-4 text-white/50"><Search className="w-5 h-5" /></span>
              <input
                type="text"
                placeholder="Search your bookmarked posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-40 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none text-sm"
              />
              <div className="absolute right-2 flex gap-2">
                <div className="hidden md:flex items-center gap-2">
                  <Filter className="w-4 h-4 text-white/60" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="glass-select text-xs"
                  >
                    <option value="all">All Types</option>
                    <option value="recipe">Recipes</option>
                    <option value="diy">DIY</option>
                  </select>
                </div>
                <div className="glass-toggle-group">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`glass-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`glass-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
            {/* Mobile Filters */}
            <div className="mt-4 md:hidden flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white/60" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="glass-select text-xs"
                >
                  <option value="all">All Types</option>
                  <option value="recipe">Recipes</option>
                  <option value="diy">DIY</option>
                </select>
              </div>
              <div className="glass-toggle-group">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`glass-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`glass-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredPosts.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-violet-400 rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 font-['Poppins']">
              {bookmarkedPosts.length === 0 ? 'No Bookmarks Yet' : 'No Matches Found'}
            </h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              {bookmarkedPosts.length === 0
                ? 'Start saving recipes and DIY projects to access them quickly later.'
                : 'Try refining your search keywords or removing filters.'}
            </p>
            {bookmarkedPosts.length === 0 && (
              <Link to="/" className="glass-btn-primary inline-flex">
                <Sparkles className="w-4 h-4" />
                Explore Posts
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredPosts.map((post, index) => (
              <div
                key={post._id}
                className={`glass-post-card group ${viewMode === 'list' ? 'flex items-stretch' : ''} glass-fade-in`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {viewMode === 'grid' ? (
                  <>
                    <Link to={`/post/${post._id}`} className="block">
                      <div className="glass-post-image aspect-video flex items-center justify-center overflow-hidden">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white/70">
                            {post.type === 'recipe' ? (
                              <ChefHat className="h-12 w-12 mb-2" />
                            ) : (
                              <Hammer className="h-12 w-12 mb-2" />
                            )}
                            <span className="text-xs uppercase tracking-wide">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="glass-post-content p-5">
                        <h3 className="glass-post-title text-lg mb-2 line-clamp-2 font-['Poppins']">{post.title}</h3>
                        <p className="text-sm text-white/70 mb-3">by {post.author.firstName} {post.author.lastName}</p>
                        <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
                          <Clock className="w-3 h-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`glass-badge ${post.type === 'recipe' ? 'glass-badge-teal' : 'glass-badge-violet'}`}>{post.type === 'recipe' ? '🍳 Recipe' : '🎨 DIY'}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="glass-post-actions">
                      <InteractionBar
                        post={post}
                        showBookmarkButton={true}
                        onBookmarkChange={() => handleRemoveBookmark(post._id)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Link to={`/post/${post._id}`} className="flex gap-5 p-5 flex-1 items-center overflow-hidden">
                      <div className="w-28 h-24 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center flex-shrink-0">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.type === 'recipe' ? (
                            <ChefHat className="h-10 w-10 text-white/70" />
                          ) : (
                            <Hammer className="h-10 w-10 text-white/70" />
                          )
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1 truncate font-['Poppins']">{post.title}</h3>
                        <p className="text-xs text-white/60 mb-2">by {post.author.firstName} {post.author.lastName}</p>
                        <div className="flex items-center gap-3 text-[11px] text-white/50">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                          <span className={`glass-badge ${post.type === 'recipe' ? 'glass-badge-teal' : 'glass-badge-violet'} !py-0.5 !text-[10px]`}>{post.type}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="px-5 py-5 border-l border-white/10 flex items-center">
                      <InteractionBar
                        post={post}
                        showBookmarkButton={true}
                        onBookmarkChange={() => handleRemoveBookmark(post._id)}
                        compact={true}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;