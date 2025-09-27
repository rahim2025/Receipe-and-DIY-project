import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Hammer, Upload, Send, Plus, X } from 'lucide-react';
import { usePostStore } from '../store/usePostStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

const QuickCreate = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { createPost, isCreating, uploadMedia, isUploading } = usePostStore();

  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    content: '', // Single text field for everything
    images: [],
    difficulty: 'beginner'
  });

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

  const handleSubmit = async () => {
    if (!formData.type || !formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Parse content into structured format
    const lines = formData.content.split('\n').filter(line => line.trim());
    
    console.log('Input lines:', lines);
    
    // Simple approach: Split content into ingredients/materials and steps
    let ingredients = [];
    let materials = [];
    let steps = [];
    
    // Look for a natural break in the content (empty line, or action words)
    let stepStartIndex = -1;
    
    // Find where steps likely start (look for action words)
    const actionWords = ['mix', 'add', 'pour', 'bake', 'cook', 'heat', 'stir', 'combine', 'cut', 'chop', 
                         'assemble', 'attach', 'glue', 'paint', 'drill', 'screw', 'nail', 'measure'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const startsWithNumber = /^\d+[.)]\s/.test(lines[i].trim());
      const hasActionWord = actionWords.some(word => line.includes(word));
      
      if (startsWithNumber || hasActionWord || line.includes('step')) {
        stepStartIndex = i;
        break;
      }
    }
    
    // If no clear break found, split roughly in half
    if (stepStartIndex === -1) {
      stepStartIndex = Math.floor(lines.length / 2);
    }
    
    // Process ingredients/materials (first part)
    for (let i = 0; i < stepStartIndex; i++) {
      const line = lines[i].trim();
      if (line && !line.toLowerCase().includes('ingredient') && !line.toLowerCase().includes('material')) {
        if (formData.type === 'recipe') {
          ingredients.push({ name: line, amount: '1', unit: '' });
        } else {
          materials.push({ name: line, quantity: '1', optional: false });
        }
      }
    }
    
    // Process steps (second part)
    for (let i = stepStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.toLowerCase().includes('step') && !line.toLowerCase().includes('instruction')) {
        steps.push({
          stepNumber: steps.length + 1,
          description: line,
          title: '',
          image: '',
          video: ''
        });
      }
    }
    
    // Fallback: if no ingredients/materials, treat first few lines as ingredients/materials
    if (ingredients.length === 0 && materials.length === 0 && lines.length > 1) {
      const halfPoint = Math.min(3, Math.floor(lines.length / 2));
      for (let i = 0; i < halfPoint; i++) {
        if (formData.type === 'recipe') {
          ingredients.push({ name: lines[i].trim(), amount: '1', unit: '' });
        } else {
          materials.push({ name: lines[i].trim(), quantity: '1', optional: false });
        }
      }
      
      // Rest as steps
      steps = [];
      for (let i = halfPoint; i < lines.length; i++) {
        steps.push({
          stepNumber: steps.length + 1,
          description: lines[i].trim(),
          title: '',
          image: '',
          video: ''
        });
      }
    }
    
    // Final fallback: if still no steps, treat all lines as steps
    if (steps.length === 0) {
      steps = lines.map((line, index) => ({
        stepNumber: index + 1,
        description: line.trim(),
        title: '',
        image: '',
        video: ''
      }));
    }
    
    console.log('Parsed ingredients:', ingredients);
    console.log('Parsed materials:', materials);
    console.log('Parsed steps:', steps);

    // Ensure we have at least one step
    if (steps.length === 0) {
      toast.error('Please provide at least one step in your instructions');
      return;
    }

    const postData = {
      title: formData.title,
      description: formData.description || `A ${formData.type === 'recipe' ? 'delicious recipe' : 'creative DIY project'} shared by ${authUser.fullName}`,
      type: formData.type,
      difficulty: formData.difficulty,
      coverImage: formData.images[0] || '', // Use first image as cover, or empty string
      images: formData.images,
      tags: [],
      status: 'published',
      steps: steps // Both recipe and DIY use the same 'steps' field
    };

    if (formData.type === 'recipe') {
      postData.ingredients = ingredients.length > 0 ? ingredients : [{ name: 'See instructions', amount: '1', unit: '' }];
      postData.cuisine = 'Other';
    } else {
      postData.materials = materials.length > 0 ? materials : [{ name: 'See instructions', quantity: '1', optional: false }];
      postData.category = 'other';
      postData.skillLevel = formData.difficulty;
    }

    console.log('Post data being sent:', postData);

    try {
      await createPost(postData);
      toast.success('Post published!');
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      // Error handled in store
    }
  };

  if (!authUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quick Share</h1>
            <p className="text-gray-600">Share your recipe or DIY project in minutes!</p>
          </div>

          <div className="space-y-6">
            {/* Type Selection */}
            {!formData.type && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  What are you sharing?
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleInputChange('type', 'recipe')}
                    className="p-6 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all group"
                  >
                    <ChefHat className="w-8 h-8 mx-auto mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                    <div className="font-semibold">Recipe</div>
                  </button>
                  <button
                    onClick={() => handleInputChange('type', 'diy')}
                    className="p-6 rounded-xl border-2 border-gray-200 hover:border-pink-400 hover:bg-pink-50 transition-all group"
                  >
                    <Hammer className="w-8 h-8 mx-auto mb-2 text-pink-500 group-hover:scale-110 transition-transform" />
                    <div className="font-semibold">DIY Project</div>
                  </button>
                </div>
              </div>
            )}

            {formData.type && (
              <>
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What's it called? *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={`My Amazing ${formData.type === 'recipe' ? 'Recipe' : 'DIY Project'}`}
                    className="input input-bordered w-full bg-white/50 text-lg"
                  />
                </div>

                {/* Optional Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short description (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="What makes this special?"
                    className="input input-bordered w-full bg-white/50"
                  />
                </div>

                {/* Main Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type === 'recipe' ? 'Recipe Details' : 'Project Details'} *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Just write everything here - ingredients/materials and steps. We'll organize it automatically!
                  </p>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder={formData.type === 'recipe' 
                      ? `2 cups flour
1 cup sugar
3 eggs

Mix all ingredients
Bake at 350°F for 30 minutes
Let cool and enjoy!`
                      : `Wooden planks
Screws and nails
Paint

Cut wood to size
Assemble the frame
Paint and let dry`
                    }
                    rows={12}
                    className="textarea textarea-bordered w-full bg-white/50 font-mono text-sm"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How difficult is it?
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="select select-bordered w-full bg-white/50"
                  >
                    <option value="beginner">⭐ Beginner - Anyone can do it!</option>
                    <option value="intermediate">⭐⭐ Intermediate - Some experience needed</option>
                    <option value="advanced">⭐⭐⭐ Advanced - For experienced makers</option>
                  </select>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add some photos (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="file-input file-input-bordered bg-white/50 file-input-sm"
                      disabled={isUploading}
                    />
                  </div>

                  {/* Image Preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={img} 
                            alt={`Upload ${index + 1}`} 
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, type: '' }))}
                    className="btn btn-ghost"
                  >
                    ← Change Type
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isCreating || !formData.title || !formData.content}
                    className="btn btn-primary gap-2 btn-lg"
                  >
                    <Send className="w-5 h-5" />
                    {isCreating ? 'Publishing...' : 'Share Now!'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6 text-sm text-gray-600">
          Want more control? Use the <button 
            onClick={() => navigate('/create')} 
            className="text-orange-500 hover:underline"
          >
            detailed create form
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickCreate;