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
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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
      currency: 'BDT',
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
        price: { min: '', max: '', currency: 'BDT', unit: 'each' },
        availability: { inStock: true, seasonal: false, notes: '' },
        tags: []
      });
      
      toast.success('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  const handleEditClick = (item) => {
    setEditingItem({
      ...item,
      price: {
        min: item.price?.min || '',
        max: item.price?.max || '',
        currency: item.price?.currency || 'BDT',
        unit: item.price?.unit || 'each'
      },
      availability: {
        inStock: item.availability?.inStock ?? true,
        seasonal: item.availability?.seasonal ?? false,
        notes: item.availability?.notes || ''
      },
      tags: item.tags || []
    });
    setShowEditItem(true);
  };

  const updateItem = async () => {
    try {
      if (!editingItem.name || !editingItem.category || !editingItem.type) {
        toast.error('Please fill in all required fields');
        return;
      }

      const itemData = {
        ...editingItem,
        name: editingItem.name.trim(),
        description: editingItem.description?.trim() || '',
        price: {
          ...editingItem.price,
          min: editingItem.price.min ? parseFloat(editingItem.price.min) : undefined,
          max: editingItem.price.max ? parseFloat(editingItem.price.max) : undefined
        }
      };

      const response = await axiosInstance.put(
        `/api/vendor-items/items/${editingItem._id}`,
        itemData
      );
      
      setItems(prev => prev.map(item => 
        item._id === editingItem._id ? response.data.item : item
      ));
      
      setShowEditItem(false);
      setEditingItem(null);
      toast.success('Item updated successfully!');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  const filteredItems = items.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const ItemCard = ({ item }) => (
    <div className="glass-card p-4 hover:glass-hover-lift transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-ultra-readable text-lg">{item.name}</h4>
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
        <p className="text-base readable-secondary !text-white/80 mb-3">{item.description}</p>
      )}

      <div className="flex justify-between items-center">
        <div>
          {item.price && (item.price.min || item.price.max) ? (
            <div className="flex items-center text-green-400 font-semibold">
              
              <span>
                {item.price.min && item.price.max && item.price.min !== item.price.max
                  ? `৳${item.price.min} - ৳${item.price.max}`
                  : `৳${item.price.min || item.price.max}`}
                {item.price.unit && item.price.unit !== 'each' && (
                  <span className="text-base text-white/80 ml-1">/{item.price.unit}</span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-sm text-white/60">Price not specified</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80 font-medium">Added by {item.addedBy?.firstName || 'Unknown'}</span>
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
        <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500/50 rounded text-sm text-yellow-100 backdrop-blur-sm">
          <strong>Note:</strong> {item.availability.notes}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
        <QuickCompareButton 
          itemName={item.name}
          category={item.category}
          type={item.type}
        />
        
        {authUser && item.addedBy?._id === authUser._id && (
          <button
            onClick={() => handleEditClick(item)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all text-xs font-medium shadow-md hover:shadow-lg hover:scale-105"
          >
            <Edit className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="glass-panel max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold text-ultra-readable flex items-center">
              <Package className="h-6 w-6 mr-2" />
              {vendor.name} - Inventory
            </h2>
            <p className="readable-secondary mt-1 !text-white/80 text-lg">Available ingredients and materials</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-4 pr-4 py-2 placeholder:text-white/60 text-lg"
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedCategory(''); // Reset category when type changes
              }}
              className="glass-input px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="ingredient">🥘 Ingredients</option>
              <option value="material">🔨 Materials</option>
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input px-3 py-2"
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
                className="rounded border-white/30 text-blue-500 focus:ring-blue-500 bg-white/10"
              />
              <span className="text-base readable-secondary !text-white/80">In stock only</span>
            </label>

            {authUser && (
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium text-ultra-readable shadow-lg"
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
              <Package className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ultra-readable mb-2">No items found</h3>
              <p className="readable-secondary">
                {searchTerm || selectedCategory || selectedType
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to add items to this vendor'}
              </p>
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {showAddItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-panel w-full max-w-5xl max-h-[80vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-white/15 relative">
              <div className="p-6 flex-1 overflow-y-auto overscroll-contain pb-48">
                <h3 className="text-xl font-bold text-ultra-readable mb-4">Add New Item</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium readable-strong mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      className="w-full px-4 py-3 bg-blue-900/30 border-2 border-blue-400/50 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 backdrop-blur-sm placeholder-blue-200"
                      placeholder="Enter item name"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium readable-strong mb-2">
                        Type *
                      </label>
                      <select
                        value={newItem.type}
                        onChange={(e) => setNewItem({...newItem, type: e.target.value, category: ''})}
                        className="glass-input w-full"
                      >
                        <option value="ingredient">🥘 Ingredient</option>
                        <option value="material">🔨 Material</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium readable-strong mb-2">
                        Category *
                      </label>
                      <select
                        value={newItem.category}
                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                        className="glass-input w-full"
                      >
                        <option value="">Select category</option>
                        {Object.entries(ITEM_CATEGORIES[newItem.type] || {}).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium readable-strong mb-2">
                      Description
                    </label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      className="glass-input w-full"
                      rows="3"
                      placeholder="Describe the item..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium readable-strong mb-2">
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
                        className="px-3 py-3 bg-green-900/30 border-2 border-green-400/50 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-300 backdrop-blur-sm placeholder-green-200"
                        placeholder="Min price"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={newItem.price.max}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          price: {...newItem.price, max: e.target.value}
                        })}
                        className="px-3 py-3 bg-green-900/30 border-2 border-green-400/50 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-300 backdrop-blur-sm placeholder-green-200"
                        placeholder="Max price"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                      />
                      <select
                        value={newItem.price.unit}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          price: {...newItem.price, unit: e.target.value}
                        })}
                        className="px-3 py-3 bg-green-900/30 border-2 border-green-400/50 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-300 backdrop-blur-sm"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
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
                        className="rounded border-white/30 text-blue-500 focus:ring-blue-500 bg-white/10"
                      />
                      <span className="text-sm readable-secondary">Currently in stock</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newItem.availability.seasonal}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          availability: {...newItem.availability, seasonal: e.target.checked}
                        })}
                        className="rounded border-white/30 text-blue-500 focus:ring-blue-500 bg-white/10"
                      />
                      <span className="text-sm readable-secondary">Seasonal item</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium readable-strong mb-2">
                      Availability Notes
                    </label>
                    <input
                      type="text"
                      value={newItem.availability.notes}
                      onChange={(e) => setNewItem({
                        ...newItem,
                        availability: {...newItem.availability, notes: e.target.value}
                      })}
                      className="glass-input w-full"
                      placeholder="e.g., Available weekends only"
                    />
                  </div>
                </div>

              </div>
              
              {/* Fixed Footer with Buttons - always visible */}
              <div className="absolute left-0 right-0 bottom-6 sm:bottom-6 px-6 z-30">
                <div className="w-full rounded-xl bg-gray-900/90 backdrop-blur-2xl border border-white/15 shadow-xl p-4 flex justify-end gap-4">
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-br from-red-600 to-red-500 text-white font-semibold shadow-lg hover:from-red-500 hover:to-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/70 transition-all text-sm"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.85)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addItem}
                    disabled={!newItem.name || !newItem.category || !newItem.type}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white font-semibold shadow-lg hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.85)' }}
                  >
                    ✓ Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditItem && editingItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-panel w-full max-w-5xl max-h-[80vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-white/15 relative">
              <div className="p-6 flex-1 overflow-y-auto overscroll-contain pb-48">
                <h3 className="text-xl font-bold text-ultra-readable mb-4 flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Item
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium readable-strong mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      className="w-full px-4 py-3 bg-blue-900/30 border-2 border-blue-400/50 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 backdrop-blur-sm placeholder-blue-200"
                      placeholder="Enter item name"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium readable-strong mb-2">
                        Type *
                      </label>
                      <select
                        value={editingItem.type}
                        onChange={(e) => setEditingItem({...editingItem, type: e.target.value, category: ''})}
                        className="glass-input w-full"
                      >
                        <option value="ingredient">🥘 Ingredient</option>
                        <option value="material">🔨 Material</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium readable-strong mb-2">
                        Category *
                      </label>
                      <select
                        value={editingItem.category}
                        onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                        className="glass-input w-full"
                      >
                        <option value="">Select category</option>
                        {Object.entries(ITEM_CATEGORIES[editingItem.type] || {}).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium readable-strong mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      className="glass-input w-full"
                      rows="3"
                      placeholder="Describe the item..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium readable-strong mb-2">
                      Price (Optional)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editingItem.price.min}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          price: {...editingItem.price, min: e.target.value}
                        })}
                        className="px-3 py-3 bg-green-900/30 border-2 border-green-400/50 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-300 backdrop-blur-sm placeholder-green-200"
                        placeholder="Min price"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editingItem.price.max}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          price: {...editingItem.price, max: e.target.value}
                        })}
                        className="px-3 py-3 bg-green-900/30 border-2 border-green-400/50 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-300 backdrop-blur-sm placeholder-green-200"
                        placeholder="Max price"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                      />
                      <select
                        value={editingItem.price.unit}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          price: {...editingItem.price, unit: e.target.value}
                        })}
                        className="px-3 py-3 bg-green-900/30 border-2 border-green-400/50 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-300 backdrop-blur-sm"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
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
                        checked={editingItem.availability.inStock}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          availability: {...editingItem.availability, inStock: e.target.checked}
                        })}
                        className="rounded border-white/30 text-blue-500 focus:ring-blue-500 bg-white/10"
                      />
                      <span className="text-sm readable-secondary">Currently in stock</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingItem.availability.seasonal}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          availability: {...editingItem.availability, seasonal: e.target.checked}
                        })}
                        className="rounded border-white/30 text-blue-500 focus:ring-blue-500 bg-white/10"
                      />
                      <span className="text-sm readable-secondary">Seasonal item</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium readable-strong mb-2">
                      Availability Notes
                    </label>
                    <input
                      type="text"
                      value={editingItem.availability.notes}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        availability: {...editingItem.availability, notes: e.target.value}
                      })}
                      className="glass-input w-full"
                      placeholder="e.g., Available weekends only"
                    />
                  </div>
                </div>
              </div>
              
              {/* Fixed Footer with Buttons */}
              <div className="absolute left-0 right-0 bottom-6 sm:bottom-6 px-6 z-30">
                <div className="w-full rounded-xl bg-gray-900/90 backdrop-blur-2xl border border-white/15 shadow-xl p-4 flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowEditItem(false);
                      setEditingItem(null);
                    }}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-br from-red-600 to-red-500 text-white font-semibold shadow-lg hover:from-red-500 hover:to-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/70 transition-all text-sm"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.85)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateItem}
                    disabled={!editingItem.name || !editingItem.category || !editingItem.type}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-semibold shadow-lg hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-blue-400/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.85)' }}
                  >
                    ✓ Update Item
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