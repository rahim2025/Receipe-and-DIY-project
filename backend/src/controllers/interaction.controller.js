import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Share from "../models/share.model.js";
import mongoose from "mongoose";

// ============ LIKES SYSTEM ============
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const isLiked = post.likes.includes(userId);
    
    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter(id => !id.equals(userId));
    } else {
      // Like the post
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
    console.log("Error in toggleLike controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ COMMENTS SYSTEM ============
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentCommentId } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Create new comment
    const newComment = new Comment({
      post: postId,
      user: userId,
      text: text.trim(),
      parentComment: parentCommentId || null
    });

    await newComment.save();

    // Add comment to post
    post.comments.push(newComment._id);
    await post.save();

    // If it's a reply, add to parent comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        parentComment.replies.push(newComment._id);
        await parentComment.save();
      }
    }

    // Populate the comment with user data
    await newComment.populate('user', 'firstName lastName username profilePic');

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment
    });

  } catch (error) {
    console.log("Error in addComment controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get top-level comments (no parent)
    const comments = await Comment.find({
      post: postId,
      parentComment: null,
      isDeleted: false
    })
    .populate('user', 'firstName lastName username profilePic')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      populate: {
        path: 'user',
        select: 'firstName lastName username profilePic'
      },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const totalComments = await Comment.countDocuments({
      post: postId,
      parentComment: null,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / parseInt(limit)),
        totalComments,
        hasNextPage: skip + comments.length < totalComments
      }
    });

  } catch (error) {
    console.log("Error in getComments controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    const isLiked = comment.likes.includes(userId);
    
    if (isLiked) {
      comment.likes = comment.likes.filter(id => !id.equals(userId));
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      message: isLiked ? "Comment unliked" : "Comment liked",
      isLiked: !isLiked,
      likeCount: comment.likes.length
    });

  } catch (error) {
    console.log("Error in toggleCommentLike controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // Check if user owns the comment
    if (!comment.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this comment"
      });
    }

    // Update comment
    comment.text = text.trim();
    await comment.save(); // Pre-save middleware will handle isEdited and editedAt

    // Populate the comment with user data
    await comment.populate('user', 'firstName lastName username profilePic');

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment
    });

  } catch (error) {
    console.log("Error in editComment controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // Check if user owns the comment
    if (!comment.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment"
      });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });

  } catch (error) {
    console.log("Error in deleteComment controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ BOOKMARK SYSTEM ============
export const toggleBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const isBookmarked = post.bookmarks.includes(userId);
    
    if (isBookmarked) {
      post.bookmarks = post.bookmarks.filter(id => !id.equals(userId));
    } else {
      post.bookmarks.push(userId);
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: isBookmarked ? "Post removed from bookmarks" : "Post bookmarked",
      isBookmarked: !isBookmarked,
      bookmarkCount: post.bookmarks.length
    });

  } catch (error) {
    console.log("Error in toggleBookmark controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookmarkedPosts = await Post.find({
      bookmarks: userId,
      status: 'published'
    })
    .populate('author', 'firstName lastName username profilePic')
    .populate('bookmarks', 'firstName lastName username profilePic')
    .populate('likes', 'firstName lastName username profilePic')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts: bookmarkedPosts,
      count: bookmarkedPosts.length
    });

  } catch (error) {
    console.log("Error in getUserBookmarks controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ SHARING SYSTEM ============
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { platform, message, sharedWith } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Create share record
    const share = new Share({
      post: postId,
      sharedBy: userId,
      platform,
      message,
      sharedWith: sharedWith || [],
      shareUrl: `${req.protocol}://${req.get('host')}/posts/${post.slug}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await share.save();

    // Increment share count on post
    post.shares += 1;
    await post.save();

    res.status(201).json({
      success: true,
      message: "Post shared successfully",
      shareUrl: share.shareUrl,
      shareCount: post.shares
    });

  } catch (error) {
    console.log("Error in sharePost controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getPostEngagement = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('likes', 'firstName lastName username profilePic')
      .populate('bookmarks', 'firstName lastName username profilePic');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const commentCount = await Comment.countDocuments({
      post: postId,
      isDeleted: false
    });

    const shareCount = await Share.countDocuments({ post: postId });

    res.status(200).json({
      success: true,
      engagement: {
        likes: post.likes,
        likeCount: post.likes.length,
        bookmarks: post.bookmarks,
        bookmarkCount: post.bookmarks.length,
        commentCount,
        shareCount: post.shares,
        views: post.views
      }
    });

  } catch (error) {
    console.log("Error in getPostEngagement controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const incrementPostViews = async (req, res) => {
  try {
    const { postId } = req.params;

    await Post.findByIdAndUpdate(postId, {
      $inc: { views: 1 }
    });

    res.status(200).json({
      success: true,
      message: "View count updated"
    });

  } catch (error) {
    console.log("Error in incrementPostViews controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};