import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  Eye,
  MoreHorizontal 
} from 'lucide-react';
import toast from 'react-hot-toast';
import useInteractionStore from '../store/useInteractionStore';
import { useAuthStore } from '../store/useAuthStore';
import CommentsModal from './CommentsModal';
import ShareModal from './ShareModal';

const InteractionBar = ({ post, className = '' }) => {
  const { authUser } = useAuthStore();
  const { 
    interactions, 
    loadingStates,
    toggleLike, 
    toggleBookmark, 
    sharePost,
    incrementViews,
    getPostEngagement,
    setInteraction
  } = useInteractionStore();

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const postInteraction = interactions[post._id] || {};
  const {
    isLiked = false,
    likeCount = post.likeCount || post.likes?.length || 0,
    isBookmarked = false,
    bookmarkCount = post.bookmarkCount || post.bookmarks?.length || 0,
    commentCount = post.commentCount || post.comments?.length || 0,
    shareCount = post.shares || 0,
    views = post.views || 0
  } = postInteraction;

  useEffect(() => {
    // Initialize interaction data
    setInteraction(post._id, {
      isLiked: post.likes?.some(like => like.toString() === authUser?._id?.toString()) || false,
      likeCount: post.likeCount || post.likes?.length || 0,
      isBookmarked: post.bookmarks?.some(bookmark => bookmark.toString() === authUser?._id?.toString()) || false,
      bookmarkCount: post.bookmarkCount || post.bookmarks?.length || 0,
      commentCount: post.commentCount || post.comments?.length || 0,
      shareCount: post.shares || 0,
      views: post.views || 0
    });

    // Increment views (only once per session)
    const viewedPosts = JSON.parse(sessionStorage.getItem('viewedPosts') || '[]');
    if (!viewedPosts.includes(post._id)) {
      incrementViews(post._id);
      sessionStorage.setItem('viewedPosts', JSON.stringify([...viewedPosts, post._id]));
    }
  }, [post, authUser, setInteraction, incrementViews]);

  const handleLike = async () => {
    if (!authUser) {
      toast.error('Please login to like posts');
      return;
    }
    await toggleLike(post._id);
  };

  const handleBookmark = async () => {
    if (!authUser) {
      toast.error('Please login to bookmark posts');
      return;
    }
    await toggleBookmark(post._id);
  };

  const handleShare = (platform) => {
    sharePost(post._id, platform);
    setShowShare(false);
  };

  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <>
      <div className={`p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Main interactions */}
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={loadingStates.like}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                isLiked 
                  ? 'text-red-400 bg-red-500/20 border border-red-400/30' 
                  : 'text-white/70 hover:text-red-400 hover:bg-red-500/10'
              } ${loadingStates.like ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart 
                className={`h-5 w-5 transition-all duration-300 ${
                  isLiked ? 'fill-current' : ''
                } ${loadingStates.like ? 'animate-pulse' : ''}`}
              />
              <span className="text-sm font-bold">
                {formatCount(likeCount)}
              </span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/70 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-bold">
                {formatCount(commentCount)}
              </span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300"
            >
              <Share className="h-5 w-5" />
              <span className="text-sm font-bold">
                {formatCount(shareCount)}
              </span>
            </button>
          </div>

          {/* Right side - Secondary interactions */}
          <div className="flex items-center gap-4">
            {/* Views */}
            <div className="flex items-center gap-2 text-white/60 text-sm px-3 py-2 rounded-lg bg-white/5">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{formatCount(views)}</span>
            </div>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              disabled={loadingStates.bookmark}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isBookmarked 
                  ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-400/30' 
                  : 'text-white/70 hover:text-yellow-400 hover:bg-yellow-500/10'
              } ${loadingStates.bookmark ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Bookmark 
                className={`h-5 w-5 transition-all duration-300 ${
                  isBookmarked ? 'fill-current' : ''
                } ${loadingStates.bookmark ? 'animate-pulse' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showComments && (
        <CommentsModal
          post={post}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}

      {showShare && (
        <ShareModal
          post={post}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          onShare={handleShare}
        />
      )}


    </>
  );
};

export default InteractionBar;