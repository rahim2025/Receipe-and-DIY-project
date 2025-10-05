import VendorReview from "../models/vendorReview.model.js";
import Vendor from "../models/vendor.model.js";

// ============ CREATE REVIEW ============
export const createReview = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    console.log('Create review request:', { vendorId, rating, comment, userId });

    // Validation
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    // Check if user already reviewed this vendor
    const existingReview = await VendorReview.findOne({
      vendor: vendorId,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this vendor. You can edit your existing review instead."
      });
    }

    // Create review
    const review = new VendorReview({
      vendor: vendorId,
      user: userId,
      rating,
      comment
    });

    await review.save();

    // Update vendor rating
    await updateVendorRating(vendorId);

    // Populate user info
    await review.populate('user', 'firstName lastName username profilePic');

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review
    });

  } catch (error) {
    console.log("Error in createReview controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ GET VENDOR REVIEWS ============
export const getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { 
      sort = 'recent', // recent, helpful, highest, lowest
      limit = 10,
      page = 1 
    } = req.query;

    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'helpful':
        sortCriteria = { helpfulVotes: -1, createdAt: -1 };
        break;
      case 'highest':
        sortCriteria = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortCriteria = { rating: 1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sortCriteria = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await VendorReview.find({ 
      vendor: vendorId,
      isHidden: false 
    })
      .populate('user', 'firstName lastName username profilePic')
      .populate('response.respondedBy', 'firstName lastName username')
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .skip(skip);

    const totalReviews = await VendorReview.countDocuments({ 
      vendor: vendorId,
      isHidden: false 
    });

    // Get rating distribution
    const ratingDistribution = await VendorReview.aggregate([
      { 
        $match: { 
          vendor: vendorId,
          isHidden: false 
        } 
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total: totalReviews,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalReviews / parseInt(limit))
      },
      ratingDistribution
    });

  } catch (error) {
    console.log("Error in getVendorReviews controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ UPDATE REVIEW ============
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    console.log('Update review request:', { reviewId, rating, comment, userId });

    const review = await VendorReview.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns the review
    if (!review.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reviews"
      });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5"
        });
      }
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment;
    
    review.isEdited = true;
    await review.save();

    // Update vendor rating
    await updateVendorRating(review.vendor);

    await review.populate('user', 'firstName lastName username profilePic');

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review
    });

  } catch (error) {
    console.log("Error in updateReview controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ DELETE REVIEW ============
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await VendorReview.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns the review
    if (!review.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews"
      });
    }

    const vendorId = review.vendor;
    await review.deleteOne();

    // Update vendor rating
    await updateVendorRating(vendorId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });

  } catch (error) {
    console.log("Error in deleteReview controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ TOGGLE HELPFUL VOTE ============
export const toggleHelpfulVote = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await VendorReview.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    const hasVoted = review.helpfulVotes.includes(userId);

    if (hasVoted) {
      review.helpfulVotes = review.helpfulVotes.filter(id => !id.equals(userId));
    } else {
      review.helpfulVotes.push(userId);
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: hasVoted ? "Helpful vote removed" : "Marked as helpful",
      helpfulCount: review.helpfulVotes.length,
      hasVoted: !hasVoted
    });

  } catch (error) {
    console.log("Error in toggleHelpfulVote controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ ADD VENDOR RESPONSE ============
export const addVendorResponse = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Response text is required"
      });
    }

    const review = await VendorReview.findById(reviewId).populate('vendor');
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user is the vendor owner
    if (!review.vendor.addedBy.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the vendor owner can respond to reviews"
      });
    }

    review.response = {
      text,
      respondedBy: userId,
      respondedAt: new Date()
    };

    await review.save();
    await review.populate('response.respondedBy', 'firstName lastName username');

    res.status(200).json({
      success: true,
      message: "Response added successfully",
      review
    });

  } catch (error) {
    console.log("Error in addVendorResponse controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ GET USER'S REVIEW FOR VENDOR ============
export const getUserReview = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const userId = req.user._id;

    const review = await VendorReview.findOne({
      vendor: vendorId,
      user: userId
    }).populate('user', 'firstName lastName username profilePic');

    res.status(200).json({
      success: true,
      review: review || null
    });

  } catch (error) {
    console.log("Error in getUserReview controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ HELPER: UPDATE VENDOR RATING ============
const updateVendorRating = async (vendorId) => {
  try {
    const reviews = await VendorReview.find({ 
      vendor: vendorId,
      isHidden: false 
    });

    if (reviews.length === 0) {
      await Vendor.findByIdAndUpdate(vendorId, {
        rating: 0,
        reviewCount: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Vendor.findByIdAndUpdate(vendorId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length
    });

  } catch (error) {
    console.error("Error updating vendor rating:", error.message);
  }
};

export default {
  createReview,
  getVendorReviews,
  updateReview,
  deleteReview,
  toggleHelpfulVote,
  addVendorResponse,
  getUserReview
};
