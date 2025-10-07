import React, { useRef } from 'react';
import { Clock, DollarSign, AlertCircle, Package, X, Image as ImageIcon, Video, Flame } from 'lucide-react';

const StepCard = ({ 
  step, 
  index, 
  isEditing = false, 
  onUpdate = null, 
  onRemove = null,
  onMediaUpload = null,
  isUploading = false,
  postType = 'recipe' // default to recipe for backward compatibility
}) => {
  const handleUpdate = (field, value) => {
    if (onUpdate) {
      onUpdate(index, field, value);
    }
  };

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const triggerUpload = (ref) => {
    if (ref?.current) {
      ref.current.click();
    }
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files?.[0];
    if (file && onMediaUpload) {
      onMediaUpload(file, type, index);
    }
  };

  const handleMaterialUpdate = (matIndex, field, value) => {
    const updatedMaterials = [...(step.materials || [])];
    updatedMaterials[matIndex] = {
      ...updatedMaterials[matIndex],
      [field]: value
    };
    handleUpdate('materials', updatedMaterials);
  };

  const addMaterial = () => {
    const updatedMaterials = [...(step.materials || []), { name: '', quantity: '', unit: '', estimatedCost: 0, calories: 0 }];
    handleUpdate('materials', updatedMaterials);
  };

  const removeMaterial = (matIndex) => {
    const updatedMaterials = (step.materials || []).filter((_, i) => i !== matIndex);
    handleUpdate('materials', updatedMaterials);
  };

  if (isEditing) {
    return (
      <div className=" relative overflow-hidden p-6 mb-4 rounded-3xl border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-pink-500/15 opacity-95" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-violet-400 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                {step.stepNumber}
              </div>
              <div>
                <p className="text-sm text-white/70 uppercase tracking-wide">Step {step.stepNumber}</p>
                <h3 className="font-semibold text-white text-xl drop-shadow">Edit Details</h3>
              </div>
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-400/50 text-red-100 hover:bg-red-500/20 transition-all duration-300"
              >
                <X className="w-4 h-4" /> Remove
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Step Title *
              </label>
              <input
                type="text"
                value={step.title || ''}
                onChange={(e) => handleUpdate('title', e.target.value)}
                placeholder="e.g., Prepare the ingredients"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/30 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:border-blue-300 focus:bg-slate-900/80"
                maxLength={100}
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Instructions *
              </label>
              <textarea
                value={step.instruction || ''}
                onChange={(e) => handleUpdate('instruction', e.target.value)}
                placeholder="Describe this step in detail..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/30 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:border-blue-300 focus:bg-slate-900/80"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                <Clock className="w-4 h-4 inline mr-1" /> Estimated Time (minutes)
              </label>
              <input
                type="number"
                value={step.estimatedTime || 0}
                onChange={(e) => handleUpdate('estimatedTime', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/30 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:border-emerald-300 focus:bg-slate-900/80"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" /> Notes & Tips (optional)
              </label>
              <textarea
                value={step.notes || ''}
                onChange={(e) => handleUpdate('notes', e.target.value)}
                placeholder="Add helpful tips, warnings, or pro advice..."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/30 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:border-amber-300 focus:bg-slate-900/80"
              />
            </div>

            {/* Materials */}
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-3">
                <Package className="w-4 h-4 inline mr-1" /> Materials/Ingredients for this Step
              </label>
              <div className="space-y-3">
                {(step.materials || []).map((material, matIndex) => (
                  <div key={matIndex} className="bg-slate-900/60 border border-white/20 p-4 rounded-2xl space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-white/70 mb-1 font-semibold">Item Name *</label>
                        <input
                          type="text"
                          value={material.name || ''}
                          onChange={(e) => handleMaterialUpdate(matIndex, 'name', e.target.value)}
                          placeholder="e.g., Tomatoes"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-300"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-white/70 mb-1 font-semibold">Quantity</label>
                        <input
                          type="text"
                          value={material.quantity || ''}
                          onChange={(e) => handleMaterialUpdate(matIndex, 'quantity', e.target.value)}
                          placeholder="2"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-300"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-white/70 mb-1 font-semibold">Unit</label>
                        <input
                          type="text"
                          value={material.unit || ''}
                          onChange={(e) => handleMaterialUpdate(matIndex, 'unit', e.target.value)}
                          placeholder="kg"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-300"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-emerald-300 mb-1 font-bold flex items-center gap-1">
                        
                          Cost (৳) *
                        </label>
                        <input
                          type="number"
                          value={material.estimatedCost || ''}
                          onChange={(e) => handleMaterialUpdate(matIndex, 'estimatedCost', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 rounded-xl bg-emerald-900/40 border-2 border-emerald-400/50 text-white placeholder-white/40 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/30"
                        />
                      </div>
                      {postType === 'recipe' && (
                        <div className="w-32">
                          <label className="block text-xs text-orange-300 mb-1 font-bold flex items-center gap-1">
                            Calories
                          </label>
                          <input
                            type="number"
                            value={material.calories || ''}
                            onChange={(e) => handleMaterialUpdate(matIndex, 'calories', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            step="1"
                            min="0"
                            className="w-full px-3 py-2 rounded-xl bg-orange-900/40 border-2 border-orange-400/50 text-white placeholder-white/40 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-400/30"
                          />
                        </div>
                      )}
                      <button
                        onClick={() => removeMaterial(matIndex)}
                        className="self-end inline-flex items-center justify-center px-3 py-2 rounded-xl border border-red-400/40 text-red-200 hover:bg-red-500/20 transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addMaterial}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-300/50 text-purple-100 font-semibold hover:bg-purple-500/20 transition-all duration-300"
                >
                  + Add Material
                </button>
              </div>
            </div>

            {/* Media */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white/90">
                  Step Image
                </label>
                <div className="rounded-2xl border border-white/25 bg-slate-900/60 p-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => triggerUpload(imageInputRef)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
                    disabled={isUploading}
                  >
                    <ImageIcon className="w-5 h-5" />
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'image')}
                    className="hidden"
                  />
                  {step.image && (
                    <div className="w-full bg-slate-950/60 rounded-xl border border-white/20 flex items-center justify-center p-2" style={{ minHeight: '160px', maxHeight: '200px' }}>
                      <img
                        src={step.image}
                        alt={`Step ${step.stepNumber}`}
                        className="max-w-full h-auto object-contain rounded-lg max-h-48"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white/90">
                  Step Video
                </label>
                <div className="rounded-2xl border border-white/25 bg-slate-900/60 p-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => triggerUpload(videoInputRef)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
                    disabled={isUploading}
                  >
                    <Video className="w-5 h-5" />
                    {isUploading ? 'Uploading...' : 'Upload Video'}
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e, 'video')}
                    className="hidden"
                  />
                  {step.video && (
                    <div className="w-full bg-slate-950/60 rounded-xl border border-white/20 flex items-center justify-center p-2" style={{ minHeight: '160px', maxHeight: '200px' }}>
                      <video
                        src={step.video}
                        className="max-w-full h-auto object-contain rounded-lg max-h-48"
                        controls
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="glass-panel p-6 mb-6" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
      <div className="flex items-start gap-4">
        {/* Step Number */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-400 to-violet-400 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
          {step.stepNumber}
        </div>

        <div className="flex-1">
          {/* Title */}
          {step.title && (
            <h3 className="text-xl font-bold text-white mb-3 readable contrast-on-glass">
              {step.title}
            </h3>
          )}

          {/* Time Badge */}
          {step.estimatedTime > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="glass-badge glass-badge-teal flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {step.estimatedTime} min
              </span>
            </div>
          )}

          {/* Instruction */}
          <p className="text-white mb-4 leading-relaxed readable contrast-on-glass">
            {step.instruction}
          </p>

          {/* Materials for this step */}
          {step.materials && step.materials.length > 0 && (
            <div className="mb-4 glass-card p-4" style={{ background: 'rgba(0, 0, 0, 0.15)' }}>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2 readable">
                <Package className="h-4 w-4 text-teal-400" />
                Materials Needed:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {step.materials.map((material, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-white readable">
                      {material.quantity && `${material.quantity} `}
                      {material.unit && `${material.unit} `}
                      <span className="font-medium">{material.name}</span>
                      {material.calories > 0 && (
                        <span className="text-orange-300 text-xs ml-2">
                          ({material.calories} cal)
                        </span>
                      )}
                    </span>
                    {material.estimatedCost > 0 && (
                      <span className="text-teal-300 font-semibold readable">
                        ৳{material.estimatedCost.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {step.notes && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-100 readable">
                  <span className="font-semibold">Tip:</span> {step.notes}
                </p>
              </div>
            </div>
          )}

          {/* Step Media */}
          {(step.image || step.video) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {step.image && (
                <div className="glass-card rounded-xl overflow-hidden bg-slate-950/60 flex items-center justify-center" style={{ minHeight: '250px', maxHeight: '400px' }}>
                  <img
                    src={step.image}
                    alt={step.title || `Step ${step.stepNumber}`}
                    className="w-full h-auto object-contain max-h-96 hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              )}
              
              {step.video && (
                <div className="glass-card rounded-xl overflow-hidden bg-slate-950/60 flex items-center justify-center" style={{ minHeight: '250px', maxHeight: '400px' }}>
                  <video
                    src={step.video}
                    controls
                    className="w-full h-auto object-contain max-h-96"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepCard;
