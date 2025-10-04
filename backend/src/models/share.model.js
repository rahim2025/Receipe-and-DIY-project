import mongoose from "mongoose";

const shareSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'twitter', 'instagram', 'whatsapp', 'email', 'copy-link', 'pinterest', 'internal'],
    required: true
  },
  
  // Internal sharing (within the app)
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  message: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Analytics
  clickCount: {
    type: Number,
    default: 0
  },
  
  // Share metadata
  shareUrl: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
shareSchema.index({ post: 1, createdAt: -1 });
shareSchema.index({ sharedBy: 1 });
shareSchema.index({ platform: 1 });

const Share = mongoose.model("Share", shareSchema);

export default Share;