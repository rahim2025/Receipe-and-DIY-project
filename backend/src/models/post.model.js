import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    default: ''
  }
});

const stepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true
  },
  instruction: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  video: {
    type: String,
    default: ''
  }
});

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    required: false,
    trim: true,
    default: '1'
  },
  optional: {
    type: Boolean,
    default: false
  },
  estimatedCost: {
    type: Number // in dollars
  }
});

const postSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['recipe', 'diy'],
    required: true
  },
  
  // Author Information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  coverImage: {
    type: String, // URL to main image
    required: false
  },
  images: [{
    type: String // Array of image URLs
  }],
  videos: [{
    type: String // Array of video URLs
  }],
  
  // Recipe-specific fields
  ingredients: [ingredientSchema],
  servings: {
    type: String,
    default: ''
  },
  cookingTime: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  
  // DIY-specific fields
  materials: [materialSchema],
  estimatedTime: {
    type: String,
    default: ''
  },
  
  // Common fields
  cookingSteps: [stepSchema], // For recipes
  instructions: [stepSchema], // For DIY
  difficulty: {
    type: String,
    default: 'beginner'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Cost Estimation
  totalCostEstimate: {
    type: Number, // in dollars
    default: 0,
    min: 0
  },
  costCurrency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'CNY']
  },
  costNotes: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Location and Regional Information
  location: {
    city: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    country: {
      type: String,
      default: ""
    },
    region: {
      type: String,
      default: "" // e.g., "Mediterranean", "Asian", "Southern US"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    displayLocation: {
      type: String,
      default: "" // e.g., "New York, NY, USA"
    }
  },
  
  // Regional/Cultural Tags
  cuisine: {
    type: String,
    default: "" // e.g., "Italian", "Mexican", "Indian"
  },
  culturalOrigin: {
    type: [String],
    default: [] // e.g., ["Traditional", "Family Recipe", "Regional Specialty"]
  },
  seasonality: {
    type: [String],
    default: [], // e.g., ["Spring", "Summer", "Holiday"]
    enum: ["Spring", "Summer", "Fall", "Winter", "Holiday", "Year-round"]
  },
  
  // Status and Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  
  // Engagement
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  
  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate slug and handle migration
postSchema.pre('save', function(next) {
  // Generate slug for new posts or when title changes
  if (this.isNew || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + 
      '-' + Math.random().toString(36).substr(2, 9);
  }
  
  // Migrate old 'steps' field to 'instructions' for DIY posts
  if (this.type === 'diy' && this.steps && this.steps.length > 0 && (!this.instructions || this.instructions.length === 0)) {
    this.instructions = this.steps;
    this.steps = undefined; // Clear the old field
  }
  
  // Ensure materials have valid quantities
  if (this.materials && this.materials.length > 0) {
    this.materials.forEach(material => {
      if (!material.quantity || material.quantity.trim() === '') {
        material.quantity = '1';
      }
    });
  }
  
  // Ensure ingredients have valid quantities if empty
  if (this.ingredients && this.ingredients.length > 0) {
    this.ingredients.forEach(ingredient => {
      if (ingredient.quantity === undefined || ingredient.quantity === null) {
        ingredient.quantity = '';
      }
    });
  }
  
  // Set published date when publishing
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Indexes for better query performance
postSchema.index({ author: 1, status: 1 });
postSchema.index({ type: 1, status: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ publishedAt: -1 });
// Note: slug index is already created by unique: true in schema definition

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for bookmark count
postSchema.virtual('bookmarkCount').get(function() {
  return this.bookmarks.length;
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.model("Post", postSchema);

export default Post;