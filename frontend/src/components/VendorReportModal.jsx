import { useState } from 'react';
import { XCircle, AlertTriangle, Flag, CheckCircle } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

const REPORT_CATEGORIES = [
  { value: 'incorrect-information', label: 'Incorrect Information', description: 'Wrong address, hours, or contact details' },
  { value: 'closed-permanently', label: 'Closed Permanently', description: 'This business is no longer operating' },
  { value: 'duplicate', label: 'Duplicate Listing', description: 'This vendor already exists in the system' },
  { value: 'inappropriate-content', label: 'Inappropriate Content', description: 'Offensive or inappropriate information' },
  { value: 'spam', label: 'Spam', description: 'This listing appears to be spam' },
  { value: 'scam-fraud', label: 'Scam/Fraud', description: 'Suspected fraudulent business' },
  { value: 'safety-concern', label: 'Safety Concern', description: 'Safety or health code violations' },
  { value: 'other', label: 'Other', description: 'Other issues not listed above' }
];

const VendorReportModal = ({ vendor, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      toast.error('Please select a report category');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for your report');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('Please provide a more detailed reason (at least 10 characters)');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axiosInstance.post('/api/vendor-reports', {
        vendorId: vendor._id,
        category: selectedCategory,
        reason: reason.trim()
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Report submitted successfully');
        onClose();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

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
              <h2 className="text-xl font-bold text-white">Report Vendor</h2>
              <p className="text-sm text-white/60">{vendor.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <XCircle className="w-5 h-5 text-white" />
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
              {REPORT_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/50 shadow-lg shadow-red-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={selectedCategory === cat.value}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedCategory === cat.value
                        ? 'border-red-400 bg-red-500'
                        : 'border-white/40 bg-white/10'
                    }`}>
                      {selectedCategory === cat.value && (
                        <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
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
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide detailed information about your concern..."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/30 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:border-red-300 focus:bg-slate-900/80 resize-none"
              required
            />
            <p className="text-xs text-white/50 mt-1">
              {reason.length}/1000 characters (minimum 10)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedCategory || reason.trim().length < 10}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
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

export default VendorReportModal;
