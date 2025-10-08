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

// Unified step schema for both recipes and DIY projects
const stepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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
  },
  estimatedTime: {
    type: Number, // Time in minutes for this specific step
    default: 0
  },
  estimatedCost: {
    type: Number, // Cost for materials/ingredients in this step
    default: 0
  },
  notes: {
    type: String, // Additional tips or warnings for this step
    trim: true,
    default: ''
  },
  materials: [{ // Materials/ingredients needed for this step
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
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    calories: {
      type: Number,
      default: 0
    }
  }]
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
  
  // Unified step-by-step system (replaces cookingSteps and instructions)
  steps: [stepSchema], // Unified steps for both recipes and DIY
  
  // Legacy fields (kept for backward compatibility during migration)
  cookingSteps: [stepSchema], // For recipes (deprecated - use steps)
  instructions: [stepSchema], // For DIY (deprecated - use steps)
  
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
  
  // Nutrition Information
  totalCalories: {
    type: Number, // total calories for recipes
    default: 0,
    min: 0
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
  
  // MIGRATION: Migrate from old separate step arrays to unified steps array
  if (!this.steps || this.steps.length === 0) {
    if (this.type === 'recipe' && this.cookingSteps && this.cookingSteps.length > 0) {
      // Migrate recipe cookingSteps to unified steps
      this.steps = this.cookingSteps.map(step => ({
        stepNumber: step.stepNumber,
        title: step.instruction.substring(0, 100), // Use first part of instruction as title
        instruction: step.instruction,
        image: step.image || '',
        video: step.video || '',
        estimatedTime: 0,
        estimatedCost: 0,
        notes: '',
        materials: [] // Will be populated from ingredients if needed
      }));
    } else if (this.type === 'diy' && this.instructions && this.instructions.length > 0) {
      // Migrate DIY instructions to unified steps
      this.steps = this.instructions.map(step => ({
        stepNumber: step.stepNumber,
        title: step.instruction.substring(0, 100), // Use first part of instruction as title
        instruction: step.instruction,
        image: step.image || '',
        video: step.video || '',
        estimatedTime: 0,
        estimatedCost: 0,
        notes: '',
        materials: [] // Will be populated from materials if needed
      }));
    }
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
  
  // Ensure all steps have required fields with defaults
  if (this.steps && this.steps.length > 0) {
    this.steps.forEach(step => {
      if (!step.title) {
        step.title = step.instruction.substring(0, 100);
      }
      if (step.estimatedTime === undefined) step.estimatedTime = 0;
      if (step.estimatedCost === undefined) step.estimatedCost = 0;
      if (!step.notes) step.notes = '';
      if (!step.materials) step.materials = [];
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

// Virtual for total time (sum of all step times)
postSchema.virtual('totalStepTime').get(function() {
  if (!this.steps || this.steps.length === 0) return 0;
  return this.steps.reduce((total, step) => total + (step.estimatedTime || 0), 0);
});

// Virtual for total step cost (sum of all step costs)
postSchema.virtual('totalStepCost').get(function() {
  if (!this.steps || this.steps.length === 0) return 0;
  return this.steps.reduce((total, step) => total + (step.estimatedCost || 0), 0);
});

// Virtual for aggregated materials from all steps
postSchema.virtual('allStepMaterials').get(function() {
  if (!this.steps || this.steps.length === 0) return [];
  
  const materialsMap = new Map();
  
  this.steps.forEach(step => {
    if (step.materials && step.materials.length > 0) {
      step.materials.forEach(material => {
        const key = `${material.name.toLowerCase()}-${material.unit}`;
        if (materialsMap.has(key)) {
          const existing = materialsMap.get(key);
          const existingQty = parseFloat(existing.quantity) || 0;
          const newQty = parseFloat(material.quantity) || 0;
          existing.quantity = (existingQty + newQty).toString();
          existing.estimatedCost = (existing.estimatedCost || 0) + (material.estimatedCost || 0);
          existing.calories = (existing.calories || 0) + (material.calories || 0);
        } else {
          materialsMap.set(key, {
            name: material.name,
            quantity: material.quantity,
            unit: material.unit,
            estimatedCost: material.estimatedCost || 0,
            calories: material.calories || 0
          });
        }
      });
    }
  });
  
  return Array.from(materialsMap.values());
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.model("Post", postSchema);

export default Post;