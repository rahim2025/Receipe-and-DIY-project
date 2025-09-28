import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, DollarSign, CheckCircle, XCircle, Star, Edit, Trash2, Tag } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import QuickCompareButton from './QuickCompareButton';

const ITEM_CATEGORIES = {
  ingredient: {
    vegetable: '🥕 Vegetable', fruit: '🍎 Fruit', meat: '🥩 Meat', seafood: '🦐 Seafood',
    dairy: '🥛 Dairy', grain: '🌾 Grain', spice: '🌶️ Spice', herb: '🌿 Herb',
    condiment: '🍯 Condiment', oil: '🫒 Oil', vinegar: '🍶 Vinegar', baking: '🧁 Baking',
    beverage: '🥤 Beverage', snack: '🍿 Snack', frozen: '❄️ Frozen', canned: '🥫 Canned',
    'dry-goods': '🌰 Dry Goods', 'specialty-food': '🍽️ Specialty Food'
  },
  material: {
    fabric: '🧵 Fabric', yarn: '🧶 Yarn', thread: '🪡 Thread', button: '🔘 Button',
    zipper: '🤐 Zipper', trim: '🎀 Trim', paper: '📄 Paper', cardboard: '📦 Cardboard',
    wood: '🪵 Wood', metal: '🔩 Metal', plastic: '🛡️ Plastic', glass: '🪟 Glass',
    ceramic: '🏺 Ceramic', stone: '🪨 Stone', adhesive: '🩹 Adhesive', paint: '🎨 Paint',
    brush: '🖌️ Brush', tool: '🔧 Tool', hardware: '⚙️ Hardware', electronic: '🔌 Electronic',
    'craft-supply': '✂️ Craft Supply', 'jewelry-supply': '💎 Jewelry Supply',
    scrapbook: '📖 Scrapbook', 'art-supply': '🎭 Art Supply', 'sewing-supply': '🪡 Sewing',
    knitting: '🧶 Knitting', embroidery: '🪡 Embroidery'
  }
};

const PRICE_UNITS = [
  'each', 'lb', 'kg', 'oz', 'g', 'yard', 'meter', 'foot', 'inch', 
  'liter', 'ml', 'gallon', 'pack', 'bundle', 'set'
];

const VendorItems = ({ vendor, onClose }) => {
  const { authUser } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    type: 'ingredient',
    description: '',
    price: {
      min: '',
      max: '',
      currency: 'USD',
      unit: 'each'
    },
    availability: {
      inStock: true,
      seasonal: false,
      notes: ''
    },
    tags: []
  });

  useEffect(() => {
    if (vendor) {
      loadVendorItems();
    }
  }, [vendor, selectedCategory, selectedType, showInStockOnly]);

  const loadVendorItems = async () => {
    if (!vendor?._id) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);
      if (showInStockOnly) params.append('inStock', 'true');
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axiosInstance.get(`/api/vendor-items/vendor/${vendor._id}/items?${params}`);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error loading vendor items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    try {
      // Validate required fields
      if (!newItem.name || !newItem.category || !newItem.type) {
        toast.error('Please fill in all required fields');
        return;
      }

      const itemData = {
        ...newItem,
        name: newItem.name.trim(),
        description: newItem.description?.trim() || '',
        price: {
          ...newItem.price,
          min: newItem.price.min ? parseFloat(newItem.price.min) : undefined,
          max: newItem.price.max ? parseFloat(newItem.price.max) : undefined
        }
      };

      const response = await axiosInstance.post(`/api/vendor-items/vendor/${vendor._id}/items`, itemData);
      
      setItems(prev => [response.data.item, ...prev]);
      setShowAddItem(false);
      setNewItem({
        name: '',
        category: '',
        type: 'ingredient',
        description: '',
        price: { min: '', max: '', currency: 'USD', unit: 'each' },
        availability: { inStock: true, seasonal: false, notes: '' },
        tags: []
      });
      
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  const filteredItems = items.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const ItemCard = ({ item }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-lg">{item.name}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {item.type === 'ingredient' ? '🥘' : '🔨'} {item.type}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {ITEM_CATEGORIES[item.type]?.[item.category] || item.category}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {item.availability.inStock ? (
            <CheckCircle className="h-5 w-5 text-green-500" title="In Stock" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" title="Out of Stock" />
          )}
          
          {item.averageRating > 0 && (
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">{item.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {item.description && (
        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
      )}

      <div className="flex justify-between items-center">
        <div>
          {item.price && (item.price.min || item.price.max) ? (
            <div className="flex items-center text-green-600 font-semibold">
              <DollarSign className="h-4 w-4" />
              <span>
                {item.price.min && item.price.max && item.price.min !== item.price.max
                  ? `$${item.price.min} - $${item.price.max}`
                  : `$${item.price.min || item.price.max}`}
                {item.price.unit && item.price.unit !== 'each' && (
                  <span className="text-sm text-gray-500 ml-1">/{item.price.unit}</span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Price not specified</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 font-medium">Added by {item.addedBy?.firstName || 'Unknown'}</span>
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-blue-600" />
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 2 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    +{item.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {item.availability.notes && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <strong>Note:</strong> {item.availability.notes}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <QuickCompareButton 
          itemName={item.name}
          category={item.category}
          type={item.type}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Package className="h-6 w-6 mr-2" />
              {vendor.name} - Inventory
            </h2>
            <p className="text-gray-600 mt-1">Available ingredients and materials</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedCategory(''); // Reset category when type changes
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="ingredient">🥘 Ingredients</option>
              <option value="material">🔨 Materials</option>
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedType}
            >
              <option value="">All Categories</option>
              {selectedType && Object.entries(ITEM_CATEGORIES[selectedType] || {}).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showInStockOnly}
                onChange={(e) => setShowInStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">In stock only</span>
            </label>

            {authUser && (
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory || selectedType
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to add items to this vendor'}
              </p>
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {showAddItem && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Item</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter item name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={newItem.type}
                        onChange={(e) => setNewItem({...newItem, type: e.target.value, category: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ingredient">🥘 Ingredient</option>
                        <option value="material">🔨 Material</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={newItem.category}
                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select category</option>
                        {Object.entries(ITEM_CATEGORIES[newItem.type] || {}).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Describe the item..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (Optional)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={newItem.price.min}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          price: {...newItem.price, min: e.target.value}
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Min price"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={newItem.price.max}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          price: {...newItem.price, max: e.target.value}
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Max price"
                      />
                      <select
                        value={newItem.price.unit}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          price: {...newItem.price, unit: e.target.value}
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PRICE_UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newItem.availability.inStock}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          availability: {...newItem.availability, inStock: e.target.checked}
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Currently in stock</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newItem.availability.seasonal}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          availability: {...newItem.availability, seasonal: e.target.checked}
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Seasonal item</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability Notes
                    </label>
                    <input
                      type="text"
                      value={newItem.availability.notes}
                      onChange={(e) => setNewItem({
                        ...newItem,
                        availability: {...newItem.availability, notes: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Available weekends only"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addItem}
                    disabled={!newItem.name || !newItem.category || !newItem.type}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorItems;