import Vendor from "../models/vendor.model.js";
import User from "../models/user.model.js";
import { geocodeWithFallback } from "../lib/geocoding.js";
import mongoose from "mongoose";

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ============ CREATE VENDOR ============
export const createVendor = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      contact,
      address,
      businessHours,
      hours,
      priceRange,
      specialties,
      categories,
      images,
      tags,
      // Legacy fields for backward compatibility
      phone,
      email,
      website
    } = req.body;

    // Validation
    if (!name || !type || !address || !address.street || !address.city || !address.state || !address.country) {
      return res.status(400).json({
        success: false,
        message: "Name, type, and complete address are required"
      });
    }

    // Handle contact information from either structure
    const contactInfo = contact || {};
    const vendorPhone = contactInfo.phone || phone || "";
    const vendorEmail = contactInfo.email || email || "";
    const vendorWebsite = contactInfo.website || website || "";

    // Generate coordinates from address using geocoding
    let coordinates = address.coordinates;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      try {
        console.log('Geocoding address for vendor:', JSON.stringify(address, null, 2));
        coordinates = await geocodeWithFallback(address);
        console.log('Generated coordinates:', coordinates);
        
        if (!coordinates) {
          throw new Error('Geocoding returned null coordinates');
        }
      } catch (geocodingError) {
        console.error('Geocoding failed:', geocodingError.message);
        return res.status(400).json({
          success: false,
          message: `Could not determine location coordinates for the provided address. Please ensure you provide at least a city and state/country. Error: ${geocodingError.message}`
        });
      }
    }
    
    // Final validation of coordinates
    if (!Array.isArray(coordinates) || coordinates.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates generated. Please provide a more complete address (city, state, country)."
      });
    }

    // Handle business hours - convert from frontend format to backend format
    let vendorHours = hours || [];
    if (businessHours && Object.keys(businessHours).length > 0) {
      vendorHours = Object.entries(businessHours).map(([day, schedule]) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1), // Capitalize first letter
        open: schedule.closed ? null : schedule.open,
        close: schedule.closed ? null : schedule.close,
        closed: schedule.closed || false
      }));
    }

    const newVendor = new Vendor({
      name,
      description: description || "",
      type,
      phone: vendorPhone,
      email: vendorEmail,
      website: vendorWebsite,
      address: {
        ...address,
        coordinates: coordinates
      },
      hours: vendorHours,
      priceRange: priceRange || "$$",
      specialties: specialties || [],
      categories: categories || [],
      images: images || [],
      tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
      addedBy: req.user ? req.user._id : null
    });

    await newVendor.save();
    
    if (newVendor.addedBy) {
      await newVendor.populate('addedBy', 'firstName lastName username');
    }

    res.status(201).json({
      success: true,
      message: "Vendor added successfully",
      vendor: newVendor
    });

  } catch (error) {
    console.log("Error in createVendor controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ GET VENDORS BY LOCATION ============
export const getVendorsByLocation = async (req, res) => {
  try {
    const { 
      lat,
      lng,
      longitude, 
      latitude, 
      maxDistance,
      radius = maxDistance || 10000, // 10km default, support both parameter names
      type,
      categories,
      priceRange,
      limit = 20
    } = req.query;

    // Support both parameter formats (lat/lng and latitude/longitude)
    const queryLat = lat || latitude;
    const queryLng = lng || longitude;

    // Build query
    let query = { isActive: true };

    // Location filter (only if coordinates provided)
    if (queryLng && queryLat) {
      query["address.coordinates"] = {
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
    if (type) query.type = type;
    if (categories) query.categories = { $in: categories.split(',') };
    if (priceRange) query.priceRange = priceRange;

    const vendors = await Vendor.find(query)
      .populate('addedBy', 'firstName lastName username')
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    // Calculate distances (only if user location is provided)
    const vendorsWithDistance = vendors.map(vendor => {
      let distance = null;
      
      if (queryLat && queryLng && vendor.address.coordinates && vendor.address.coordinates.length === 2) {
        distance = calculateDistance(
          parseFloat(queryLat),
          parseFloat(queryLng),
          vendor.address.coordinates[1],
          vendor.address.coordinates[0]
        );
        distance = Math.round(distance * 100) / 100; // Round to 2 decimal places
      }
      
      return {
        ...vendor.toObject(),
        distance
      };
    });

    res.status(200).json({
      success: true,
      vendors: vendorsWithDistance,
      count: vendorsWithDistance.length
    });

  } catch (error) {
    console.log("Error in getVendorsByLocation controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ GET VENDOR BY ID ============
export const getVendorById = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId)
      .populate('addedBy', 'firstName lastName username profilePic')
      .populate('followers', 'firstName lastName username profilePic');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    // Increment view count
    vendor.views += 1;
    await vendor.save();

    res.status(200).json({
      success: true,
      vendor
    });

  } catch (error) {
    console.log("Error in getVendorById controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ SEARCH VENDORS ============
export const searchVendors = async (req, res) => {
  try {
    const { 
      q, 
      city, 
      state, 
      type, 
      categories,
      limit = 20 
    } = req.query;

    let query = { isActive: true };

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { specialties: { $in: [new RegExp(q, 'i')] } },
        { tags: { $in: [q.toLowerCase()] } }
      ];
    }

    // Location filters
    if (city) query["address.city"] = { $regex: city, $options: 'i' };
    if (state) query["address.state"] = { $regex: state, $options: 'i' };

    // Type and category filters
    if (type) query.type = type;
    if (categories) query.categories = { $in: categories.split(',') };

    const vendors = await Vendor.find(query)
      .populate('addedBy', 'firstName lastName username')
      .limit(parseInt(limit))
      .sort({ rating: -1, reviewCount: -1 });

    res.status(200).json({
      success: true,
      vendors,
      count: vendors.length
    });

  } catch (error) {
    console.log("Error in searchVendors controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============ FOLLOW/UNFOLLOW VENDOR ============
export const toggleFollowVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const userId = req.user._id;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    const isFollowing = vendor.followers.includes(userId);

    if (isFollowing) {
      vendor.followers = vendor.followers.filter(id => !id.equals(userId));
    } else {
      vendor.followers.push(userId);
    }

    await vendor.save();

    res.status(200).json({
      success: true,
      message: isFollowing ? "Vendor unfollowed" : "Vendor followed",
      isFollowing: !isFollowing,
      followerCount: vendor.followers.length
    });

  } catch (error) {
    console.log("Error in toggleFollowVendor controller: ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Test geocoding functionality
export const testGeocode = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required"
      });
    }
    
    console.log('Testing geocoding for:', address);
    const coordinates = await geocodeWithFallback(address);
    
    res.status(200).json({
      success: true,
      address,
      coordinates,
      message: "Geocoding successful"
    });
    
  } catch (error) {
    console.log("Error in testGeocode controller: ", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  createVendor,
  getVendorsByLocation,
  getVendorById,
  searchVendors,
  toggleFollowVendor
};