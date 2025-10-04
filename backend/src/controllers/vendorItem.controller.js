import VendorItem from "../models/vendorItem.model.js";
import Vendor from "../models/vendor.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Add new item to vendor
export const addVendorItem = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { name, category, type, description, price, availability, tags } = req.body;
    
    // Validate required fields
    if (!name || !category || !type) {
      return res.status(400).json({
        success: false,
        message: "Name, category, and type are required"
      });
    }
    
    // Validate name length
    if (name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Item name cannot be empty"
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
    
    // Sanitize price object
    const sanitizedPrice = {};
    if (price && typeof price === 'object') {
      if (price.min && !isNaN(parseFloat(price.min))) {
        sanitizedPrice.min = parseFloat(price.min);
      }
      if (price.max && !isNaN(parseFloat(price.max))) {
        sanitizedPrice.max = parseFloat(price.max);
      }
      if (price.currency) {
        sanitizedPrice.currency = price.currency;
      }
      if (price.unit) {
        sanitizedPrice.unit = price.unit;
      }
    }
    
    // Sanitize availability object
    const sanitizedAvailability = {
      inStock: true,
      seasonal: false,
      notes: ""
    };
    if (availability && typeof availability === 'object') {
      sanitizedAvailability.inStock = Boolean(availability.inStock);
      sanitizedAvailability.seasonal = Boolean(availability.seasonal);
      if (availability.notes && typeof availability.notes === 'string') {
        sanitizedAvailability.notes = availability.notes.trim();
      }
    }

    // Create new vendor item
    const newItem = new VendorItem({
      name: name.trim(),
      category,
      type,
      description: description?.trim() || "",
      price: sanitizedPrice,
      availability: sanitizedAvailability,
      tags: Array.isArray(tags) ? tags.filter(tag => tag && typeof tag === 'string').map(tag => tag.trim()) : [],
      vendor: vendorId,
      addedBy: req.user._id
    });
    
    await newItem.save();
    
    // Populate the response
    const populatedItem = await VendorItem.findById(newItem._id)
      .populate('addedBy', 'firstName lastName username')
      .populate('vendor', 'name');
    
    res.status(201).json({
      success: true,
      message: "Item added successfully",
      item: populatedItem
    });
    
  } catch (error) {
    console.error("Error in addVendorItem controller: ", error);
    console.error("Request body:", req.body);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get all items for a vendor
export const getVendorItems = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { 
      category, 
      type, 
      inStock, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = req.query;
    
    // Build query
    let query = { vendor: vendorId };
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (inStock !== undefined) query['availability.inStock'] = inStock === 'true';
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const items = await VendorItem.find(query)
      .populate('addedBy', 'firstName lastName username')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const totalItems = await VendorItem.countDocuments(query);
    
    res.status(200).json({
      success: true,
      items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.log("Error in getVendorItems controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get single vendor item
export const getVendorItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = await VendorItem.findById(itemId)
      .populate('addedBy', 'firstName lastName username')
      .populate('vendor', 'name address')
      .populate('ratings.user', 'firstName lastName username');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }
    
    res.status(200).json({
      success: true,
      item
    });
    
  } catch (error) {
    console.log("Error in getVendorItem controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update vendor item (only by item creator or vendor owner)
export const updateVendorItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;
    
    const item = await VendorItem.findById(itemId).populate('vendor');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }
    
    // Check permissions (item creator or vendor owner)
    const isItemCreator = item.addedBy.toString() === req.user._id.toString();
    const isVendorOwner = item.vendor.addedBy.toString() === req.user._id.toString();
    
    if (!isItemCreator && !isVendorOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this item"
      });
    }
    
    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'price', 'availability', 'tags'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        item[key] = updates[key];
      }
    });
    
    await item.save();
    
    const updatedItem = await VendorItem.findById(itemId)
      .populate('addedBy', 'firstName lastName username')
      .populate('vendor', 'name');
    
    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      item: updatedItem
    });
    
  } catch (error) {
    console.log("Error in updateVendorItem controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete vendor item
export const deleteVendorItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = await VendorItem.findById(itemId).populate('vendor');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }
    
    // Check permissions (item creator or vendor owner)
    const isItemCreator = item.addedBy.toString() === req.user._id.toString();
    const isVendorOwner = item.vendor.addedBy.toString() === req.user._id.toString();
    
    if (!isItemCreator && !isVendorOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this item"
      });
    }
    
    await VendorItem.findByIdAndDelete(itemId);
    
    res.status(200).json({
      success: true,
      message: "Item deleted successfully"
    });
    
  } catch (error) {
    console.log("Error in deleteVendorItem controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Add rating to vendor item
export const rateVendorItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { accuracy, freshness, value, comment } = req.body;
    
    // Validate ratings
    if (!accuracy || !freshness || !value) {
      return res.status(400).json({
        success: false,
        message: "All rating aspects (accuracy, freshness, value) are required"
      });
    }
    
    if ([accuracy, freshness, value].some(rating => rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Ratings must be between 1 and 5"
      });
    }
    
    const item = await VendorItem.findById(itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }
    
    // Check if user already rated this item
    const existingRatingIndex = item.ratings.findIndex(
      rating => rating.user.toString() === req.user._id.toString()
    );
    
    const newRating = {
      user: req.user._id,
      accuracy,
      freshness,
      value,
      comment: comment || ""
    };
    
    if (existingRatingIndex > -1) {
      // Update existing rating
      item.ratings[existingRatingIndex] = newRating;
    } else {
      // Add new rating
      item.ratings.push(newRating);
    }
    
    await item.save();
    
    const updatedItem = await VendorItem.findById(itemId)
      .populate('addedBy', 'firstName lastName username')
      .populate('vendor', 'name')
      .populate('ratings.user', 'firstName lastName username');
    
    res.status(200).json({
      success: true,
      message: existingRatingIndex > -1 ? "Rating updated successfully" : "Rating added successfully",
      item: updatedItem
    });
    
  } catch (error) {
    console.log("Error in rateVendorItem controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Search items across all vendors
export const searchVendorItems = async (req, res) => {
  try {
    const { 
      search,
      category,
      type,
      inStock,
      minPrice,
      maxPrice,
      lat,
      lng,
      maxDistance = 10000, // 10km default
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Build query
    let query = {};
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (inStock !== undefined) query['availability.inStock'] = inStock === 'true';
    
    // Price range
    if (minPrice || maxPrice) {
      query.$or = [];
      if (minPrice) {
        query.$or.push(
          { 'price.min': { $gte: parseFloat(minPrice) } },
          { 'price.max': { $gte: parseFloat(minPrice) } }
        );
      }
      if (maxPrice) {
        query.$or.push(
          { 'price.min': { $lte: parseFloat(maxPrice) } },
          { 'price.max': { $lte: parseFloat(maxPrice) } }
        );
      }
    }
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Location-based search
    let pipeline = [{ $match: query }];
    
    if (lat && lng) {
      pipeline.unshift({
        $lookup: {
          from: 'vendors',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      });
      
      pipeline.push({
        $match: {
          'vendorInfo.address.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
              },
              $maxDistance: parseInt(maxDistance)
            }
          }
        }
      });
    }
    
    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortOptions });
    
    // Pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: parseInt(limit) });
    
    // Populate
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'addedBy',
        pipeline: [{ $project: { firstName: 1, lastName: 1, username: 1 } }]
      }
    });
    
    pipeline.push({
      $lookup: {
        from: 'vendors',
        localField: 'vendor',
        foreignField: '_id',
        as: 'vendor',
        pipeline: [{ $project: { name: 1, address: 1 } }]
      }
    });
    
    const items = await VendorItem.aggregate(pipeline);
    
    // Get total count for pagination
    const countPipeline = [{ $match: query }];
    if (lat && lng) {
      countPipeline.unshift({
        $lookup: {
          from: 'vendors',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      });
      countPipeline.push({
        $match: {
          'vendorInfo.address.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
              },
              $maxDistance: parseInt(maxDistance)
            }
          }
        }
      });
    }
    countPipeline.push({ $count: 'total' });
    
    const countResult = await VendorItem.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].total : 0;
    
    res.status(200).json({
      success: true,
      items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.log("Error in searchVendorItems controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get categories and their counts
export const getItemCategories = async (req, res) => {
  try {
    const { type, vendorId } = req.query;
    
    let matchQuery = {};
    if (type) matchQuery.type = type;
    if (vendorId) matchQuery.vendor = new mongoose.Types.ObjectId(vendorId);
    
    const categories = await VendorItem.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      categories: categories.map(cat => ({
        category: cat._id,
        count: cat.count
      }))
    });
    
  } catch (error) {
    console.log("Error in getItemCategories controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};