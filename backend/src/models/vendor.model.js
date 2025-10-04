import mongoose from "mongoose";

const vendorHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  open: {
    type: String, // e.g., "09:00"
    default: ""
  },
  close: {
    type: String, // e.g., "18:00"
    default: ""
  },
  closed: {
    type: Boolean,
    default: false
  }
});

const vendorSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['grocery', 'farmers-market', 'craft-store', 'hardware', 'specialty-food', 'bakery', 'butcher', 'other'],
    required: true
  },
  
  // Contact Information
  phone: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  
  // Location
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      default: ""
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  
  // Business Details
  hours: [vendorHoursSchema],
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
  specialties: [{
    type: String,
    trim: true
  }],
  
  // Products/Services
  categories: [{
    type: String,
    enum: [
      'fresh-produce', 'organic', 'meat-seafood', 'dairy', 'bakery',
      'craft-supplies', 'fabric', 'wood', 'tools', 'paint',
      'ethnic-foods', 'spices', 'specialty-ingredients', 'bulk-items'
    ]
  }],
  
  // Ratings and Reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // User-Generated Content
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  
  // Social Features
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Metadata
  images: [{
    type: String // URLs to vendor images
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  checkIns: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for location-based queries
vendorSchema.index({ "address.coordinates": "2dsphere" });
vendorSchema.index({ "address.city": 1, "address.state": 1 });
vendorSchema.index({ type: 1, isActive: 1 });
vendorSchema.index({ categories: 1 });
vendorSchema.index({ rating: -1 });

// Virtual for full address
vendorSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street = '', city = '', state = '', zipCode = '', country = '' } = this.address;
  return `${street}, ${city}, ${state} ${zipCode}, ${country}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
});

// Virtual for follower count
vendorSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Ensure virtual fields are serialized
vendorSchema.set('toJSON', { virtuals: true });
vendorSchema.set('toObject', { virtuals: true });

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;