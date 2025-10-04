import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import { toast } from 'react-hot-toast';

const useInteractionStore = create((set, get) => ({
  // State
  interactions: {},
  comments: {},
  loadingStates: {
    like: false,
    bookmark: false,
    comment: false,
    share: false
  },

  // ============ LIKES ============
  toggleLike: async (postId) => {
    set(state => ({
      loadingStates: { ...state.loadingStates, like: true }
    }));

    try {
  const response = await axiosInstance.post(`api/interactions/${postId}/like`);
      const { isLiked, likeCount } = response.data;

      set(state => ({
        interactions: {
          ...state.interactions,
          [postId]: {
            ...state.interactions[postId],
            isLiked,
            likeCount
          }
        }
      }));

      toast.success(isLiked ? 'Post liked!' : 'Post unliked');
      return { isLiked, likeCount };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update like');
      throw error;
    } finally {
      set(state => ({
        loadingStates: { ...state.loadingStates, like: false }
      }));
    }
  },

  // ============ BOOKMARKS ============
  toggleBookmark: async (postId) => {
    set(state => ({
      loadingStates: { ...state.loadingStates, bookmark: true }
    }));

    try {
  const response = await axiosInstance.post(`api/interactions/${postId}/bookmark`);
      const { isBookmarked, bookmarkCount } = response.data;

      set(state => ({
        interactions: {
          ...state.interactions,
          [postId]: {
            ...state.interactions[postId],
            isBookmarked,
            bookmarkCount
          }
        }
      }));

      toast.success(isBookmarked ? 'Post bookmarked!' : 'Bookmark removed');
      return { isBookmarked, bookmarkCount };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bookmark');
      throw error;
    } finally {
      set(state => ({
        loadingStates: { ...state.loadingStates, bookmark: false }
      }));
    }
  },

  getUserBookmarks: async () => {
    try {
  const response = await axiosInstance.get('api/interactions/bookmarks');
      return response.data.posts || [];
    } catch (error) {
      console.error('Failed to load bookmarked posts:', error);
      toast.error('Failed to load bookmarked posts');
      throw error;
    }
  },

  // ============ COMMENTS ============
  addComment: async (postId, text, parentCommentId = null) => {
    set(state => ({
      loadingStates: { ...state.loadingStates, comment: true }
    }));

    try {
  const response = await axiosInstance.post(`api/interactions/${postId}/comments`, {
        text,
        parentCommentId
      });

      const newComment = response.data.comment;

      set(state => ({
        comments: {
          ...state.comments,
          [postId]: [newComment, ...(state.comments[postId] || [])]
        }
      }));

      toast.success('Comment added successfully');
      return newComment;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
      throw error;
    } finally {
      set(state => ({
        loadingStates: { ...state.loadingStates, comment: false }
      }));
    }
  },

  getComments: async (postId, page = 1) => {
    try {
  const response = await axiosInstance.get(`api/interactions/${postId}/comments?page=${page}`);
      const { comments, pagination } = response.data;

      set(state => ({
        comments: {
          ...state.comments,
          [postId]: page === 1 ? comments : [...(state.comments[postId] || []), ...comments]
        }
      }));

      return { comments, pagination };
    } catch (error) {
      toast.error('Failed to load comments');
      throw error;
    }
  },

  toggleCommentLike: async (commentId) => {
    try {
  const response = await axiosInstance.post(`api/interactions/comments/${commentId}/like`);
      const { isLiked, likeCount } = response.data;

      // Update comment in state
      set(state => {
        const updatedComments = { ...state.comments };
        Object.keys(updatedComments).forEach(postId => {
          updatedComments[postId] = updatedComments[postId].map(comment => {
            if (comment._id === commentId) {
              return { ...comment, isLiked, likeCount };
            }
            return comment;
          });
        });
        return { comments: updatedComments };
      });

      return { isLiked, likeCount };
    } catch (error) {
      toast.error('Failed to update comment like');
      throw error;
    }
  },

  editComment: async (commentId, text) => {
    try {
  const response = await axiosInstance.put(`api/interactions/comments/${commentId}`, { text });
      const updatedComment = response.data.comment;

      // Update comment in state
      set(state => {
        const updatedComments = { ...state.comments };
        Object.keys(updatedComments).forEach(postId => {
          updatedComments[postId] = updatedComments[postId].map(comment => {
            if (comment._id === commentId) {
              return updatedComment;
            }
            return comment;
          });
        });
        return { comments: updatedComments };
      });

      toast.success('Comment updated');
      return updatedComment;
    } catch (error) {
      toast.error('Failed to update comment');
      throw error;
    }
  },

  deleteComment: async (commentId) => {
    try {
  await axiosInstance.delete(`api/interactions/comments/${commentId}`);
      
      // Remove comment from state
      set(state => {
        const updatedComments = { ...state.comments };
        Object.keys(updatedComments).forEach(postId => {
          updatedComments[postId] = updatedComments[postId].filter(comment => comment._id !== commentId);
        });
        return { comments: updatedComments };
      });

      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
      throw error;
    }
  },

  // ============ SHARING ============
  sharePost: async (postId, platform, message = '', sharedWith = []) => {
    set(state => ({
      loadingStates: { ...state.loadingStates, share: true }
    }));

    try {
  const response = await axiosInstance.post(`api/interactions/${postId}/share`, {
        platform,
        message,
        sharedWith
      });

      const { shareUrl, shareCount } = response.data;

      set(state => ({
        interactions: {
          ...state.interactions,
          [postId]: {
            ...state.interactions[postId],
            shareCount
          }
        }
      }));

      // Copy to clipboard if copy-link
      if (platform === 'copy-link') {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } else {
        toast.success('Post shared successfully!');
      }

      return { shareUrl, shareCount };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share post');
      throw error;
    } finally {
      set(state => ({
        loadingStates: { ...state.loadingStates, share: false }
      }));
    }
  },

  // ============ ANALYTICS ============
  incrementViews: async (postId) => {
    try {
  await axiosInstance.post(`api/interactions/${postId}/view`);
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  },

  getPostEngagement: async (postId) => {
    try {
  const response = await axiosInstance.get(`api/interactions/${postId}/engagement`);
      const engagement = response.data.engagement;

      set(state => ({
        interactions: {
          ...state.interactions,
          [postId]: engagement
        }
      }));

      return engagement;
    } catch (error) {
      console.error('Failed to get engagement data:', error);
      throw error;
    }
  },



  // ============ UTILITY FUNCTIONS ============
  setInteraction: (postId, interaction) => {
    set(state => ({
      interactions: {
        ...state.interactions,
        [postId]: {
          ...state.interactions[postId],
          ...interaction
        }
      }
    }));
  },

  clearComments: (postId) => {
    set(state => ({
      comments: {
        ...state.comments,
        [postId]: []
      }
    }));
  },

  reset: () => {
    set({
      interactions: {},
      comments: {},
      loadingStates: {
        like: false,
        bookmark: false,
        comment: false,
        share: false
      }
    });
  }
}));

export default useInteractionStore;