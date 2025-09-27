import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Upload, Save, Send, ChefHat, Hammer, Clock, Star, Users } from 'lucide-react';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const PostCreate = ({ editMode = false, postId = null }) => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { createPost, updatePost, publishPost, getPostById, currentPost, isCreating, isUpdating, isUploading, uploadMedia } = usePostStore();

  const [postType, setPostType] = useState('recipe');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'recipe',
    difficulty: 'beginner',
    // Recipe specific
    cookingTime: '',
    servings: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    cookingSteps: [{ stepNumber: 1, instruction: '', image: '', video: '' }],
    // DIY specific
    estimatedTime: '',
    materials: [{ name: '', quantity: '', notes: '' }],
    instructions: [{ stepNumber: 1, instruction: '', image: '', video: '' }],
    // Common
    tags: [],
    images: [],
    videos: [],
    category: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [isDraft, setIsDraft] = useState(true);

  // Recipe categories
  const recipeCategories = [
    'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 
    'Beverages', 'Appetizers', 'Main Course', 'Side Dish', 'Salads'
  ];

  // DIY categories
  const diyCategories = [
    'Home Decor', 'Crafts', 'Furniture', 'Garden', 'Jewelry', 
    'Art', 'Organization', 'Toys', 'Gifts', 'Clothing'
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner', icon: '⭐', color: 'text-green-500' },
    { value: 'intermediate', label: 'Intermediate', icon: '⭐⭐', color: 'text-yellow-500' },
    { value: 'advanced', label: 'Advanced', icon: '⭐⭐⭐', color: 'text-red-500' }
  ];

  // Load post data if in edit mode
  useEffect(() => {
    if (editMode && postId) {
      getPostById(postId);
    }
  }, [editMode, postId, getPostById]);

  useEffect(() => {
    if (editMode && currentPost) {
      setFormData({
        title: currentPost.title || '',
        description: currentPost.description || '',
        type: currentPost.type || 'recipe',
        difficulty: currentPost.difficulty || 'beginner',
        cookingTime: currentPost.cookingTime || '',
        servings: currentPost.servings || '',
        ingredients: currentPost.ingredients || [{ name: '', quantity: '', unit: '' }],
        cookingSteps: currentPost.cookingSteps || [{ stepNumber: 1, instruction: '', image: '', video: '' }],
        estimatedTime: currentPost.estimatedTime || '',
        materials: currentPost.materials || [{ name: '', quantity: '', notes: '' }],
        instructions: currentPost.instructions || [{ stepNumber: 1, instruction: '', image: '', video: '' }],
        tags: currentPost.tags || [],
        images: currentPost.images || [],
        videos: currentPost.videos || [],
        category: currentPost.category || ''
      });
      setPostType(currentPost.type || 'recipe');
      setIsDraft(currentPost.status === 'draft');
    }
  }, [editMode, currentPost]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type) => {
    setPostType(type);
    setFormData(prev => ({ ...prev, type }));
  };

  // Ingredient management
  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '' }]
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  // Material management
  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { name: '', quantity: '', notes: '' }]
    }));
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((mat, i) => 
        i === index ? { ...mat, [field]: value } : mat
      )
    }));
  };

  // Step management
  const getStepsField = () => postType === 'recipe' ? 'cookingSteps' : 'instructions';

  const addStep = () => {
    const stepsField = getStepsField();
    setFormData(prev => ({
      ...prev,
      [stepsField]: [...prev[stepsField], { 
        stepNumber: prev[stepsField].length + 1, 
        instruction: '', 
        image: '', 
        video: '' 
      }]
    }));
  };

  const removeStep = (index) => {
    const stepsField = getStepsField();
    setFormData(prev => ({
      ...prev,
      [stepsField]: prev[stepsField]
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, stepNumber: i + 1 }))
    }));
  };

  const updateStep = (index, field, value) => {
    const stepsField = getStepsField();
    setFormData(prev => ({
      ...prev,
      [stepsField]: prev[stepsField].map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Media upload
  const handleMediaUpload = async (file, type, index = null, mediaType = 'images') => {
    try {
      const url = await uploadMedia(file, type);
      
      if (index !== null) {
        // Update step media
        const stepsField = getStepsField();
        updateStep(index, type === 'image' ? 'image' : 'video', url);
      } else {
        // Update main media
        setFormData(prev => ({
          ...prev,
          [mediaType]: [...prev[mediaType], url]
        }));
      }
      
      toast.success(`${type === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  const removeMedia = (index, mediaType) => {
    setFormData(prev => ({
      ...prev,
      [mediaType]: prev[mediaType].filter((_, i) => i !== index)
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }

    if (postType === 'recipe') {
      if (formData.ingredients.some(ing => !ing.name.trim())) {
        toast.error('All ingredients must have a name');
        return false;
      }
      if (formData.cookingSteps.some(step => !step.instruction.trim())) {
        toast.error('All cooking steps must have instructions');
        return false;
      }
    } else {
      if (formData.materials.some(mat => !mat.name.trim())) {
        toast.error('All materials must have a name');
        return false;
      }
      if (formData.instructions.some(step => !step.instruction.trim())) {
        toast.error('All instruction steps must have content');
        return false;
      }
    }

    return true;
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    try {
      const postData = { ...formData, status: 'draft' };
      
      if (editMode && postId) {
        await updatePost(postId, postData);
        toast.success('Draft updated successfully!');
      } else {
        await createPost(postData);
        toast.success('Draft saved successfully!');
      }
      
      navigate('/drafts');
    } catch (error) {
      // Error handled in store
    }
  };

  // Publish post
  const handlePublish = async () => {
    if (!validateForm()) return;

    try {
      const postData = { ...formData, status: 'published' };
      
      if (editMode && postId) {
        if (isDraft) {
          await publishPost(postId);
        } else {
          await updatePost(postId, postData);
          toast.success('Post updated successfully!');
        }
      } else {
        await createPost(postData);
        toast.success('Post published successfully!');
      }
      
      navigate('/');
    } catch (error) {
      // Error handled in store
    }
  };

  if (!authUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {editMode ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="text-gray-600">
            Share your {postType === 'recipe' ? 'delicious recipe' : 'creative DIY project'} with the community
          </p>
        </div>

        {/* Post Type Selection */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">What are you sharing?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTypeChange('recipe')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                postType === 'recipe'
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <ChefHat className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">Recipe</div>
              <div className="text-sm text-gray-500">Cooking & Baking</div>
            </button>
            <button
              onClick={() => handleTypeChange('diy')}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                postType === 'diy'
                  ? 'border-pink-400 bg-pink-50 text-pink-700'
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
            >
              <Hammer className="w-8 h-8 mx-auto mb-2" />
              <div className="font-semibold">DIY Craft</div>
              <div className="text-sm text-gray-500">Arts & Crafts</div>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={`Enter your ${postType} title...`}
                className="input input-bordered w-full bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={`Describe your ${postType}...`}
                rows={4}
                className="textarea textarea-bordered w-full bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="select select-bordered w-full bg-white/50 backdrop-blur-sm"
                >
                  <option value="">Select category</option>
                  {(postType === 'recipe' ? recipeCategories : diyCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="select select-bordered w-full bg-white/50 backdrop-blur-sm"
                >
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.icon} {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recipe specific fields */}
            {postType === 'recipe' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Cooking Time
                  </label>
                  <input
                    type="text"
                    value={formData.cookingTime}
                    onChange={(e) => handleInputChange('cookingTime', e.target.value)}
                    placeholder="e.g., 30 minutes"
                    className="input input-bordered w-full bg-white/50 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Servings
                  </label>
                  <input
                    type="text"
                    value={formData.servings}
                    onChange={(e) => handleInputChange('servings', e.target.value)}
                    placeholder="e.g., 4 people"
                    className="input input-bordered w-full bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
            )}

            {/* DIY specific fields */}
            {postType === 'diy' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Estimated Time
                </label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                  placeholder="e.g., 2 hours"
                  className="input input-bordered w-full bg-white/50 backdrop-blur-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Ingredients/Materials Section */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {postType === 'recipe' ? 'Ingredients' : 'Materials Needed'}
          </h2>

          <div className="space-y-3">
            {(postType === 'recipe' ? formData.ingredients : formData.materials).map((item, index) => (
              <div key={index} className="flex gap-3 items-center bg-white/30 p-3 rounded-lg">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => postType === 'recipe' 
                    ? updateIngredient(index, 'name', e.target.value)
                    : updateMaterial(index, 'name', e.target.value)
                  }
                  placeholder={postType === 'recipe' ? 'Ingredient name' : 'Material name'}
                  className="input input-sm flex-1 bg-white/50"
                />
                <input
                  type="text"
                  value={item.quantity}
                  onChange={(e) => postType === 'recipe' 
                    ? updateIngredient(index, 'quantity', e.target.value)
                    : updateMaterial(index, 'quantity', e.target.value)
                  }
                  placeholder="Quantity"
                  className="input input-sm w-24 bg-white/50"
                />
                {postType === 'recipe' ? (
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    placeholder="Unit"
                    className="input input-sm w-20 bg-white/50"
                  />
                ) : (
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateMaterial(index, 'notes', e.target.value)}
                    placeholder="Notes"
                    className="input input-sm w-32 bg-white/50"
                  />
                )}
                <button
                  onClick={() => postType === 'recipe' ? removeIngredient(index) : removeMaterial(index)}
                  className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={postType === 'recipe' ? addIngredient : addMaterial}
            className="btn btn-outline btn-sm mt-3"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add {postType === 'recipe' ? 'Ingredient' : 'Material'}
          </button>
        </div>

        {/* Steps Section */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {postType === 'recipe' ? 'Cooking Steps' : 'Instructions'}
          </h2>

          <div className="space-y-4">
            {(postType === 'recipe' ? formData.cookingSteps : formData.instructions).map((step, index) => (
              <div key={index} className="bg-white/30 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Step {step.stepNumber}</h3>
                  <button
                    onClick={() => removeStep(index)}
                    className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <textarea
                  value={step.instruction}
                  onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                  placeholder="Describe this step in detail..."
                  rows={3}
                  className="textarea textarea-bordered w-full mb-3 bg-white/50"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Image
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleMediaUpload(file, 'image', index);
                        }}
                        className="file-input file-input-sm bg-white/50 flex-1"
                        disabled={isUploading}
                      />
                    </div>
                    {step.image && (
                      <img src={step.image} alt={`Step ${step.stepNumber}`} className="w-full h-20 object-cover rounded mt-2" />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Video
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleMediaUpload(file, 'video', index);
                        }}
                        className="file-input file-input-sm bg-white/50 flex-1"
                        disabled={isUploading}
                      />
                    </div>
                    {step.video && (
                      <video src={step.video} className="w-full h-20 object-cover rounded mt-2" controls />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addStep}
            className="btn btn-outline btn-sm mt-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Step
          </button>
        </div>

        {/* Media Upload Section */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Media</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  Array.from(e.target.files).forEach(file => {
                    handleMediaUpload(file, 'image', null, 'images');
                  });
                }}
                className="file-input file-input-bordered w-full bg-white/50"
                disabled={isUploading}
              />
              
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt={`Upload ${index + 1}`} className="w-full h-20 object-cover rounded" />
                      <button
                        onClick={() => removeMedia(index, 'images')}
                        className="absolute -top-2 -right-2 btn btn-xs btn-circle btn-error"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Videos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Videos
              </label>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => {
                  Array.from(e.target.files).forEach(file => {
                    handleMediaUpload(file, 'video', null, 'videos');
                  });
                }}
                className="file-input file-input-bordered w-full bg-white/50"
                disabled={isUploading}
              />
              
              {formData.videos.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-3">
                  {formData.videos.map((video, index) => (
                    <div key={index} className="relative">
                      <video src={video} className="w-full h-20 object-cover rounded" controls />
                      <button
                        onClick={() => removeMedia(index, 'videos')}
                        className="absolute -top-2 -right-2 btn btn-xs btn-circle btn-error"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tags</h2>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add tags..."
              className="input input-bordered flex-1 bg-white/50"
            />
            <button onClick={addTag} className="btn btn-outline">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span key={tag} className="badge badge-primary gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-xs">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="glass-card p-6">
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSaveDraft}
              disabled={isCreating || isUpdating}
              className="btn btn-outline gap-2"
            >
              <Save className="w-4 h-4" />
              {isCreating || isUpdating ? 'Saving...' : 'Save as Draft'}
            </button>
            
            <button
              onClick={handlePublish}
              disabled={isCreating || isUpdating}
              className="btn btn-primary gap-2"
            >
              <Send className="w-4 h-4" />
              {isCreating || isUpdating ? 'Publishing...' : (isDraft ? 'Publish' : 'Update')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreate;