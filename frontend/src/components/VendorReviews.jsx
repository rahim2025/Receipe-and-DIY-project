import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ThumbsUp, 
  Edit2, 
  Trash2, 
  MessageSquare,
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const VendorReviews = ({ vendor, onClose }) => {
  const { authUser } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [ratingDistribution, setRatingDistribution] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    loadReviews();
    if (authUser && authUser._id) {
      loadUserReview();
    }
  }, [vendor._id, sortBy, authUser]);

  const loadReviews = async () => {
    try {
      setLoading(true);
  const response = await axiosInstance.get(`/api/vendor-reviews/vendor/${vendor._id}`, {
        params: { sort: sortBy }
      });
      setReviews(response.data.reviews);
      setRatingDistribution(response.data.ratingDistribution || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadUserReview = async () => {
    try {
  const response = await axiosInstance.get(`/api/vendor-reviews/vendor/${vendor._id}/user`);
      if (response.data.success && response.data.review) {
        setUserReview(response.data.review);
        setFormData({
          rating: response.data.review.rating,
          comment: response.data.review.comment
        });
      } else {
        setUserReview(null);
      }
    } catch (error) {
      // Silently handle errors (401, 404, etc.) - user simply hasn't reviewed yet or isn't authenticated
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Not authenticated or not authorized - this is fine
        setUserReview(null);
      } else {
        console.error('Error loading user review:', error);
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!authUser) {
      toast.error('Please login to leave a review');
      return;
    }

    if (!formData.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    console.log('Submitting review with data:', formData);
    console.log('Vendor ID:', vendor._id);
    console.log('Auth user:', authUser);

    try {
      if (userReview) {
        // Update existing review
        console.log('Updating review:', userReview._id);
  const response = await axiosInstance.put(`/api/vendor-reviews/${userReview._id}`, formData);
        console.log('Update response:', response.data);
        toast.success('Review updated successfully');
        setUserReview(response.data.review);
      } else {
        // Create new review
        console.log('Creating new review for vendor:', vendor._id);
  const response = await axiosInstance.post(`/api/vendor-reviews/vendor/${vendor._id}`, formData);
        console.log('Create response:', response.data);
        toast.success('Review added successfully');
        setUserReview(response.data.review);
      }
      
      setShowReviewForm(false);
      loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDeleteReview = async () => {
    if (!confirm('Are you sure you want to delete your review?')) return;

    try {
  await axiosInstance.delete(`/api/vendor-reviews/${userReview._id}`);
      toast.success('Review deleted successfully');
      setUserReview(null);
      setFormData({ rating: 5, comment: '' });
      loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleToggleHelpful = async (reviewId) => {
    if (!authUser) {
      toast.error('Please login to mark reviews as helpful');
      return;
    }

    try {
  const response = await axiosInstance.post(`/api/vendor-reviews/${reviewId}/helpful`);
      
      setReviews(reviews.map(review => 
        review._id === reviewId 
          ? { 
              ...review, 
              helpfulCount: response.data.helpfulCount,
              helpfulVotes: response.data.hasVoted 
                ? [...(review.helpfulVotes || []), authUser._id]
                : (review.helpfulVotes || []).filter(id => id !== authUser._id)
            }
          : review
      ));
    } catch (error) {
      console.error('Error toggling helpful vote:', error);
      toast.error('Failed to update helpful vote');
    }
  };

  const getRatingPercentage = (rating) => {
    const total = ratingDistribution.reduce((sum, r) => sum + r.count, 0);
    const ratingCount = ratingDistribution.find(r => r._id === rating)?.count || 0;
    return total > 0 ? (ratingCount / total) * 100 : 0;
  };

  const StarRating = ({ rating, size = 'small', interactive = false, onChange }) => {
    const starSize = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-white/30'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={interactive ? () => onChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40 border-2 border-white/20 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full backdrop-blur-lg bg-white/10 border border-white/20 hover:bg-white/20 hover:rotate-90 transition-all duration-300 flex items-center justify-center group"
        >
          <X className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
        </button>

        <div className="p-8 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 font-['Poppins']">
              Reviews for {vendor.name}
            </h2>
            
            {/* Overall Rating */}
            <div className="flex items-center justify-center gap-4 mt-6 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-2">
                  {vendor.rating ? vendor.rating.toFixed(1) : 'N/A'}
                </div>
                <StarRating rating={Math.round(vendor.rating || 0)} size="large" />
                <div className="text-white/70 text-sm mt-2">
                  {vendor.reviewCount || 0} {vendor.reviewCount === 1 ? 'review' : 'reviews'}
                </div>
              </div>
            </div>
          </div>

          {/* User's Review or Write Review Button */}
          {authUser && (
            <div className="mb-6">
              {userReview && !showReviewForm ? (
                <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-semibold mb-2">Your Review</h3>
                      <StarRating rating={userReview.rating} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-white/70" />
                      </button>
                      <button
                        onClick={handleDeleteReview}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">{userReview.comment}</p>
                </div>
              ) : showReviewForm ? (
                <form onSubmit={handleSubmitReview} className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">
                    {userReview ? 'Edit Your Review' : 'Write a Review'}
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-white/90 text-sm mb-2">Your Rating *</label>
                    <StarRating 
                      rating={formData.rating} 
                      size="large" 
                      interactive 
                      onChange={(rating) => setFormData({ ...formData, rating })}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-white/90 text-sm mb-2">Your Review *</label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      className="w-full px-4 py-3 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/50 transition-all resize-none"
                      rows="4"
                      placeholder="Share your experience with this vendor"
                      maxLength={1000}
                      required
                    />
                    <div className="text-right text-white/60 text-xs mt-1">
                      {formData.comment.length}/1000
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        if (!userReview) {
                          setFormData({ rating: 5, comment: '' });
                        }
                      }}
                      className="px-4 py-2 backdrop-blur-lg bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-teal-500 to-violet-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {userReview ? 'Update Review' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-violet-500 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Write a Review
                </button>
              )}
            </div>
          )}

          {/* Sort Options */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-white/70 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
            >
              <option value="recent" className="bg-gray-900">Most Recent</option>
              <option value="helpful" className="bg-gray-900">Most Helpful</option>
              <option value="highest" className="bg-gray-900">Highest Rating</option>
              <option value="lowest" className="bg-gray-900">Lowest Rating</option>
            </select>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="glass-loading mx-auto mb-4"></div>
                <p className="text-white/70">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl">
                <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No reviews yet</h3>
                <p className="text-white/70">Be the first to review this vendor!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review._id}
                  className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={review.user?.profilePic || '/default-avatar.png'}
                        alt={review.user?.username}
                        className="w-12 h-12 rounded-full border-2 border-white/20"
                      />
                      <div>
                        <h4 className="text-white font-semibold">
                          {review.user?.firstName} {review.user?.lastName}
                        </h4>
                        <StarRating rating={review.rating} />
                        <p className="text-white/60 text-xs mt-1">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          {review.isEdited && ' (edited)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-white/80 text-sm mb-4 leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Helpful Button */}
                  <button
                    onClick={() => handleToggleHelpful(review._id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      review.helpfulVotes?.includes(authUser?._id)
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'backdrop-blur-lg bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpfulCount || 0})
                  </button>

                  {/* Vendor Response */}
                  {review.response && (
                    <div className="mt-4 ml-16 backdrop-blur-lg bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-violet-400" />
                        <span className="text-violet-400 font-medium text-sm">
                          Response from {vendor.name}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm">{review.response.text}</p>
                      <p className="text-white/60 text-xs mt-2">
                        {formatDistanceToNow(new Date(review.response.respondedAt), { addSuffix: true })}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorReviews;
