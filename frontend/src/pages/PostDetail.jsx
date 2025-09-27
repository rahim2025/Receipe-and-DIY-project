import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Clock, 
  Users, 
  Star, 
  ChefHat, 
  Hammer, 
  ArrowLeft, 
  Edit3, 
  Share2,
  Bookmark,
  Play,
  Tag
} from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import toast from 'react-hot-toast';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import InteractionBar from '../components/InteractionBar';
import InlineComments from '../components/InlineComments';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { currentPost, getPostById, likePost, isLoading } = usePostStore();
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (postId) {
      getPostById(postId);
    }
  }, [postId, getPostById]);

  const handleLike = async () => {
    if (!authUser) {
      navigate('/login');
      return;
    }
    
    try {
      await likePost(postId);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPost.title,
          text: currentPost.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDifficultyStars = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '⭐';
      case 'intermediate': return '⭐⭐';
      case 'advanced': return '⭐⭐⭐';
      default: return '⭐';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="glass-panel p-12 text-center">
            <div className="glass-loading mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-3 font-['Poppins']">Loading Amazing Content</h3>
            <p className="text-white/80 text-lg">Preparing something spectacular for you...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="min-h-screen pt-24 pb-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="glass-panel p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-violet-400 rounded-full flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 font-['Poppins']">Content Not Found</h2>
            <p className="text-white/80 mb-8 text-lg max-w-md mx-auto">
              The amazing content you're looking for seems to have vanished into the digital ether!
            </p>
            <button
              onClick={() => navigate(-1)}
              className="glass-btn-primary text-lg px-8 py-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = authUser && authUser._id === currentPost.author._id;
  const isLiked = authUser && currentPost.likes?.includes(authUser._id);

  return (
    <div className="min-h-screen pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="glass-btn text-sm px-4 py-2 text-white/90 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="glass-btn text-sm px-4 py-2 text-white/90 hover:text-white"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            
            {isOwner && (
              <Link
                to={`/edit/${currentPost._id}`}
                className="glass-btn-primary text-sm px-4 py-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="glass-featured glass-hover-lift overflow-hidden mb-8">
          {/* Hero Section */}
          <div className="relative">
            {/* Images */}
            {currentPost.images && currentPost.images.length > 0 && (
              <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-teal-400/10 to-violet-400/10 rounded-t-3xl overflow-hidden">
                <img
                  src={currentPost.images[activeImageIndex]}
                  alt={currentPost.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                
                {/* Enhanced Glass Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                
                {/* Image Navigation */}
                {currentPost.images.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {currentPost.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-4 h-4 rounded-full transition-all duration-300 backdrop-blur-md ${
                          index === activeImageIndex 
                            ? 'bg-teal-400 shadow-lg border-2 border-white' 
                            : 'bg-white/50 hover:bg-white/80 border border-white/30'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Video Toggle */}
                {currentPost.videos && currentPost.videos.length > 0 && (
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30 hover:scale-110 transition-all duration-300 flex items-center justify-center"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Video Section */}
            {showVideo && currentPost.videos && currentPost.videos.length > 0 && (
              <div className="relative h-96 bg-black">
                <video
                  src={currentPost.videos[activeVideoIndex]}
                  controls
                  className="w-full h-full object-contain"
                />
                
                {/* Video Navigation */}
                {currentPost.videos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {currentPost.videos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveVideoIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === activeVideoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Type Badge */}
            <div className="absolute top-6 left-6">
              <div className={`glass-badge text-sm ${
                currentPost.type === 'recipe'
                  ? 'glass-badge-teal'
                  : 'glass-badge-violet'
              }`}>
                {currentPost.type === 'recipe' ? (
                  <ChefHat className="w-4 h-4" />
                ) : (
                  <Hammer className="w-4 h-4" />
                )}
                {currentPost.type === 'recipe' ? 'Recipe' : 'DIY Craft'}
              </div>
            </div>

            {/* Featured Badge */}
            <div className="absolute top-6 right-6 mr-16">
              <div className="glass-badge glass-badge-blue">
                <Star className="w-4 h-4" />
                Featured
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Title and Meta */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight font-['Poppins']">
                {currentPost.title}
              </h1>
              
              <p className="text-lg text-white/80 mb-6 leading-relaxed">
                {currentPost.description}
              </p>

              {/* Author and Date */}
              <div className="glass-panel p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-violet-400 p-0.5">
                      <img
                        src={currentPost.author.profilePic || '/api/placeholder/48/48'}
                        alt={currentPost.author.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-lg">
                        {currentPost.author.fullName}
                      </div>
                      <div className="text-sm text-white/70">
                        Created on {formatDate(currentPost.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleLike}
                      className={`glass-btn-primary px-4 py-2 text-sm ${
                        isLiked 
                          ? 'bg-gradient-to-r from-red-400 to-pink-400' 
                          : ''
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="font-semibold">{currentPost.likeCount || 0}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                <div className="glass-card text-center p-4">
                  <Star className={`w-6 h-6 mx-auto mb-2 ${getDifficultyColor(currentPost.difficulty)}`} />
                  <div className="text-sm font-bold text-white mb-1">{getDifficultyStars(currentPost.difficulty)}</div>
                  <div className="text-xs text-white/70">Difficulty</div>
                </div>

                {currentPost.type === 'recipe' ? (
                  <>
                    <div className="glass-card text-center p-4">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-teal-400" />
                      <div className="text-sm font-bold text-white mb-1">{currentPost.cookingTime || 'N/A'}</div>
                      <div className="text-xs text-white/70">Cook Time</div>
                    </div>
                    <div className="glass-card text-center p-4">
                      <Users className="w-6 h-6 mx-auto mb-2 text-violet-400" />
                      <div className="text-sm font-bold text-white mb-1">{currentPost.servings || 'N/A'}</div>
                      <div className="text-xs text-white/70">Servings</div>
                    </div>
                  </>
                ) : (
                  <div className="glass-card text-center p-4">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-teal-400" />
                    <div className="text-sm font-bold text-white mb-1">{currentPost.estimatedTime || 'N/A'}</div>
                    <div className="text-xs text-white/70">Est. Time</div>
                  </div>
                )}

                <div className="glass-card text-center p-4">
                  <Tag className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                  <div className="text-sm font-bold text-white mb-1">{currentPost.category || 'General'}</div>
                  <div className="text-xs text-white/70">Category</div>
                </div>

                {/* Cost Estimation */}
                {currentPost.totalCostEstimate > 0 && (
                  <div className="glass-card text-center p-4">
                    <div className="w-6 h-6 mx-auto mb-2 text-green-400 font-bold flex items-center justify-center text-lg">$</div>
                    <div className="text-sm font-bold text-white mb-1">
                      {formatCurrency(currentPost.totalCostEstimate, currentPost.costCurrency)}
                    </div>
                    <div className="text-xs text-white/70">Est. Cost</div>
                  </div>
                )}
              </div>

              {/* Cost Notes */}
              {currentPost.costNotes && (
                <div className="mb-4 p-2.5 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-50 border border-yellow-200 shadow-sm">
                  <div className="flex items-start gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-yellow-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-800 text-[10px]">💡</span>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium text-xs">
                        <span className="text-yellow-700 font-bold">Cost Insight:</span> {currentPost.costNotes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {currentPost.tags && currentPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {currentPost.tags.map(tag => (
                    <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredients/Materials */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-violet-400 flex items-center justify-center">
                  <span className="text-white text-sm">{currentPost.type === 'recipe' ? '🛒' : '🧰'}</span>
                </div>
                {currentPost.type === 'recipe' ? 'Ingredients' : 'Materials Needed'}
              </h2>
              
              <div className="glass-panel p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(currentPost.type === 'recipe' ? currentPost.ingredients : currentPost.materials)?.map((item, index) => (
                    <div key={index} className="glass-card p-4 hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{item.name}</span>
                        <div className="text-right">
                          <span className="text-sm text-teal-300 font-semibold">
                            {item.quantity} {currentPost.type === 'recipe' ? item.unit : ''}
                          </span>
                          {currentPost.type === 'diy' && item.notes && (
                            <div className="text-xs text-white/70 mt-1">{item.notes}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-400 to-teal-400 flex items-center justify-center">
                  <span className="text-white text-sm">{currentPost.type === 'recipe' ? '👨‍🍳' : '🔨'}</span>
                </div>
                {currentPost.type === 'recipe' ? 'Cooking Steps' : 'Instructions'}
              </h2>
              
              <div className="space-y-6">
                {(currentPost.type === 'recipe' ? currentPost.cookingSteps : currentPost.instructions)?.map((step, index) => (
                  <div key={index} className="glass-panel p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-400 to-violet-400 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1">
                        <p className="text-white mb-4 text-sm leading-relaxed font-medium">{step.instruction}</p>
                        
                        {/* Step Media */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {step.image && (
                            <div className="glass-card rounded-xl overflow-hidden">
                              <img
                                src={step.image}
                                alt={`Step ${step.stepNumber}`}
                                className="w-full h-32 object-cover hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          )}
                          
                          {step.video && (
                            <div className="glass-card rounded-xl overflow-hidden">
                              <video
                                src={step.video}
                                controls
                                className="w-full h-32 object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interaction Bar */}
            <div className="border-t border-white/20 pt-6 mb-8">
              <div className="glass-panel p-6">
                <InteractionBar post={currentPost} className="rounded-xl" />
              </div>
            </div>

            {/* Comments Section */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                  <span className="text-white text-sm">💬</span>
                </div>
                Comments & Reviews
              </h3>
              <div className="glass-panel p-6">
                <InlineComments post={currentPost} limit={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts or Call to Action */}
        <div className="glass-featured text-center p-8">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-teal-400 to-violet-400 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Loved this {currentPost.type}?
            </h3>
            <p className="text-white/80 mb-6 text-base max-w-md mx-auto">
              Share your own creative masterpiece with our community!
            </p>
          </div>
          <Link
            to="/create"
            className="glass-btn inline-flex items-center gap-3 px-8 py-4 text-base font-semibold hover:scale-105"
          >
            <Edit3 className="w-5 h-5" />
            Create Your Own
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;