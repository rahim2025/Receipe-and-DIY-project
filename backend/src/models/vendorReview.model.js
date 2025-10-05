import mongoose from "mongoose";

const vendorReviewSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  // Helpful votes
  helpfulVotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Response from vendor owner
  response: {
    text: {
      type: String,
      trim: true,
      maxlength: 500
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  // Moderation
  isEdited: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
vendorReviewSchema.index({ vendor: 1, createdAt: -1 });
vendorReviewSchema.index({ user: 1 });
vendorReviewSchema.index({ rating: -1 });

// Prevent duplicate reviews from same user for same vendor
vendorReviewSchema.index({ vendor: 1, user: 1 }, { unique: true });

// Virtual for helpful votes count
vendorReviewSchema.virtual('helpfulCount').get(function() {
  return this.helpfulVotes ? this.helpfulVotes.length : 0;
});

// Ensure virtual fields are serialized
vendorReviewSchema.set('toJSON', { virtuals: true });
vendorReviewSchema.set('toObject', { virtuals: true });

const VendorReview = mongoose.model("VendorReview", vendorReviewSchema);

export default VendorReview;
