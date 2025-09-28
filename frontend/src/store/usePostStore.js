import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import toast from 'react-hot-toast';

export const usePostStore = create((set, get) => ({
  posts: [],
  currentPost: null,
  drafts: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isUploading: false,

  // Create a new post
  createPost: async (postData) => {
    set({ isCreating: true });
    try {
  const res = await axiosInstance.post('api/posts', postData);
      if (res.data.success) {
        const { post } = res.data;
        
        if (post.status === 'draft') {
          set((state) => ({
            drafts: [post, ...state.drafts],
            isCreating: false
          }));
        } else {
          set((state) => ({
            posts: [post, ...state.posts],
            isCreating: false
          }));
        }
        
        return post;
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
      set({ isCreating: false });
      throw error;
    }
  },

  // Update a post
  updatePost: async (postId, updateData) => {
    set({ isUpdating: true });
    try {
  const res = await axiosInstance.put(`api/posts/${postId}`, updateData);
      if (res.data.success) {
        const { post } = res.data;
        
        set((state) => ({
          posts: state.posts.map(p => p._id === postId ? post : p),
          drafts: state.drafts.map(d => d._id === postId ? post : d),
          currentPost: state.currentPost?._id === postId ? post : state.currentPost,
          isUpdating: false
        }));
        
        return post;
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
      set({ isUpdating: false });
      throw error;
    }
  },

  // Publish a post
  publishPost: async (postId) => {
    set({ isUpdating: true });
    try {
  const res = await axiosInstance.patch(`api/posts/${postId}/publish`);
      if (res.data.success) {
        const { post } = res.data;
        
        set((state) => ({
          posts: [post, ...state.posts],
          drafts: state.drafts.filter(d => d._id !== postId),
          currentPost: state.currentPost?._id === postId ? post : state.currentPost,
          isUpdating: false
        }));
        
        toast.success('Post published successfully!');
        return post;
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error(error.response?.data?.message || 'Failed to publish post');
      set({ isUpdating: false });
      throw error;
    }
  },

  // Get posts with filters
  getPosts: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

  const res = await axiosInstance.get(`api/posts?${params.toString()}`);
      if (res.data.success) {
        set({ 
          posts: res.data.posts, 
          isLoading: false 
        });
        return res.data;
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Get post by ID
  getPostById: async (postId) => {
    set({ isLoading: true });
    try {
  const res = await axiosInstance.get(`api/posts/${postId}`);
      if (res.data.success) {
        set({ 
          currentPost: res.data.post, 
          isLoading: false 
        });
        return res.data.post;
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Get user drafts
  getUserDrafts: async () => {
    set({ isLoading: true });
    try {
  const res = await axiosInstance.get('api/posts/user/drafts');
      if (res.data.success) {
        set({ 
          drafts: res.data.drafts, 
          isLoading: false 
        });
        return res.data;
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
  const res = await axiosInstance.delete(`api/posts/${postId}`);
      if (res.data.success) {
        set((state) => ({
          posts: state.posts.filter(p => p._id !== postId),
          drafts: state.drafts.filter(d => d._id !== postId)
        }));
        toast.success('Post deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.message || 'Failed to delete post');
      throw error;
    }
  },

  // Upload media
  uploadMedia: async (file, type = 'image') => {
    set({ isUploading: true });
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('type', type);

  const res = await axiosInstance.post('api/posts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        set({ isUploading: false });
        return res.data.url;
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error(error.response?.data?.message || 'Failed to upload media');
      set({ isUploading: false });
      throw error;
    }
  },

  // Like/Unlike post
  likePost: async (postId) => {
    try {
  const res = await axiosInstance.post(`api/posts/${postId}/like`);
      if (res.data.success) {
        set((state) => ({
          posts: state.posts.map(post => 
            post._id === postId 
              ? { ...post, likes: res.data.isLiked 
                  ? [...post.likes, 'currentUser'] 
                  : post.likes.filter(id => id !== 'currentUser'),
                  likeCount: res.data.likeCount
                }
              : post
          ),
          currentPost: state.currentPost?._id === postId 
            ? { ...state.currentPost, 
                likes: res.data.isLiked 
                  ? [...state.currentPost.likes, 'currentUser'] 
                  : state.currentPost.likes.filter(id => id !== 'currentUser'),
                likeCount: res.data.likeCount
              }
            : state.currentPost
        }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
      throw error;
    }
  },

  // Clear current post
  clearCurrentPost: () => set({ currentPost: null }),

  // Reset store
  reset: () => set({
    posts: [],
    currentPost: null,
    drafts: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isUploading: false
  })
}));