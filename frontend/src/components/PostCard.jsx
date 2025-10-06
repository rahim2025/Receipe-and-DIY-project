import { Link } from 'react-router-dom';
import { Clock, MapPin, Navigation } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import { calculateDistance, formatDistance } from '../lib/location';
import InteractionBar from './InteractionBar';

const PostCard = ({ post, showDistance = false, userLocation = null, className = "" }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDistance = () => {
    if (!showDistance || !userLocation || !post.location?.coordinates) {
      return null;
    }
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      post.location.coordinates[1], // latitude
      post.location.coordinates[0]  // longitude
    );
    
    return formatDistance(distance);
  };

  const distance = getDistance();

  return (
    <div className={`glass-post-card group ${className}`}>
      {/* Image */}
      <div className="glass-post-image h-44 sm:h-48 md:h-56">
        <img
          src={post.images?.[0] || '/api/placeholder/400/200'}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Type Badge */}
        <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4">
          <span className={`glass-post-badge text-xs sm:text-sm ${
            post.type === 'recipe' 
              ? 'glass-post-badge-recipe' 
              : 'glass-post-badge-diy'
          }`}>
            {post.type === 'recipe' ? '👨‍🍳 Recipe' : '🔨 DIY'}
          </span>
        </div>

        {/* Difficulty Badge */}
        {post.difficulty && (
          <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4">
            <span className={`glass-post-badge text-xs sm:text-sm ${getDifficultyColor(post.difficulty)}`}>
              ⭐ <span className="hidden xs:inline">{post.difficulty}</span>
            </span>
          </div>
        )}

        {/* Distance Badge */}
        {distance && (
          <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 right-2 sm:right-3 md:right-4">
            <span className="glass-post-badge flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{distance}</span>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="glass-post-content p-4 sm:p-5 md:p-6">
        <h3 className="glass-post-title text-base sm:text-lg md:text-xl mb-2 sm:mb-3 line-clamp-2 leading-tight">
          {post.title}
        </h3>
        
        <p className="glass-post-description text-xs sm:text-sm mb-3 sm:mb-4 md:mb-5 line-clamp-2 sm:line-clamp-3 leading-relaxed">
          {post.description}
        </p>

        {/* Location and Cultural Info */}
        {(post.location?.displayLocation || post.cuisine || post.culturalOrigin) && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 md:mb-5">
            {post.location?.displayLocation && (
              <span className="glass-post-badge inline-flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                <span>{post.location.displayLocation}</span>
              </span>
            )}
            {post.cuisine && (
              <span className="glass-post-badge text-xs">
                🍽️ {post.cuisine}
              </span>
            )}
            {post.culturalOrigin && (
              <span className="glass-post-badge text-xs">
                🌍 {post.culturalOrigin}
              </span>
            )}
          </div>
        )}

        {/* Step Info - NEW */}
        {post.steps && post.steps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <span className="glass-post-badge flex items-center gap-1 text-xs">
              <span className="font-bold text-teal-600">{post.steps.length}</span>
              <span className="hidden xs:inline">steps</span>
            </span>
            {post.totalStepTime > 0 && (
              <span className="glass-post-badge flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                <span>{post.totalStepTime} <span className="hidden xs:inline">min</span></span>
              </span>
            )}
            {post.totalStepCost > 0 && (
              <span className="glass-post-badge flex items-center gap-1 text-xs font-semibold">
                <span>💰</span>
                <span>৳{post.totalStepCost.toFixed(2)}</span>
              </span>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs sm:text-sm mb-3 sm:mb-4 md:mb-5">
          <div className="glass-post-author">
            <img
              src={post.author.profilePic || '/api/placeholder/32/32'}
              alt={post.author.fullName}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="glass-post-author-name text-xs sm:text-sm truncate">{post.author.fullName}</div>
              <div className="glass-post-author-meta flex items-center gap-1 text-xs">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
          {post.totalCostEstimate > 0 && (
            <div className="glass-post-badge flex items-center gap-1 font-semibold flex-shrink-0">
              <span className="text-xs">💰</span>
              <span className="text-xs">
                {formatCurrency(post.totalCostEstimate, post.costCurrency, { showDecimals: false })}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="glass-post-badge text-xs hover:scale-105">
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="glass-post-badge text-xs">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Interactions */}
      <div className="glass-post-actions">
        <InteractionBar post={post} className="mb-3 sm:mb-4" />
        <Link
          to={`/post/${post._id}`}
          className="glass-post-button w-full text-center py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium block text-sm sm:text-base touch-target"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PostCard;