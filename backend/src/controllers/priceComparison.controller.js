import VendorItem from "../models/vendorItem.model.js";
import Vendor from "../models/vendor.model.js";

// Search for items across all vendors for price comparison
export const searchItemsForComparison = async (req, res) => {
  try {
    console.log('Price comparison search request:', req.query);
    
    const { 
      name, 
      category, 
      type, 
      inStockOnly = false, 
      minPrice, 
      maxPrice, 
      sortBy = 'price', // price, distance, rating
      userLocation,
      priceUnit
    } = req.query;

    // Build search query
    let searchQuery = {};
    
    if (name) {
      searchQuery.$or = [
        { name: { $regex: name, $options: 'i' } },
        { tags: { $in: [new RegExp(name, 'i')] } }
      ];
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    if (type) {
      searchQuery.type = type;
    }
    
    if (inStockOnly === 'true') {
      searchQuery['availability.inStock'] = true;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.$and = searchQuery.$and || [];
      if (minPrice) {
        searchQuery.$and.push({
          $or: [
            { 'price.min': { $gte: parseFloat(minPrice) } },
            { 'price.max': { $gte: parseFloat(minPrice) } }
          ]
        });
      }
      if (maxPrice) {
        searchQuery.$and.push({
          $or: [
            { 'price.min': { $lte: parseFloat(maxPrice) } },
            { 'price.max': { $lte: parseFloat(maxPrice) } }
          ]
        });
      }
    }

    // Filter by price unit if specified
    if (priceUnit) {
      searchQuery['price.unit'] = priceUnit;
    }

    console.log('Search query:', JSON.stringify(searchQuery, null, 2));

    // Check if VendorItem model is accessible
    const totalCount = await VendorItem.countDocuments();
    console.log('Total vendor items in database:', totalCount);

    // Execute search with vendor population
    let items = await VendorItem.find(searchQuery)
      .populate({
        path: 'vendor',
        select: 'name type location address phone rating followerCount'
      })
      .populate({
        path: 'addedBy',
        select: 'fullName'
      })
      .lean();

    // Filter out items where vendor is null (in case vendor was deleted)
    items = items.filter(item => item.vendor);

    // Calculate distance if user location is provided
    if (userLocation) {
      const [userLng, userLat] = userLocation.split(',').map(parseFloat);
      
      items = items.map(item => {
        if (item.vendor.location?.coordinates) {
          const [vendorLng, vendorLat] = item.vendor.location.coordinates;
          const distance = calculateDistance(userLat, userLng, vendorLat, vendorLng);
          return { ...item, distance: Math.round(distance * 100) / 100 };
        }
        return { ...item, distance: null };
      });
    }

    // Sort results
    switch (sortBy) {
      case 'price':
        items.sort((a, b) => {
          const priceA = a.price.min || a.price.max || 0;
          const priceB = b.price.min || b.price.max || 0;
          return priceA - priceB;
        });
        break;
      case 'distance':
        if (userLocation) {
          items.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }
        break;
      case 'rating':
        items.sort((a, b) => {
          const ratingA = a.vendor.rating || 0;
          const ratingB = b.vendor.rating || 0;
          return ratingB - ratingA;
        });
        break;
      case 'vendorRating':
        items.sort((a, b) => {
          const avgRatingA = a.averageRating || 0;
          const avgRatingB = b.averageRating || 0;
          return avgRatingB - avgRatingA;
        });
        break;
      default:
        // Default to price sorting
        items.sort((a, b) => {
          const priceA = a.price.min || a.price.max || 0;
          const priceB = b.price.min || b.price.max || 0;
          return priceA - priceB;
        });
    }

    // Group by item name for better comparison view
    const groupedItems = {};
    items.forEach(item => {
      const key = `${item.name.toLowerCase()}_${item.category}_${item.type}`;
      if (!groupedItems[key]) {
        groupedItems[key] = {
          itemName: item.name,
          category: item.category,
          type: item.type,
          vendors: []
        };
      }
      groupedItems[key].vendors.push({
        itemId: item._id,
        vendor: item.vendor,
        price: item.price,
        availability: item.availability,
        description: item.description,
        tags: item.tags,
        averageRating: item.averageRating,
        ratingsCount: item.ratings?.length || 0,
        addedBy: item.addedBy,
        distance: item.distance,
        updatedAt: item.updatedAt
      });
    });

    // Convert to array and sort by number of vendors (most options first)
    const comparisonResults = Object.values(groupedItems)
      .sort((a, b) => b.vendors.length - a.vendors.length);

    res.status(200).json({
      success: true,
      data: {
        results: comparisonResults,
        totalItems: items.length,
        totalUniqueItems: comparisonResults.length,
        searchCriteria: {
          name,
          category,
          type,
          inStockOnly,
          minPrice,
          maxPrice,
          sortBy,
          priceUnit
        }
      }
    });

  } catch (error) {
    console.error("Error in searchItemsForComparison:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during price comparison search",
      error: error.message
    });
  }
};

// Get price statistics for a specific item
export const getItemPriceStats = async (req, res) => {
  try {
    const { name, category, type } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Item name is required"
      });
    }

    let query = {
      name: { $regex: name, $options: 'i' }
    };
    
    if (category) query.category = category;
    if (type) query.type = type;

    const items = await VendorItem.find(query)
      .populate('vendor', 'name rating')
      .lean();

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No items found matching the criteria"
      });
    }

    // Calculate price statistics
    const prices = items
      .map(item => item.price.min || item.price.max || 0)
      .filter(price => price > 0);

    const stats = {
      itemName: name,
      category: category || 'all',
      type: type || 'all',
      vendorCount: items.length,
      priceStats: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
        median: calculateMedian(prices)
      },
      commonUnits: getCommonUnits(items),
      availabilityStats: {
        inStock: items.filter(item => item.availability.inStock).length,
        outOfStock: items.filter(item => !item.availability.inStock).length,
        seasonal: items.filter(item => item.availability.seasonal).length
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error in getItemPriceStats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get popular search items (most searched/compared items)
export const getPopularItems = async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    let matchQuery = {};
    if (type) matchQuery.type = type;

    const popularItems = await VendorItem.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            name: { $toLower: "$name" },
            category: "$category",
            type: "$type"
          },
          count: { $sum: 1 },
          avgPrice: { 
            $avg: { 
              $ifNull: [
                { $avg: ["$price.min", "$price.max"] },
                { $ifNull: ["$price.min", "$price.max"] }
              ]
            }
          },
          vendors: { $addToSet: "$vendor" }
        }
      },
      {
        $project: {
          name: "$_id.name",
          category: "$_id.category",
          type: "$_id.type",
          vendorCount: { $size: "$vendors" },
          avgPrice: { $round: ["$avgPrice", 2] },
          _id: 0
        }
      },
      { $sort: { vendorCount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: popularItems
    });

  } catch (error) {
    console.error("Error in getPopularItems:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Helper functions
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateMedian(numbers) {
  const sorted = numbers.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function getCommonUnits(items) {
  const unitCounts = {};
  items.forEach(item => {
    const unit = item.price.unit || 'piece';
    unitCounts[unit] = (unitCounts[unit] || 0) + 1;
  });
  
  return Object.entries(unitCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([unit, count]) => ({ unit, count }));
}