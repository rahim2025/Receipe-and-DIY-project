import React, { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const ReportUserModal = ({ isOpen, onClose, reportedUser, reportedUserId, postId = null, postTitle = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'spam',
    reason: ''
  });

  const categories = [
    { value: 'spam', label: 'Spam', description: 'Posting unwanted or repetitive content' },
    { value: 'harassment', label: 'Harassment', description: 'Bullying or harassing behavior' },
    { value: 'inappropriate-content', label: 'Inappropriate Content', description: 'Offensive or inappropriate posts' },
    { value: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
    { value: 'other', label: 'Other', description: 'Other violations' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    if (formData.reason.trim().length < 10) {
      toast.error('Please provide more details (at least 10 characters)');
      return;
    }

    try {
      setIsSubmitting(true);
      const reportData = {
        reportedUserId: reportedUserId,
        reason: formData.reason.trim(),
        category: formData.category
      };
      
      // Add post context if available
      if (postId) {
        reportData.postId = postId;
      }
      if (postTitle) {
        reportData.postTitle = postTitle;
      }
      
      await axiosInstance.post('/api/reports', reportData);
      
      toast.success('Report submitted successfully. Our team will review it.');
      setFormData({ category: 'spam', reason: '' });
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit report. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-panel rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Report User</h2>
              <p className="text-sm text-white/60">
                {reportedUser ? `@${reportedUser}` : 'Report inappropriate behavior'}
              </p>
              {postTitle && (
                <p className="text-xs text-white/50 mt-1">
                  Post: "{postTitle.substring(0, 40)}{postTitle.length > 40 ? '...' : ''}"
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-semibold mb-1">Important:</p>
              <ul className="space-y-1 text-amber-200/80">
                <li>• False reports may result in action on your account</li>
                <li>• All reports are reviewed by our moderation team</li>
                <li>• You'll be notified when action is taken</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-3">
              Category *
            </label>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.category === cat.value
                      ? 'bg-gradient-to-r from-teal-500/20 to-violet-500/20 border-teal-400/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={formData.category === cat.value}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{cat.label}</p>
                    <p className="text-white/50 text-xs">{cat.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">
              Reason for Report *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide detailed information about why you're reporting this user..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/30 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:border-teal-300 focus:bg-slate-900/80 resize-none"
              required
            />
            <p className="text-xs text-white/50 mt-1">
              {formData.reason.length}/500 characters (minimum 10)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.reason.trim().length < 10}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportUserModal;
