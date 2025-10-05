import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { 
  Flag, 
  Store,
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  Eye,
  Filter,
  Calendar,
  User,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackgroundShapes from '../components/BackgroundShapes';

const REPORT_CATEGORIES = {
  'incorrect-information': { label: 'Incorrect Information', color: 'blue' },
  'closed-permanently': { label: 'Closed Permanently', color: 'gray' },
  'duplicate': { label: 'Duplicate Listing', color: 'purple' },
  'inappropriate-content': { label: 'Inappropriate Content', color: 'orange' },
  'spam': { label: 'Spam', color: 'red' },
  'scam-fraud': { label: 'Scam/Fraud', color: 'red' },
  'safety-concern': { label: 'Safety Concern', color: 'amber' },
  'other': { label: 'Other', color: 'gray' }
};

const VendorReportsAdmin = () => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!authUser || authUser.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    } else {
      loadReports();
      loadStats();
    }
  }, [authUser, navigate]);

  useEffect(() => {
    if (authUser?.role === 'admin') {
      loadReports();
    }
  }, [filterStatus]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/vendor-reports', {
        params: { status: filterStatus === 'all' ? undefined : filterStatus }
      });
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load vendor reports');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axiosInstance.get('/api/vendor-reports/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewDetails = async (report) => {
    try {
      const response = await axiosInstance.get(`/api/vendor-reports/${report._id}`);
      setSelectedReport(response.data.report);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading report details:', error);
      toast.error('Failed to load report details');
    }
  };

  const handleUpdateStatus = async (reportId, status, adminNotes = '') => {
    try {
      await axiosInstance.put(`/api/vendor-reports/${reportId}`, {
        status,
        adminNotes: adminNotes || `Status updated to ${status}`,
        actionTaken: status === 'resolved' ? 'vendor-updated' : 'none'
      });
      toast.success('Report status updated successfully');
      loadReports();
      loadStats();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    }
  };

  const handleDeleteVendor = async (vendorId, reportId) => {
    const confirmMessage = `Are you sure you want to delete this vendor? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    const reason = prompt('Please provide a reason for deletion:');
    if (!reason) return;

    try {
      await axiosInstance.delete(`/api/vendor-reports/vendor/${vendorId}`, {
        data: { reportId, reason }
      });
      toast.success('Vendor deleted successfully');
      loadReports();
      loadStats();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
      'under-review': { icon: Eye, color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
      resolved: { icon: CheckCircle, color: 'bg-green-500/20 text-green-300 border-green-500/40' },
      dismissed: { icon: XCircle, color: 'bg-gray-500/20 text-gray-300 border-gray-500/40' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const config = REPORT_CATEGORIES[category] || REPORT_CATEGORIES.other;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-${config.color}-500/20 text-${config.color}-300 border border-${config.color}-500/40`}>
        {config.label}
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <BackgroundShapes />
        <div className="max-w-7xl mx-auto px-4">
          <div className="glass-panel p-12 text-center">
            <div className="glass-loading mx-auto mb-6"></div>
            <h3 className="text-lg font-semibold text-white mb-2">Loading vendor reports...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-16">
      <BackgroundShapes />
      
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="mb-8 glass-fade-in">
          <div className="glass-panel p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <Flag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white font-['Poppins']">Vendor Reports</h1>
                <p className="text-white/70 mt-1">Review and manage vendor reports from users</p>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                <div className="glass-card p-4">
                  <div className="text-white/70 text-sm mb-1">Total Reports</div>
                  <div className="text-2xl font-bold text-white">{stats.total || 0}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-yellow-300 text-sm mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-300">{stats.pending || 0}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-blue-300 text-sm mb-1">Under Review</div>
                  <div className="text-2xl font-bold text-blue-300">{stats.underReview || 0}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-green-300 text-sm mb-1">Resolved</div>
                  <div className="text-2xl font-bold text-green-300">{stats.resolved || 0}</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-gray-300 text-sm mb-1">Dismissed</div>
                  <div className="text-2xl font-bold text-gray-300">{stats.dismissed || 0}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 glass-panel p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-teal-400" />
            <span className="text-white font-medium">Filter by Status:</span>
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'under-review', 'resolved', 'dismissed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-teal-400 to-violet-500 text-white'
                      : 'glass-btn hover:bg-white/20'
                  }`}
                >
                  {status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="glass-panel p-12 text-center">
              <div className="glass-loading mx-auto mb-4"></div>
              <p className="text-white/70">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <Flag className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Reports Found</h3>
              <p className="text-white/70">
                {filterStatus === 'all' 
                  ? 'There are no vendor reports yet.'
                  : `No ${filterStatus.replace('-', ' ')} reports at this time.`}
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="glass-card p-6 hover:scale-[1.01] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Store className="w-5 h-5 text-teal-400" />
                      <h3 className="text-xl font-bold text-white">{report.vendorName || 'Unknown Vendor'}</h3>
                      {getStatusBadge(report.status)}
                      {getCategoryBadge(report.category)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <User className="w-4 h-4" />
                        <span>Reported by: {report.reportedBy?.username || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      {report.vendor?.address && (
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{report.vendor.address.city}, {report.vendor.address.state}</span>
                        </div>
                      )}
                    </div>

                    <div className="glass-panel p-4 mb-4">
                      <p className="text-white/90 text-sm leading-relaxed">{report.reason}</p>
                    </div>

                    {report.adminNotes && (
                      <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3">
                        <p className="text-blue-200 text-sm">
                          <strong>Admin Notes:</strong> {report.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDetails(report)}
                      className="glass-btn px-4 py-2 text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>

                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(report._id, 'under-review')}
                          className="glass-btn px-4 py-2 text-sm bg-blue-500/20 text-blue-300"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                          className="glass-btn px-4 py-2 text-sm bg-gray-500/20 text-gray-300"
                        >
                          Dismiss
                        </button>
                      </>
                    )}

                    {report.status === 'under-review' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(report._id, 'resolved')}
                          className="glass-btn px-4 py-2 text-sm bg-green-500/20 text-green-300"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(report.vendor?._id, report._id)}
                          className="glass-btn px-4 py-2 text-sm bg-red-500/20 text-red-300 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Vendor
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedReport && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-pink-900/40 border-2 border-white/20 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden relative">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full backdrop-blur-lg bg-white/10 border border-white/20 hover:bg-white/20 hover:rotate-90 transition-all duration-300 flex items-center justify-center group"
              >
                <XCircle className="w-6 h-6 text-white/80 group-hover:text-white" />
              </button>

              <div className="p-8 overflow-y-auto max-h-[90vh]">
                <h2 className="text-3xl font-bold text-white mb-6 font-['Poppins'] pr-12">Report Details</h2>

                <div className="space-y-6">
                  {/* Vendor Info */}
                  <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Store className="w-5 h-5 text-teal-400" />
                      Vendor Information
                    </h3>
                    <div className="space-y-2 text-white/80">
                      <p><strong>Name:</strong> {selectedReport.vendor?.name}</p>
                      <p><strong>Type:</strong> {selectedReport.vendor?.type}</p>
                      {selectedReport.vendor?.phone && <p><strong>Phone:</strong> {selectedReport.vendor.phone}</p>}
                      {selectedReport.vendor?.email && <p><strong>Email:</strong> {selectedReport.vendor.email}</p>}
                      {selectedReport.vendor?.address && (
                        <p><strong>Address:</strong> {selectedReport.vendor.address.street}, {selectedReport.vendor.address.city}, {selectedReport.vendor.address.state}</p>
                      )}
                    </div>
                  </div>

                  {/* Report Info */}
                  <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Flag className="w-5 h-5 text-orange-400" />
                      Report Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-white/90">Category:</strong>
                        <div className="mt-1">{getCategoryBadge(selectedReport.category)}</div>
                      </div>
                      <div>
                        <strong className="text-white/90">Status:</strong>
                        <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                      </div>
                      <div>
                        <strong className="text-white/90">Reported by:</strong>
                        <p className="text-white/80">{selectedReport.reportedBy?.username} ({selectedReport.reportedBy?.email})</p>
                      </div>
                      <div>
                        <strong className="text-white/90">Reason:</strong>
                        <p className="text-white/80 mt-1 bg-white/5 p-4 rounded-lg">{selectedReport.reason}</p>
                      </div>
                      <div>
                        <strong className="text-white/90">Reported on:</strong>
                        <p className="text-white/80">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                      </div>
                      {selectedReport.reviewedBy && (
                        <>
                          <div>
                            <strong className="text-white/90">Reviewed by:</strong>
                            <p className="text-white/80">{selectedReport.reviewedBy.username}</p>
                          </div>
                          <div>
                            <strong className="text-white/90">Reviewed at:</strong>
                            <p className="text-white/80">{new Date(selectedReport.reviewedAt).toLocaleString()}</p>
                          </div>
                        </>
                      )}
                      {selectedReport.adminNotes && (
                        <div>
                          <strong className="text-white/90">Admin Notes:</strong>
                          <p className="text-white/80 mt-1 bg-blue-500/20 border border-blue-500/40 p-4 rounded-lg">{selectedReport.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-6 py-3 backdrop-blur-lg bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                      Close
                    </button>
                    {selectedReport.status !== 'resolved' && selectedReport.status !== 'dismissed' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-2xl transition-all"
                        >
                          Mark as Resolved
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(selectedReport.vendor?._id, selectedReport._id)}
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-2xl transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete Vendor
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorReportsAdmin;
