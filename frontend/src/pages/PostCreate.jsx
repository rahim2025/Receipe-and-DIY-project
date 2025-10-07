import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Upload, Save, Send, ChefHat, Hammer, Clock, Star, Users, DollarSign, Package } from 'lucide-react';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import StepCard from '../components/StepCard';
import toast from 'react-hot-toast';

const PostCreate = ({ editMode = false }) => {
  const navigate = useNavigate();
  const { postId } = useParams(); // Get postId from URL params
  const { authUser } = useAuthStore();
  const { createPost, updatePost, publishPost, getPostById, currentPost, isCreating, isUpdating, isUploading, uploadMedia } = usePostStore();

  const [postType, setPostType] = useState('recipe');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'recipe',
    difficulty: 'beginner',
    // Recipe specific
    servings: '',
    // Common
    tags: [],
    category: '',
    coverImage: '',
    // PRIMARY: Step-by-step system (materials/ingredients are now within steps)
    steps: [{
      stepNumber: 1,
      title: '',
      instruction: '',
      image: '',
      video: '',
      estimatedTime: 0,
      estimatedCost: 0,
      notes: '',
      materials: []
    }]
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
      // Handle both new unified steps and old separate arrays
      let steps = currentPost.steps;
      
      // Migration: If no steps but has cookingSteps/instructions, use those
      if (!steps || steps.length === 0) {
        if (currentPost.type === 'recipe' && currentPost.cookingSteps) {
          steps = currentPost.cookingSteps.map(step => ({
            ...step,
            title: step.title || step.instruction.substring(0, 80),
            estimatedTime: step.estimatedTime || 0,
            estimatedCost: step.estimatedCost || 0,
            notes: step.notes || '',
            materials: step.materials || []
          }));
        } else if (currentPost.type === 'diy' && currentPost.instructions) {
          steps = currentPost.instructions.map(step => ({
            ...step,
            title: step.title || step.instruction.substring(0, 80),
            estimatedTime: step.estimatedTime || 0,
            estimatedCost: step.estimatedCost || 0,
            notes: step.notes || '',
            materials: step.materials || []
          }));
        }
      }
      
      setFormData({
        title: currentPost.title || '',
        description: currentPost.description || '',
        type: currentPost.type || 'recipe',
        difficulty: currentPost.difficulty || 'beginner',
        servings: currentPost.servings || '',
        tags: currentPost.tags || [],
        category: currentPost.category || '',
        coverImage: currentPost.coverImage || '',
        steps: steps || [{
          stepNumber: 1,
          title: '',
          instruction: '',
          image: '',
          video: '',
          estimatedTime: 0,
          estimatedCost: 0,
          notes: '',
          materials: []
        }]
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

  // Calculate total time from all steps
  const calculateTotalTime = () => {
    return formData.steps.reduce((sum, step) => sum + (step.estimatedTime || 0), 0);
  };

  // Calculate total cost from all steps
  const calculateTotalCost = () => {
    return formData.steps.reduce((sum, step) => {
      const stepCost = step.estimatedCost || 0;
      const materialsCost = (step.materials || []).reduce(
        (matSum, mat) => matSum + (mat.estimatedCost || 0),
        0
      );
      return sum + stepCost + materialsCost;
    }, 0);
  };

  // Step management (unified for both recipe and DIY)
  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, {
        stepNumber: prev.steps.length + 1,
        title: '',
        instruction: '',
        image: '',
        video: '',
        estimatedTime: 0,
        estimatedCost: 0,
        notes: '',
        materials: []
      }]
    }));
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, stepNumber: i + 1 }))
    }));
  };

  const updateStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
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
  const handleMediaUpload = async (file, type, index = null) => {
    try {
      const url = await uploadMedia(file, type);
      
      if (index !== null) {
        // Update step media
        updateStep(index, type === 'image' ? 'image' : 'video', url);
      } else {
        // Update cover image
        setFormData(prev => ({
          ...prev,
          coverImage: url
        }));
      }
      
      toast.success(`${type === 'image' ? 'Image' : 'Video'} uploaded successfully!`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  const removeCoverImage = () => {
    setFormData(prev => ({
      ...prev,
      coverImage: ''
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

    // Validate steps (primary requirement)
    if (!formData.steps || formData.steps.length === 0) {
      toast.error('At least one step is required');
      return false;
    }
    
    if (formData.steps.some(step => !step.title || !step.title.trim())) {
      toast.error('All steps must have a title');
      return false;
    }
    
    if (formData.steps.some(step => !step.instruction || !step.instruction.trim())) {
      toast.error('All steps must have instructions');
      return false;
    }

    // Validate that at least one step has materials
    const hasAnyMaterials = formData.steps.some(
      step => step.materials && step.materials.length > 0 && step.materials.some(m => m.name && m.name.trim())
    );
    
    if (!hasAnyMaterials) {
      toast.error('At least one step must have materials/ingredients listed');
      return false;
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
    <div className="min-h-screen pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header with Liquid Glass Effect */}
        <div className=" p-4 sm:p-6 md:p-8 mb-6 md:mb-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center shadow-lg">
              {postType === 'recipe' ? <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" /> : <Hammer className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
                {editMode ? '✏️ Edit Post' : '✨ Create New Post'}
              </h1>
              <p className="text-white/90 text-sm sm:text-base md:text-lg mt-1 font-medium drop-shadow">
                Share your {postType === 'recipe' ? 'delicious recipe' : 'creative DIY project'} step-by-step
              </p>
            </div>
          </div>
        </div>

        {/* Post Type Selection */}
        <div className=" p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">🎯</span>
            What are you sharing?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <button
              onClick={() => handleTypeChange('recipe')}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${
                postType === 'recipe'
                  ? 'border-orange-400 bg-gradient-to-br from-orange-400/30 to-pink-400/30 scale-105 shadow-2xl'
                  : 'border-white/40 bg-white/20 hover:border-orange-300 hover:bg-white/30 hover:scale-105'
              }`}
            >
              <ChefHat className={`w-12 h-12 mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 ${
                postType === 'recipe' ? 'text-orange-500 drop-shadow-lg' : 'text-white/90'
              }`} />
              <div className={`font-bold text-xl mb-2 ${
                postType === 'recipe' ? 'text-orange-700 drop-shadow' : 'text-white drop-shadow'
              }`}>Recipe</div>
              <div className={`text-sm font-medium ${
                postType === 'recipe' ? 'text-orange-600/90' : 'text-white/80'
              }`}>Cooking & Baking</div>
            </button>
            <button
              onClick={() => handleTypeChange('diy')}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${
                postType === 'diy'
                  ? 'border-pink-400 bg-gradient-to-br from-pink-400/30 to-purple-400/30 scale-105 shadow-2xl'
                  : 'border-white/40 bg-white/20 hover:border-pink-300 hover:bg-white/30 hover:scale-105'
              }`}
            >
              <Hammer className={`w-12 h-12 mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 ${
                postType === 'diy' ? 'text-pink-500 drop-shadow-lg' : 'text-white/90'
              }`} />
              <div className={`font-bold text-xl mb-2 ${
                postType === 'diy' ? 'text-pink-700 drop-shadow' : 'text-white drop-shadow'
              }`}>DIY Craft</div>
              <div className={`text-sm font-medium ${
                postType === 'diy' ? 'text-pink-600/90' : 'text-white/80'
              }`}>Arts & Crafts</div>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">📝</span>
            Basic Information
          </h2>
          
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div>
              <label className="block text-base font-bold text-white drop-shadow mb-3">
                ✨ Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={`Enter your ${postType} title...`}
                className="w-full px-5 py-4 rounded-2xl bg-indigo-950/40 border border-white/40 text-white placeholder-white/60 font-medium transition-all duration-300 focus:outline-none focus:border-purple-300 focus:bg-indigo-900/60 focus:shadow-xl focus:scale-[1.02]"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-white drop-shadow mb-3">
                📄 Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={`Describe your ${postType}...`}
                rows={5}
                className="w-full px-5 py-4 rounded-2xl bg-indigo-950/40 border border-white/40 text-white placeholder-white/60 font-medium transition-all duration-300 focus:outline-none focus:border-purple-300 focus:bg-indigo-900/60 focus:shadow-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <div>
                <label className="block text-sm sm:text-base font-bold text-white drop-shadow mb-2 sm:mb-3">
                  🏷️ Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-indigo-950/40 border border-white/40 text-white font-medium transition-all duration-300 focus:outline-none focus:border-purple-300 focus:bg-indigo-900/60 focus:shadow-xl cursor-pointer text-sm sm:text-base"
                >
                  <option value="" className="bg-slate-900 text-white">Select category</option>
                  {(postType === 'recipe' ? recipeCategories : diyCategories).map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-bold text-white drop-shadow mb-3">
                  ⭐ Difficulty *
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-indigo-950/40 border border-white/40 text-white font-medium transition-all duration-300 focus:outline-none focus:border-purple-300 focus:bg-indigo-900/60 focus:shadow-xl cursor-pointer"
                >
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value} className="bg-slate-900 text-white">
                      {level.icon} {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recipe specific fields */}
            {postType === 'recipe' && (
              <div className="bg-gradient-to-r from-orange-400/20 to-pink-400/20 p-5 rounded-2xl border-2 border-white/30">
                <label className="block text-base font-bold text-white drop-shadow mb-3">
                  <Users className="w-5 h-5 inline mr-2" />
                  Servings (optional)
                </label>
                <input
                  type="text"
                  value={formData.servings}
                  onChange={(e) => handleInputChange('servings', e.target.value)}
                  placeholder="e.g., 4-6 people"
                  className="w-full px-5 py-4 rounded-2xl bg-amber-950/40 border border-white/40 text-white placeholder-white/60 font-medium transition-all duration-300 focus:outline-none focus:border-orange-300 focus:bg-amber-900/60 focus:shadow-xl"
                />
                <p className="text-sm text-white/90 mt-3 font-medium drop-shadow">✨ Total time will be calculated from your steps</p>
              </div>
            )}
          </div>
        </div>

        {/* Cover Image Section */}
        <div className=" p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">📸</span>
            Cover Image
          </h2>
          <p className="text-sm sm:text-base text-white/90 mb-4 sm:mb-6 font-medium drop-shadow">
            Upload a stunning main image for your {postType}. This will be the first thing people see! ✨
          </p>
          
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleMediaUpload(file, 'image', null);
                }
              }}
              className="w-full px-5 py-4 rounded-2xl bg-amber-950/40 border-2 border-white/50 text-gray-800 font-medium transition-all duration-300 focus:outline-none focus:border-purple-400 focus:bg-white focus:shadow-xl file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-violet-500 file:to-purple-500 file:text-white hover:file:from-violet-600 hover:file:to-purple-600 file:cursor-pointer file:transition-all"
              disabled={isUploading}
            />
          </div>
          
          {formData.coverImage && (
            <div className="relative mt-4 sm:mt-6 group">
              <div className="overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-white/50 shadow-2xl">
                <img 
                  src={formData.coverImage} 
                  alt="Cover" 
                  className="w-full h-48 sm:h-64 md:h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <button
                onClick={removeCoverImage}
                className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 min-w-[44px] min-h-[44px] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center font-bold touch-target"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Steps Section - PRIMARY FOCUS */}
        <div className=" p-4 sm:p-6 md:p-8 mb-6 md:mb-8 border-2 sm:border-4 border-gradient-to-r from-orange-400/50 to-pink-400/50">
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg animate-pulse">
                ⭐ PRIMARY
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl md:text-4xl">📋</span>
                Step-by-Step Guide
              </h2>
            </div>
            <p className="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base md:text-lg font-medium drop-shadow">
              Break down your {postType} into clear, easy-to-follow steps. Add materials/ingredients needed for each step,
              include photos or videos, and estimate time and cost. 🚀
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-400/30 to-indigo-400/30 p-5 rounded-2xl border-2 border-white/40 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                    {formData.steps.length}
                  </div>
                  <span className="text-base font-bold text-white drop-shadow">Steps</span>
                </div>
                <p className="text-sm text-white/80 font-medium">Total sections</p>
              </div>
              <div className="bg-gradient-to-br from-green-400/30 to-teal-400/30 p-5 rounded-2xl border-2 border-white/40 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-10 h-10 text-green-500 drop-shadow-lg" />
                  <span className="text-lg font-bold text-white drop-shadow">{calculateTotalTime()} min</span>
                </div>
                <p className="text-sm text-white/80 font-medium">Total time</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {formData.steps.map((step, index) => (
              <StepCard
                key={index}
                step={step}
                index={index}
                isEditing={true}
                onUpdate={updateStep}
                onRemove={removeStep}
                onMediaUpload={handleMediaUpload}
                isUploading={isUploading}
              />
            ))}
          </div>

          <button
            onClick={addStep}
            className="btn btn-outline btn-sm mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Step
          </button>

          {/* Detailed Summary */}
          {formData.steps.length > 0 && (
            <div className="mt-6 p-5 bg-amber from-green-50 via-emerald-50 to-teal-50 rounded-xl border-2 border-green-300">
              <h3 className="font-bold text-green-900 mb-4 text-lg flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Complete Project Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/60 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {formData.steps.length}
                    </div>
                    <span className="font-semibold text-blue-900">Total Steps</span>
                  </div>
                  <p className="text-xs text-gray-600">Complete steps to finish this {postType}</p>
                </div>
                <div className="bg-white/60 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-7 h-7 text-green-600" />
                    <span className="font-semibold text-green-900">{calculateTotalTime()} minutes</span>
                  </div>
                  <p className="text-xs text-gray-600">Estimated total time from all steps</p>
                </div>
                <div className="bg-white/60 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-7 h-7 text-purple-600" />
                    <span className="font-semibold text-purple-900">
                      {formData.steps.reduce((sum, s) => sum + (s.materials?.length || 0), 0)} items
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Total materials/ingredients needed</p>
                </div>
                <div className="bg-white/60 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    
                    <span className="font-semibold text-emerald-900">৳{calculateTotalCost().toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-600">Estimated total cost from materials</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className=" p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">🏷️</span>
            Tags
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tags (e.g., chocolate, easy, 30min)..."
              className="flex-1 px-5 py-4 rounded-2xl bg-indigo-900/40 border-2 border-white/30 text-white placeholder-white/50 font-medium transition-all duration-300 focus:outline-none focus:border-purple-400 focus:bg-indigo-900/60 focus:shadow-xl backdrop-blur-sm"
            />
            <button 
              onClick={addTag} 
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {formData.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400/30 to-purple-400/30 backdrop-blur-sm border-2 border-white/40 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                  #{tag}
                  <button 
                    onClick={() => removeTag(tag)} 
                    className="w-5 h-5 rounded-full bg-white/20 hover:bg-red-500 transition-all duration-300 flex items-center justify-center group-hover:rotate-90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className=" p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
            <button
              onClick={() => navigate(-1)}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/20 border-2 border-white/40 text-white font-bold backdrop-blur-sm hover:bg-white/30 transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base touch-target"
            >
              ❌ Cancel
            </button>
            
            <button
              onClick={handleSaveDraft}
              disabled={isCreating || isUpdating}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base touch-target"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {isCreating || isUpdating ? 'Saving...' : '💾 Save as Draft'}
            </button>
            
            <button
              onClick={handlePublish}
              disabled={isCreating || isUpdating}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base touch-target"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              {isCreating || isUpdating ? 'Publishing...' : (isDraft ? '🚀 Publish' : '✨ Update')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreate;