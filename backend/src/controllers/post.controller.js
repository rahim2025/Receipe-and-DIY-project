import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
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
      coverImage,
      servings,
      category,
      difficulty,
      tags,
      status = 'draft',
      steps
    } = req.body;

    console.log('Steps received:', steps);

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

    // Validate steps
    if (!steps || steps.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one step is required" 
      });
    }

    // Calculate totals from steps
    const totalCostEstimate = steps.reduce((sum, step) => {
      const stepCost = step.estimatedCost || 0;
      const materialsCost = (step.materials || []).reduce(
        (matSum, mat) => matSum + (mat.estimatedCost || 0),
        0
      );
      return sum + stepCost + materialsCost;
    }, 0);

    const totalTime = steps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);

    // Calculate total time string
    const cookingTime = totalTime >= 60 
      ? `${Math.floor(totalTime / 60)} hour${Math.floor(totalTime / 60) > 1 ? 's' : ''} ${totalTime % 60 > 0 ? `${totalTime % 60} min` : ''}`
      : `${totalTime} minutes`;

    const estimatedTime = cookingTime; // Same for DIY

    const newPost = new Post({
      title,
      description,
      type,
      author: req.user._id,
      coverImage: coverImage || '',
      images: coverImage ? [coverImage] : [],
      servings: servings || '',
      cookingTime: type === 'recipe' ? cookingTime : '',
      estimatedTime: type === 'diy' ? estimatedTime : '',
      category: category || '',
      difficulty: difficulty || 'beginner',
      tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
      status,
      steps: steps || [],
      totalCostEstimate,
      costCurrency: 'USD',
      // Extract unique ingredients/materials from all steps for compatibility
      ingredients: type === 'recipe' ? extractIngredientsFromSteps(steps) : [],
      materials: type === 'diy' ? extractMaterialsFromSteps(steps) : []
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

// Helper function to extract ingredients from steps
const extractIngredientsFromSteps = (steps) => {
  const ingredientsMap = new Map();
  
  steps.forEach(step => {
    if (step.materials && step.materials.length > 0) {
      step.materials.forEach(material => {
        const key = `${material.name.toLowerCase()}-${material.unit || ''}`;
        if (ingredientsMap.has(key)) {
          const existing = ingredientsMap.get(key);
          const existingQty = parseFloat(existing.quantity) || 0;
          const newQty = parseFloat(material.quantity) || 0;
          existing.quantity = (existingQty + newQty).toString();
        } else {
          ingredientsMap.set(key, {
            name: material.name,
            quantity: material.quantity || '',
            unit: material.unit || ''
          });
        }
      });
    }
  });
  
  return Array.from(ingredientsMap.values());
};

// Helper function to extract materials from steps
const extractMaterialsFromSteps = (steps) => {
  const materialsMap = new Map();
  
  steps.forEach(step => {
    if (step.materials && step.materials.length > 0) {
      step.materials.forEach(material => {
        const key = material.name.toLowerCase();
        if (materialsMap.has(key)) {
          const existing = materialsMap.get(key);
          const existingQty = parseFloat(existing.quantity) || 0;
          const newQty = parseFloat(material.quantity) || 0;
          existing.quantity = (existingQty + newQty).toString();
        } else {
          materialsMap.set(key, {
            name: material.name,
            quantity: material.quantity || '1',
            optional: false,
            estimatedCost: material.estimatedCost || 0
          });
        }
      });
    }
  });
  
  return Array.from(materialsMap.values());
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

    // Recalculate totals if steps are provided
    if (updateData.steps && updateData.steps.length > 0) {
      const totalCostEstimate = updateData.steps.reduce((sum, step) => {
        const stepCost = step.estimatedCost || 0;
        const materialsCost = (step.materials || []).reduce(
          (matSum, mat) => matSum + (mat.estimatedCost || 0),
          0
        );
        return sum + stepCost + materialsCost;
      }, 0);

      const totalTime = updateData.steps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);

      // Calculate total time string
      const timeString = totalTime >= 60 
        ? `${Math.floor(totalTime / 60)} hour${Math.floor(totalTime / 60) > 1 ? 's' : ''} ${totalTime % 60 > 0 ? `${totalTime % 60} min` : ''}`
        : `${totalTime} minutes`;

      updateData.totalCostEstimate = totalCostEstimate;
      
      if (post.type === 'recipe') {
        updateData.cookingTime = timeString;
        updateData.ingredients = extractIngredientsFromSteps(updateData.steps);
      } else {
        updateData.estimatedTime = timeString;
        updateData.materials = extractMaterialsFromSteps(updateData.steps);
      }

      // Update cover image if it's in steps
      if (updateData.coverImage) {
        updateData.images = [updateData.coverImage];
      }
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

    // Validate steps (unified for both recipe and DIY)
    if (!post.steps || post.steps.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "At least one step is required for publishing" 
      });
    }

    // Validate that steps have required content
    const hasValidSteps = post.steps.every(step => step.title && step.instruction);
    if (!hasValidSteps) {
      return res.status(400).json({ 
        success: false, 
        message: "All steps must have both title and instructions" 
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

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: id });

    // Delete the post (likes are embedded in the post, so they'll be deleted automatically)
    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Post and all associated data deleted successfully"
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
    console.log('=== UPLOAD MEDIA DEBUG ===');
    console.log('User:', req.user ? req.user._id : 'No user');
    console.log('File:', req.file ? req.file.originalname : 'No file');
    console.log('Body:', req.body);

    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Please login first" 
      });
    }

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