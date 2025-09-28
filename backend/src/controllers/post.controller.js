import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary.js';
import { cleanupTempFile } from '../lib/multer.js';

export const createPost = async (req, res) => {
  try {
    console.log('=== CREATE POST DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      title,
      description,
      type,
      images,
      ingredients,
      servings,
      cookingTime,
      category,
      materials,
      estimatedTime,
      cookingSteps,
      instructions,
      difficulty,
      tags,
      status = 'draft',
      totalCostEstimate,
      costCurrency = 'USD',
      costNotes,
      location,
      cuisine,
      culturalOrigin,
      seasonality
    } = req.body;

    console.log('Cooking steps received:', cookingSteps);
    console.log('Instructions received:', instructions);

    // Basic validation
    if (!title || !description || !type) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, description, and type are required" 
      });
    }

    if (!['recipe', 'diy'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: "Type must be either 'recipe' or 'diy'" 
      });
    }

    // Type-specific validation
    if (type === 'recipe') {
      if (!cookingSteps || cookingSteps.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "At least one cooking step is required for recipes" 
        });
      }
    }

    if (type === 'diy') {
      if (!instructions || instructions.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "At least one instruction is required for DIY projects" 
        });
      }
    }

    const newPost = new Post({
      title,
      description,
      type,
      author: req.user._id,
      coverImage: (images && images.length > 0 ? images[0] : ''),
      images: images || [],
      ingredients: ingredients || [],
      servings: servings || '',
      cookingTime: cookingTime || '',
      category: category || '',
      materials: materials || [],
      estimatedTime: estimatedTime || '',
      cookingSteps: cookingSteps || [],
      instructions: instructions || [],
      difficulty: difficulty || 'beginner',
      tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
      status,
      totalCostEstimate: totalCostEstimate || 0,
      costCurrency: costCurrency || 'USD',
      costNotes: costNotes || '',
      location: location || {},
      cuisine: cuisine || '',
      culturalOrigin: culturalOrigin || [],
      seasonality: seasonality || []
    });

    await newPost.save();
    await newPost.populate('author', 'firstName lastName username profilePic');

    res.status(201).json({
      success: true,
      message: `${type === 'recipe' ? 'Recipe' : 'DIY project'} ${status === 'draft' ? 'draft saved' : 'created'} successfully`,
      post: newPost
    });

  } catch (error) {
    console.log("Error in createPost controller: ", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Post not found" 
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only edit your own posts" 
      });
    }

    // Clean tags if provided
    if (updateData.tags) {
      updateData.tags = updateData.tags.map(tag => tag.toLowerCase().trim());
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName username profilePic');

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost
    });

  } catch (error) {
    console.log("Error in updatePost controller: ", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const publishPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Post not found" 
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only publish your own posts" 
      });
    }

    // Validation for publishing
    if (!post.coverImage) {
      return res.status(400).json({ 
        success: false, 
        message: "Cover image is required for publishing" 
      });
    }

    // Type-specific validation for publishing
    if (post.type === 'recipe' && (!post.cookingSteps || post.cookingSteps.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one cooking step is required for publishing recipes" 
      });
    }

    if (post.type === 'diy' && (!post.instructions || post.instructions.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one instruction is required for publishing DIY projects" 
      });
    }

    post.status = 'published';
    if (!post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();
    await post.populate('author', 'firstName lastName username profilePic');

    res.status(200).json({
      success: true,
      message: "Post published successfully",
      post
    });

  } catch (error) {
    console.log("Error in publishPost controller: ", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { 
      search,
      type, 
      status = 'published', 
      author, 
      difficulty, 
      tags, 
      category,
      timeRange,
      page = 1, 
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { 'ingredients.name': { $regex: search, $options: 'i' } },
        { 'materials.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build query filters
    if (type && ['recipe', 'diy'].includes(type)) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (author) {
      query.author = author;
    }
    
    if (difficulty && ['easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      query.difficulty = difficulty;
    }
    
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.toLowerCase().trim());
      query.tags = { $in: tagArray };
    }

    // Time range filter
    if (timeRange) {
      const timeFilters = {
        '0-30': { $or: [
          { cookingTime: { $regex: '^([1-9]|[12][0-9]|30)\\s*(min|minutes?)$', $options: 'i' } },
          { estimatedTime: { $regex: '^([1-9]|[12][0-9]|30)\\s*(min|minutes?)$', $options: 'i' } }
        ]},
        '30-60': { $or: [
          { cookingTime: { $regex: '^([3-5][0-9]|60)\\s*(min|minutes?)$', $options: 'i' } },
          { estimatedTime: { $regex: '^([3-5][0-9]|60)\\s*(min|minutes?)$', $options: 'i' } }
        ]},
        '60-120': { $or: [
          { cookingTime: { $regex: '(hour|hr|[6-9][0-9]|1[01][0-9]|120)', $options: 'i' } },
          { estimatedTime: { $regex: '(hour|hr|[6-9][0-9]|1[01][0-9]|120)', $options: 'i' } }
        ]},
        '120+': { $or: [
          { cookingTime: { $regex: '([2-9]\\s*(hour|hr)|1[3-9][0-9])', $options: 'i' } },
          { estimatedTime: { $regex: '([2-9]\\s*(hour|hr)|1[3-9][0-9])', $options: 'i' } }
        ]}
      };
      
      if (timeFilters[timeRange]) {
        Object.assign(query, timeFilters[timeRange]);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Enhanced sort options
    let sort = {};
    switch (sortBy) {
      case 'popular':
        sort = { likes: -1, views: -1 };
        break;
      case 'trending':
        sort = { updatedAt: -1, likes: -1 };
        break;
      case 'rating':
        sort = { likes: -1 };
        break;
      case 'latest':
        sort = { createdAt: -1 };
        break;
      default:
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .populate('author', 'firstName lastName username profilePic')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    // Transform posts to include virtual fields and proper format
    const transformedPosts = posts.map(post => ({
      ...post.toObject(),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      bookmarkCount: post.bookmarks.length
    }));

    res.status(200).json({
      success: true,
      posts: transformedPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPosts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        search,
        type,
        category,
        difficulty,
        tags,
        timeRange,
        sortBy
      }
    });

  } catch (error) {
    console.log("Error in getPosts controller: ", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('author', 'firstName lastName username profilePic bio')
      .populate('comments.user', 'firstName lastName username profilePic');

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Post not found" 
      });
    }

    // Increment view count if post is published
    if (post.status === 'published') {
      post.views += 1;
      await post.save();
    }

    // Transform post to include virtual fields
    const transformedPost = {
      ...post.toObject(),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      bookmarkCount: post.bookmarks.length
    };

    res.status(200).json({
      success: true,
      post: transformedPost
    });

  } catch (error) {
    console.log("Error in getPostById controller: ", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Post not found" 
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only delete your own posts" 
      });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.log("Error in deletePost controller: ", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const uploadMedia = async (req, res) => {
  try {
    const { type = 'image' } = req.body;

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    // Validate file type
    if (!['image', 'video'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid media type. Must be 'image' or 'video'" 
      });
    }

    // Set folder based on type
    const folder = type === 'image' 
      ? 'recipe-diy-hub/posts/images' 
      : 'recipe-diy-hub/posts/videos';

    // Set transformations based on type
    const transformation = type === 'image' 
      ? [
          { width: 1200, height: 800, crop: "limit" },
          { quality: "auto" },
          { format: "auto" }
        ]
      : [
          { width: 1280, height: 720, crop: "limit" },
          { quality: "auto" },
          { bit_rate: "1m" }
        ];

    // Upload to Cloudinary using our helper
    const uploadResult = await uploadToCloudinary(req.file, {
      folder,
      transformation
    });

    // Clean up temporary file
    if (req.file?.path) {
      cleanupTempFile(req.file.path);
    }

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload media",
        error: uploadResult.error
      });
    }

    res.status(200).json({
      success: true,
      message: "Media uploaded successfully",
      url: uploadResult.url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
      format: uploadResult.format
    });

  } catch (error) {
    console.log("Error in uploadMedia controller: ", error.message);
    
    // Clean up temporary file in case of error
    if (req.file?.path) {
      cleanupTempFile(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Post not found" 
      });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(like => like.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      isLiked: !isLiked,
      likeCount: post.likes.length
    });

  } catch (error) {
    console.log("Error in likePost controller: ", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const getUserDrafts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [drafts, totalDrafts] = await Promise.all([
      Post.find({ author: userId, status: 'draft' })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments({ author: userId, status: 'draft' })
    ]);

    const totalPages = Math.ceil(totalDrafts / parseInt(limit));

    // Transform drafts to include virtual fields
    const transformedDrafts = drafts.map(draft => ({
      ...draft.toObject(),
      likeCount: draft.likes.length,
      commentCount: draft.comments.length,
      bookmarkCount: draft.bookmarks.length
    }));

    res.status(200).json({
      success: true,
      drafts: transformedDrafts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDrafts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.log("Error in getUserDrafts controller: ", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

// ============ GET POSTS BY LOCATION ============
export const getPostsByLocation = async (req, res) => {
  try {
    const {
      lat,
      lng,
      latitude,
      longitude,
      maxDistance,
      radius = maxDistance || 50000, // 50km default
      cuisine,
      culturalOrigin,
      type,
      limit = 12
    } = req.query;

    // Support both parameter formats
    const queryLat = lat || latitude;
    const queryLng = lng || longitude;

    let query = { status: 'published' };

    // Location filter (only if coordinates provided)
    if (queryLng && queryLat) {
      query["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(queryLng), parseFloat(queryLat)]
          },
          $maxDistance: parseInt(radius)
        }
      };
    }

    // Additional filters
    if (cuisine) query.cuisine = cuisine;
    if (culturalOrigin) query.culturalOrigin = culturalOrigin;
    if (type) query.type = type;

    const posts = await Post.find(query)
      .populate('author', 'fullName username profilePic')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Transform posts to include virtual fields and distance
    const transformedPosts = posts.map(post => {
      let distance = null;
      
      if (queryLat && queryLng && post.location?.coordinates && post.location.coordinates.length === 2) {
        // Simple distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (post.location.coordinates[1] - parseFloat(queryLat)) * Math.PI / 180;
        const dLng = (post.location.coordinates[0] - parseFloat(queryLng)) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                  Math.cos(parseFloat(queryLat) * Math.PI / 180) * Math.cos(post.location.coordinates[1] * Math.PI / 180) * 
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = Math.round(R * c * 100) / 100; // Round to 2 decimal places
      }

      return {
        ...post.toObject(),
        likeCount: post.likes.length,
        commentCount: post.comments.length,
        bookmarkCount: post.bookmarks.length,
        distance
      };
    });

    res.status(200).json({
      success: true,
      posts: transformedPosts,
      count: transformedPosts.length
    });

  } catch (error) {
    console.log("Error in getPostsByLocation controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};