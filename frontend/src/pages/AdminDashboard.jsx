import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Ban, 
  Search,
  Eye,
  Filter,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackgroundShapes from '../components/BackgroundShapes';

const AdminDashboard = () => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('reports'); // reports | users
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  // Check if user is admin
  useEffect(() => {
    if (!authUser || authUser.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    } else {
      loadDashboardData();
    }
  }, [authUser, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes, usersRes] = await Promise.all([
        axiosInstance.get('/api/admin/reports/stats'),
        axiosInstance.get('/api/admin/reports', {
          params: { status: filterStatus, page: pagination.page, limit: pagination.limit }
        }),
        axiosInstance.get('/api/admin/users', {
          params: { page: pagination.page, limit: pagination.limit }
        })
      ]);

      setStats(statsRes.data.stats);
      setReports(reportsRes.data.reports);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.role === 'admin') {
      loadDashboardData();
    }
  }, [filterStatus, pagination]);

  const handleUpdateReportStatus = async (reportId, status, actionTaken = 'none') => {
    try {
      await axiosInstance.put(`/api/admin/reports/${reportId}`, {
        status,
        actionTaken,
        adminNotes: `Status updated to ${status}`
      });
      toast.success('Report status updated');
      loadDashboardData();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    }
  };

  const handleBlockUser = async (userId, reportId = null) => {
    if (!confirm('Are you sure you want to block this user?')) return;

    try {
      const reason = prompt('Please provide a reason for blocking:');
      if (!reason) return;

      await axiosInstance.post(`/api/admin/users/${userId}/block`, {
        reason,
        reportId
      });
      toast.success('User blocked successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!confirm('Are you sure you want to unblock this user?')) return;

    try {
      await axiosInstance.post(`/api/admin/users/${userId}/unblock`);
      toast.success('User unblocked successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
      reviewed: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
      dismissed: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
      'action-taken': 'bg-green-500/20 text-green-200 border-green-500/30'
    };
    return colors[status] || colors.pending;
  };

  const getCategoryColor = (category) => {
    const colors = {
      spam: 'bg-orange-500/20 text-orange-200',
      harassment: 'bg-red-500/20 text-red-200',
      'inappropriate-content': 'bg-purple-500/20 text-purple-200',
      impersonation: 'bg-pink-500/20 text-pink-200',
      other: 'bg-gray-500/20 text-gray-200'
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <BackgroundShapes />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="glass-panel p-6 mb-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-violet-500 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/70">Manage reports and users</p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Reports</p>
                    <p className="text-2xl font-bold text-white">{stats.reports?.total || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.reports?.pending || 0}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.users?.total || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Blocked Users</p>
                    <p className="text-2xl font-bold text-red-400">{stats.users?.blocked || 0}</p>
                  </div>
                  <Ban className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="glass-panel p-2 mb-6 rounded-2xl inline-flex gap-2">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-teal-400 to-violet-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Reports
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-teal-400 to-violet-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
        </div>

        {/* Content */}
        {activeTab === 'reports' ? (
          <div className="glass-panel p-6 rounded-3xl">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-white/70" />
                <span className="text-white/70 text-sm">Filter:</span>
              </div>
              {['all', 'pending', 'reviewed', 'dismissed', 'action-taken'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-teal-400 to-violet-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No reports found</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report._id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(report.category)}`}>
                            {report.category}
                          </span>
                        </div>
                        <p className="text-white mb-2">{report.reason}</p>
                        <div className="text-sm text-white/50 space-y-1">
                          <p>Reported by: <span className="text-white/70">{report.reportedBy?.username}</span></p>
                          <p>Reported user: <span className="text-white/70">{report.reportedUser?.username}</span></p>
                          {report.postId && report.postTitle && (
                            <p>Post: <span className="text-teal-300">{report.postTitle}</span></p>
                          )}
                          <p>Date: {new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {report.postId && (
                          <Link
                            to={`/post/${report.postId}`}
                            target="_blank"
                            className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-200 border border-teal-500/30 hover:bg-teal-500/30 transition-all text-center font-medium"
                          >
                            <ExternalLink className="w-4 h-4 inline mr-2" />
                            View Post
                          </Link>
                        )}
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateReportStatus(report._id, 'reviewed')}
                              className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-200 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                            >
                              <Eye className="w-4 h-4 inline mr-2" />
                              Review
                            </button>
                            <button
                              onClick={() => {
                                handleBlockUser(report.reportedUser._id, report._id);
                                handleUpdateReportStatus(report._id, 'action-taken', 'permanent-block');
                              }}
                              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30 transition-all"
                            >
                              <Ban className="w-4 h-4 inline mr-2" />
                              Block User
                            </button>
                            <button
                              onClick={() => handleUpdateReportStatus(report._id, 'dismissed')}
                              className="px-4 py-2 rounded-xl bg-gray-500/20 text-gray-200 border border-gray-500/30 hover:bg-gray-500/30 transition-all"
                            >
                              <XCircle className="w-4 h-4 inline mr-2" />
                              Dismiss
                            </button>
                          </>
                        )}
                        {report.status === 'reviewed' && (
                          <>
                            {report.postId && (
                              <Link
                                to={`/post/${report.postId}`}
                                target="_blank"
                                className="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-200 border border-teal-500/30 hover:bg-teal-500/30 transition-all text-center font-medium"
                              >
                                <ExternalLink className="w-4 h-4 inline mr-2" />
                                View Post
                              </Link>
                            )}
                            <button
                              onClick={() => {
                                handleBlockUser(report.reportedUser._id, report._id);
                                handleUpdateReportStatus(report._id, 'action-taken', 'permanent-block');
                              }}
                              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30 transition-all"
                            >
                              <Ban className="w-4 h-4 inline mr-2" />
                              Block User
                            </button>
                            <button
                              onClick={() => handleUpdateReportStatus(report._id, 'dismissed')}
                              className="px-4 py-2 rounded-xl bg-gray-500/20 text-gray-200 border border-gray-500/30 hover:bg-gray-500/30 transition-all"
                            >
                              <XCircle className="w-4 h-4 inline mr-2" />
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-3xl">
            {/* Users List */}
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No users found</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user._id} className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={user.profilePic || '/avatar.png'}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="text-white font-medium">{user.username}</h3>
                        <p className="text-white/50 text-sm">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' 
                              ? 'bg-purple-500/20 text-purple-200' 
                              : 'bg-blue-500/20 text-blue-200'
                          }`}>
                            {user.role}
                          </span>
                          {user.isBlocked && (
                            <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-200">
                              Blocked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {user.role !== 'admin' && (
                      <div>
                        {user.isBlocked ? (
                          <button
                            onClick={() => handleUnblockUser(user._id)}
                            className="px-4 py-2 rounded-xl bg-green-500/20 text-green-200 border border-green-500/30 hover:bg-green-500/30 transition-all"
                          >
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Unblock
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockUser(user._id)}
                            className="px-4 py-2 rounded-xl bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30 transition-all"
                          >
                            <Ban className="w-4 h-4 inline mr-2" />
                            Block
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
