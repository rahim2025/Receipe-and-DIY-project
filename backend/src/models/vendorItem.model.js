import mongoose from "mongoose";

const vendorItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item name is required"],
    trim: true,
    maxLength: [100, "Item name cannot exceed 100 characters"]
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: [
      // Recipe ingredients
      'vegetable', 'fruit', 'meat', 'seafood', 'dairy', 'grain', 'spice', 'herb', 
      'condiment', 'oil', 'vinegar', 'baking', 'beverage', 'snack', 'frozen',
      'canned', 'dry-goods', 'specialty-food',
      
      // DIY materials
      'fabric', 'yarn', 'thread', 'button', 'zipper', 'trim', 'paper', 'cardboard',
      'wood', 'metal', 'plastic', 'glass', 'ceramic', 'stone', 'adhesive', 'paint',
      'brush', 'tool', 'hardware', 'electronic', 'craft-supply', 'jewelry-supply',
      'scrapbook', 'art-supply', 'sewing-supply', 'knitting', 'embroidery',
      
      // General categories
      'other'
    ]
  },
  type: {
    type: String,
    required: [true, "Type is required"],
    enum: ['ingredient', 'material'],
    default: 'ingredient'
  },
  description: {
    type: String,
    maxLength: [500, "Description cannot exceed 500 characters"],
    trim: true
  },
  price: {
    min: {
      type: Number,
      min: [0, "Price cannot be negative"]
    },
    max: {
      type: Number,
      min: [0, "Price cannot be negative"]
    },
    currency: {
      type: String,
      default: 'BDT',
      enum: ['BDT', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'MXN']
    },
    unit: {
      type: String,
      enum: ['each', 'lb', 'kg', 'oz', 'g', 'yard', 'meter', 'foot', 'inch', 'liter', 'ml', 'gallon', 'pack', 'bundle', 'set']
    }
  },
  availability: {
    inStock: {
      type: Boolean,
      default: true
    },
    seasonal: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      maxLength: [200, "Availability notes cannot exceed 200 characters"]
    }
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, "Vendor reference is required"]
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User reference is required"]
  },
  tags: {
    type: [{
      type: String,
      trim: true,
      lowercase: true,
      maxLength: [30, "Tag cannot exceed 30 characters"]
    }],
    default: []
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ratings: {
    type: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      accuracy: {
        type: Number,
        min: 1,
        max: 5
      },
      freshness: {
        type: Number,
        min: 1,
        max: 5
      },
      value: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxLength: [300, "Comment cannot exceed 300 characters"]
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
vendorItemSchema.index({ vendor: 1, category: 1 });
vendorItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
vendorItemSchema.index({ type: 1, category: 1 });
vendorItemSchema.index({ 'availability.inStock': 1 });
vendorItemSchema.index({ addedBy: 1 });

// Virtual for formatted price
vendorItemSchema.virtual('formattedPrice').get(function() {
  if (!this.price || (!this.price.min && !this.price.max)) {
    return 'Price not available';
  }
  
  const formatPrice = (amount) => {
    const symbol = this.price.currency === 'BDT' ? '৳' :
                   this.price.currency === 'USD' ? '$' : 
                   this.price.currency === 'EUR' ? '€' : 
                   this.price.currency === 'GBP' ? '£' : 
                   this.price.currency;
    return `${symbol}${amount.toFixed(2)}`;
  };
  
  if (this.price.min && this.price.max && this.price.min !== this.price.max) {
    return `${formatPrice(this.price.min)} - ${formatPrice(this.price.max)}`;
  } else {
    const price = this.price.min || this.price.max;
    return formatPrice(price);
  }
});

// Calculate average rating when ratings change
vendorItemSchema.methods.calculateAverageRating = function() {
  if (!this.ratings || !Array.isArray(this.ratings) || this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
    return;
  }
  
  const totalScore = this.ratings.reduce((sum, rating) => {
    if (rating && rating.accuracy && rating.freshness && rating.value) {
      const avgRating = (rating.accuracy + rating.freshness + rating.value) / 3;
      return sum + avgRating;
    }
    return sum;
  }, 0);
  
  this.averageRating = totalScore / this.ratings.length;
  this.totalRatings = this.ratings.length;
};

// Pre-save middleware to calculate average rating
vendorItemSchema.pre('save', function(next) {
  if (this.isModified('ratings')) {
    this.calculateAverageRating();
  }
  next();
});

const VendorItem = mongoose.model("VendorItem", vendorItemSchema);

export default VendorItem;