import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Upload, Save, Send, ChefHat, Hammer, Clock, Star } from 'lucide-react';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import LocationSelector from '../components/LocationSelector';
import { CUISINES, CULTURAL_ORIGINS } from '../lib/location';
import toast from 'react-hot-toast';

const SimplePostCreate = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { createPost, isCreating, uploadMedia, isUploading } = usePostStore();

  const [step, setStep] = useState(1); // Multi-step wizard
  const [postType, setPostType] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    difficulty: 'beginner',
    category: '',
    cookingTime: '',
    servings: '',
    estimatedTime: '',
    tags: [],
    images: [],
    // Simplified ingredients/materials - just text areas
    ingredientsText: '',
    materialsText: '',
    stepsText: '',
    // Cost estimation fields
    totalCostEstimate: '',
    costCurrency: 'USD',
    costNotes: '',
    // Location fields
    location: null,
    cuisine: '',
    culturalOrigin: ''
  });

  const [tagInput, setTagInput] = useState('');

  // Simplified categories
  const categories = {
    recipe: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts', 'Drinks'],
    diy: ['Home Decor', 'Crafts', 'Garden', 'Organization', 'Gifts', 'Art']
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const url = await uploadMedia(file, 'image');
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, url]
        }));
        toast.success('Image uploaded!');
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

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

  const handleSubmit = async (isDraft = true) => {
    // Convert text areas to structured data
    const ingredients = formData.ingredientsText
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => ({
        name: line.trim(),
        quantity: '',
        unit: ''
      }));

    const materials = formData.materialsText
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => ({
        name: line.trim(),
        quantity: '',
        notes: ''
      }));

    const steps = formData.stepsText
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => ({
        stepNumber: index + 1,
        instruction: line.trim(),
        image: '',
        video: ''
      }));

    const postData = {
      ...formData,
      type: postType,
      ingredients: postType === 'recipe' ? ingredients : undefined,
      materials: postType === 'diy' ? materials : undefined,
      cookingSteps: postType === 'recipe' ? steps : undefined,
      instructions: postType === 'diy' ? steps : undefined,
      status: isDraft ? 'draft' : 'published'
    };

    // Remove text fields as they're converted to structured data
    delete postData.ingredientsText;
    delete postData.materialsText;
    delete postData.stepsText;

    try {
      await createPost(postData);
      toast.success(isDraft ? 'Draft saved!' : 'Post published!');
      navigate(isDraft ? '/drafts' : '/');
    } catch (error) {
      // Error handled in store
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!authUser) { navigate('/login'); return null; }

  const stepsMeta = [
    { id: 1, label: 'Type', desc: 'Choose recipe or DIY' },
    { id: 2, label: 'Basics', desc: 'Core details & cost' },
    { id: 3, label: 'Content', desc: 'Ingredients / steps' },
    { id: 4, label: 'Media', desc: 'Images & tags' }
  ];

  const wizardProgress = (step / stepsMeta.length) * 100;

  const canProceed = useMemo(() => {
    if (step === 1) return !!postType;
    if (step === 2) return formData.title && formData.description && formData.category;
    if (step === 3) {
      if (postType === 'recipe' && !formData.ingredientsText) return false;
      if (postType === 'diy' && !formData.materialsText) return false;
      if (!formData.stepsText) return false;
      return true;
    }
    return true;
  }, [step, postType, formData]);

  const completionScore = useMemo(() => {
    let score = 0;
    if (postType) score += 10;
    if (formData.title) score += 15;
    if (formData.description) score += 15;
    if (formData.category) score += 10;
    if (formData.difficulty) score += 5;
    if (formData.ingredientsText || formData.materialsText) score += 15;
    if (formData.stepsText) score += 15;
    if (formData.images.length > 0) score += 10;
    if (formData.tags.length > 0) score += 5;
    if (formData.totalCostEstimate) score += 5;
    return Math.min(score, 100);
  }, [postType, formData]);

  const quickTags = useMemo(() => {
    if (postType === 'recipe') return ['easy', 'family', 'quick', 'healthy', 'comfort'];
    if (postType === 'diy') return ['budget', 'beginner', 'gift', 'recycled', 'decor'];
    return ['creative', 'fun', 'trending'];
  }, [postType]);

  return (
    <div className="min-h-screen pt-40 pb-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Hero / Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 glass-panel p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-violet-500/10 to-pink-500/5 pointer-events-none" />
            <div className="relative">
              <h1 className="text-4xl font-bold text-white mb-3 font-['Poppins'] tracking-tight">
                Create New <span className="bg-gradient-to-r from-teal-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Post</span>
              </h1>
              <p className="text-white/70 max-w-2xl text-lg mb-6 font-light">
                A focused, minimal wizard to get your {postType || 'recipe or DIY'} published faster. Progress saves on submit.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  {stepsMeta.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStep(s.id)}
                      className={`px-3 py-1.5 rounded-full transition text-[11px] tracking-wide uppercase font-medium border backdrop-blur-sm ${
                        step === s.id
                          ? 'bg-gradient-to-r from-teal-400/30 to-violet-400/30 border-white/30 text-white shadow-md shadow-black/30'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs ml-auto">
                  <div className="w-40 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-400 via-violet-400 to-pink-400" style={{ width: `${completionScore}%` }} />
                  </div>
                  <span className="text-white/60">{completionScore}% Ready</span>
                </div>
              </div>
              <div className="mt-6 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 via-violet-400 to-pink-400 transition-all" style={{ width: `${wizardProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Live Summary */}
            <div className="glass-panel p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold tracking-wide text-white/80 uppercase">Live Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="glass-badge glass-badge-teal !text-[10px]">{postType || 'No type'}</div>
                <div className="glass-badge glass-badge-blue !text-[10px]">{formData.difficulty}</div>
                <div className="glass-badge glass-badge-violet !text-[10px]">{formData.category || 'Category'}</div>
                <div className="glass-badge !text-[10px]">{formData.costCurrency} {formData.totalCostEstimate || '0.00'}</div>
              </div>
              <div className="text-xs text-white/60 space-y-1 font-mono">
                <div>Title: <span className="text-white/80">{formData.title || '—'}</span></div>
                <div>Tags: <span className="text-white/80">{formData.tags.length}</span></div>
                <div>Images: <span className="text-white/80">{formData.images.length}</span></div>
                <div>Steps: <span className="text-white/80">{formData.stepsText ? formData.stepsText.split('\n').filter(l=>l.trim()).length : 0}</span></div>
              </div>
              <div className="mt-2">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-400 via-violet-400 to-pink-400" style={{ width: `${completionScore}%` }} />
                </div>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Fill required sections. Summary auto-updates. Improve completeness for better discovery.
              </p>
            </div>
        </div>

        {/* Form Panel */}
        <div className="glass-panel p-8 lg:p-10 glass-fade-in">
          {/* Step 1: Choose Type */}
          {step === 1 && (
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-semibold text-white mb-8 font-['Poppins']">What would you like to share?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button
                  onClick={() => { setPostType('recipe'); handleInputChange('type','recipe'); nextStep(); }}
                  className={`relative group overflow-hidden rounded-2xl p-8 border transition-all backdrop-blur-md glass-hover-lift ${postType==='recipe' ? 'border-teal-400/60 bg-teal-400/10' : 'border-white/10 hover:border-teal-400/40 hover:bg-white/5'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <ChefHat className="w-14 h-14 mx-auto mb-5 text-teal-300 group-hover:scale-110 transition-transform" />
                  <div className="text-xl font-semibold text-white mb-1">Recipe</div>
                  <div className="text-sm text-white/60">Share a delicious creation</div>
                </button>
                <button
                  onClick={() => { setPostType('diy'); handleInputChange('type','diy'); nextStep(); }}
                  className={`relative group overflow-hidden rounded-2xl p-8 border transition-all backdrop-blur-md glass-hover-lift ${postType==='diy' ? 'border-violet-400/60 bg-violet-400/10' : 'border-white/10 hover:border-violet-400/40 hover:bg-white/5'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <Hammer className="w-14 h-14 mx-auto mb-5 text-violet-300 group-hover:scale-110 transition-transform" />
                  <div className="text-xl font-semibold text-white mb-1">DIY Project</div>
                  <div className="text-sm text-white/60">Share a creative build</div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-semibold text-white mb-8 font-['Poppins']">Tell us about your {postType}</h2>
              <div className="space-y-8">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={`What's the name of your ${postType}?`}
                    className="glass-input glass-input-force w-full"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={`Tell people what makes this ${postType} special...`}
                    rows={4}
                    className="glass-input glass-input-force w-full min-h-[140px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="glass-input glass-input-force w-full"
                    >
                      <option value="">Choose category</option>
                      {categories[postType]?.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      className="glass-input glass-input-force w-full"
                    >
                      <option value="beginner">⭐ Beginner</option>
                      <option value="intermediate">⭐⭐ Intermediate</option>
                      <option value="advanced">⭐⭐⭐ Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Type-specific fields */}
                {postType === 'recipe' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block flex items-center gap-1"><Clock className="w-4 h-4" /> Cooking Time</label>
                      <input
                        type="text"
                        value={formData.cookingTime}
                        onChange={(e) => handleInputChange('cookingTime', e.target.value)}
                        placeholder="e.g., 30 minutes"
                        className="glass-input glass-input-force w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Servings</label>
                      <input
                        type="text"
                        value={formData.servings}
                        onChange={(e) => handleInputChange('servings', e.target.value)}
                        placeholder="e.g., 4 people"
                        className="glass-input glass-input-force w-full"
                      />
                    </div>
                  </div>
                )}

                {postType === 'diy' && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block flex items-center gap-1"><Clock className="w-4 h-4" /> Estimated Time</label>
                    <input
                      type="text"
                      value={formData.estimatedTime}
                      onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                      placeholder="e.g., 2 hours"
                      className="glass-input w-full"
                    />
                  </div>
                )}

                {/* Cost Estimation Section */}
                <div className="pt-8 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><span className="text-teal-300">💰</span> Cost Estimation <span className="text-xs text-white/40 font-normal">(Optional)</span></h3>
                  <p className="text-sm text-white/50 mb-6">Help others estimate the total cost for this {postType === 'recipe' ? 'recipe' : 'project'}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Total Cost Estimate</label>
                      <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        <select
                          value={formData.costCurrency}
                          onChange={(e) => handleInputChange('costCurrency', e.target.value)}
                          className="glass-input !rounded-none !border-0 !border-r !border-white/10 w-24 bg-transparent"
                        >
                          <option value="USD">$</option>
                          <option value="EUR">€</option>
                          <option value="GBP">£</option>
                          <option value="CAD">C$</option>
                          <option value="AUD">A$</option>
                          <option value="INR">₹</option>
                          <option value="JPY">¥</option>
                          <option value="CNY">¥</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.totalCostEstimate}
                          onChange={(e) => handleInputChange('totalCostEstimate', e.target.value)}
                          placeholder="0.00"
                          className="glass-input !rounded-none flex-1 bg-transparent border-0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Cost Notes</label>
                      <input
                        type="text"
                        value={formData.costNotes}
                        onChange={(e) => handleInputChange('costNotes', e.target.value)}
                        placeholder="e.g., Prices may vary by location"
                        className="glass-input glass-input-force w-full"
                        maxLength="200"
                      />
                    </div>
                  </div>
                </div>

                {/* Location and Cultural Information */}
                <div className="pt-8 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><span className="text-violet-300">🌍</span> Location & Culture <span className="text-xs text-white/40 font-normal">(Optional)</span></h3>
                  <p className="text-sm text-white/50 mb-6">Help others discover {postType === 'recipe' ? 'regional cuisines' : 'local crafts'} and find materials near them</p>
                  
                  <div className="space-y-4">
                    <LocationSelector
                      onLocationChange={(location) => handleInputChange('location', location)}
                      initialLocation={formData.location}
                      className="mb-4"
                    />
                    
                    {postType === 'recipe' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Cuisine Type</label>
                          <select
                            value={formData.cuisine}
                            onChange={(e) => handleInputChange('cuisine', e.target.value)}
                            className="glass-input glass-input-force w-full"
                          >
                            <option value="">Select cuisine (optional)</option>
                            {CUISINES.map((cuisine) => (
                              <option key={cuisine} value={cuisine}>
                                {cuisine}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">Cultural Origin</label>
                          <select
                            value={formData.culturalOrigin}
                            onChange={(e) => handleInputChange('culturalOrigin', e.target.value)}
                            className="glass-input w-full"
                          >
                            <option value="">Select origin (optional)</option>
                            {CULTURAL_ORIGINS.map((origin) => (
                              <option key={origin} value={origin}>
                                {origin}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Content */}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-semibold text-white mb-8 font-['Poppins']">Add your content</h2>
              <div className="space-y-8">
                {/* Ingredients/Materials */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">{postType === 'recipe' ? 'Ingredients' : 'Materials'} *</label>
                  <p className="text-[11px] text-white/40 mb-2">Write each {postType === 'recipe' ? 'ingredient' : 'material'} on a new line</p>
                  <textarea
                    value={postType === 'recipe' ? formData.ingredientsText : formData.materialsText}
                    onChange={(e) => handleInputChange(
                      postType === 'recipe' ? 'ingredientsText' : 'materialsText', 
                      e.target.value
                    )}
                    placeholder={postType === 'recipe' 
                      ? "2 cups flour\n1 cup sugar\n3 eggs\n1 tsp vanilla extract" 
                      : "Wood boards\nScrews\nPaint\nBrushes"
                    }
                    rows={6}
                    className="glass-input w-full font-mono text-sm min-h-[180px]"
                  />
                </div>

                {/* Steps */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-2 block">{postType === 'recipe' ? 'Cooking Steps' : 'Instructions'} *</label>
                  <p className="text-[11px] text-white/40 mb-2">Write each step on a new line</p>
                  <textarea
                    value={formData.stepsText}
                    onChange={(e) => handleInputChange('stepsText', e.target.value)}
                    placeholder={postType === 'recipe' 
                      ? "Preheat oven to 350°F\nMix flour and sugar in a bowl\nAdd eggs and vanilla\nBake for 25 minutes" 
                      : "Cut wood to size\nSand all surfaces\nApply first coat of paint\nLet dry and apply second coat"
                    }
                    rows={8}
                    className="glass-input w-full font-mono text-sm min-h-[200px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photos & Final Details */}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-semibold text-white mb-8 font-['Poppins']">Add photos & finishing touches</h2>
              <div className="space-y-10">
                {/* Photo Upload */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-3 block">Photos</label>
                  <div className="relative rounded-2xl p-8 border border-dashed border-white/15 hover:border-teal-400/50 transition group text-center bg-white/5 backdrop-blur-sm">
                    <div className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-br from-teal-400/10 via-violet-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition" />
                    <Upload className="w-10 h-10 mx-auto mb-4 text-teal-300 group-hover:scale-110 transition-transform" />
                    <p className="text-sm text-white/60 mb-5">Upload photos of your {postType}</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="glass-input cursor-pointer w-full max-w-xs mx-auto"
                      disabled={isUploading}
                    />
                  </div>

                  {/* Image Preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          <img src={img} alt={`Upload ${index + 1}`} className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-110" />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 glass-post-interaction w-7 h-7 rounded-full text-red-300 hover:text-red-200 hover:bg-red-500/20"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/50 font-medium mb-3 block">Tags (optional)</label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add a tag..."
                      className="glass-input flex-1"
                    />
                    <button onClick={addTag} className="glass-btn-secondary px-4">
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickTags.map(qt => (
                      <button
                        key={qt}
                        type="button"
                        onClick={() => !formData.tags.includes(qt) && setFormData(p=>({...p,tags:[...p.tags, qt]}))}
                        className="text-[11px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition"
                      >
                        {qt}
                      </button>
                    ))}
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span key={tag} className="glass-badge glass-badge-teal !text-[11px] !py-1 flex items-center gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="text-white/70 hover:text-white transition" title="Remove tag">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-12 pt-8 border-t border-white/10 gap-6">
            <div className="w-full sm:w-auto flex gap-3">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="glass-btn-secondary px-6"
                >
                  ← Previous
                </button>
              )}
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              {step === 4 ? (
                <>
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={isCreating}
                    className="btn-smart px-6 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isCreating ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isCreating}
                    className="btn-smart btn-smart-gradient-strong px-8 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {isCreating ? 'Publishing...' : 'Publish'}
                  </button>
                </>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed}
                  className="btn-smart px-8 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePostCreate;