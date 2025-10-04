import User from "../models/user.model.js";
import Report from "../models/report.model.js";
import Post from "../models/post.model.js";

// Get all reports (admin only)
export const getAllReports = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        const query = status && status !== 'all' ? { status } : {};
        
        const reports = await Report.find(query)
            .populate('reportedBy', 'username fullName profilePic email')
            .populate('reportedUser', 'username fullName profilePic email isBlocked')
            .populate('reviewedBy', 'username fullName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await Report.countDocuments(query);
        
        res.status(200).json({
            success: true,
            reports,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error in getAllReports:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reports"
        });
    }
};

// Get reports statistics
export const getReportsStats = async (req, res) => {
    try {
        const [pending, reviewed, dismissed, actionTaken, totalUsers, blockedUsers] = await Promise.all([
            Report.countDocuments({ status: 'pending' }),
            Report.countDocuments({ status: 'reviewed' }),
            Report.countDocuments({ status: 'dismissed' }),
            Report.countDocuments({ status: 'action-taken' }),
            User.countDocuments(),
            User.countDocuments({ isBlocked: true })
        ]);
        
        res.status(200).json({
            success: true,
            stats: {
                reports: {
                    pending,
                    reviewed,
                    dismissed,
                    actionTaken,
                    total: pending + reviewed + dismissed + actionTaken
                },
                users: {
                    total: totalUsers,
                    blocked: blockedUsers,
                    active: totalUsers - blockedUsers
                }
            }
        });
    } catch (error) {
        console.error("Error in getReportsStats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics"
        });
    }
};

// Update report status
export const updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, adminNotes, actionTaken } = req.body;
        
        if (!['pending', 'reviewed', 'dismissed', 'action-taken'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }
        
        const report = await Report.findById(reportId);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }
        
        report.status = status;
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();
        
        if (adminNotes) report.adminNotes = adminNotes;
        if (actionTaken) report.actionTaken = actionTaken;
        
        await report.save();
        
        const updatedReport = await Report.findById(reportId)
            .populate('reportedBy', 'username fullName profilePic email')
            .populate('reportedUser', 'username fullName profilePic email isBlocked')
            .populate('reviewedBy', 'username fullName');
        
        res.status(200).json({
            success: true,
            message: "Report updated successfully",
            report: updatedReport
        });
    } catch (error) {
        console.error("Error in updateReportStatus:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update report"
        });
    }
};

// Block a user
export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, reportId } = req.body;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Block reason is required"
            });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Cannot block an admin user"
            });
        }
        
        if (user.isBlocked) {
            return res.status(400).json({
                success: false,
                message: "User is already blocked"
            });
        }
        
        user.isBlocked = true;
        user.blockedAt = new Date();
        user.blockedBy = req.user._id;
        user.blockReason = reason;
        
        await user.save();
        
        // Update related report if provided
        if (reportId) {
            await Report.findByIdAndUpdate(reportId, {
                status: 'action-taken',
                actionTaken: 'permanent-block',
                reviewedBy: req.user._id,
                reviewedAt: new Date(),
                adminNotes: `User blocked: ${reason}`
            });
        }
        
        res.status(200).json({
            success: true,
            message: "User blocked successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isBlocked: user.isBlocked,
                blockReason: user.blockReason
            }
        });
    } catch (error) {
        console.error("Error in blockUser:", error);
        res.status(500).json({
            success: false,
            message: "Failed to block user"
        });
    }
};

// Unblock a user
export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        if (!user.isBlocked) {
            return res.status(400).json({
                success: false,
                message: "User is not blocked"
            });
        }
        
        user.isBlocked = false;
        user.blockedAt = null;
        user.blockedBy = null;
        user.blockReason = null;
        
        await user.save();
        
        res.status(200).json({
            success: true,
            message: "User unblocked successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isBlocked: user.isBlocked
            }
        });
    } catch (error) {
        console.error("Error in unblockUser:", error);
        res.status(500).json({
            success: false,
            message: "Failed to unblock user"
        });
    }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status } = req.query;
        
        let query = {};
        
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status === 'blocked') {
            query.isBlocked = true;
        } else if (status === 'active') {
            query.isBlocked = false;
        }
        
        const users = await User.find(query)
            .select('-password -emailVerificationToken')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await User.countDocuments(query);
        
        res.status(200).json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

// Get user details with reports
export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId)
            .select('-password -emailVerificationToken')
            .populate('blockedBy', 'username fullName');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        const [reportsAgainst, reportsMade, postCount] = await Promise.all([
            Report.find({ reportedUser: userId })
                .populate('reportedBy', 'username fullName')
                .sort({ createdAt: -1 }),
            Report.find({ reportedBy: userId })
                .populate('reportedUser', 'username fullName')
                .sort({ createdAt: -1 }),
            Post.countDocuments({ user: userId })
        ]);
        
        res.status(200).json({
            success: true,
            user,
            stats: {
                reportsAgainst: reportsAgainst.length,
                reportsMade: reportsMade.length,
                posts: postCount
            },
            reportsAgainst,
            reportsMade
        });
    } catch (error) {
        console.error("Error in getUserDetails:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user details"
        });
    }
};

// Delete user (admin only - soft delete)
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Cannot delete an admin user"
            });
        }
        
        // Block the user instead of deleting (soft delete)
        user.isBlocked = true;
        user.blockedAt = new Date();
        user.blockedBy = req.user._id;
        user.blockReason = "Account deleted by admin";
        
        await user.save();
        
        res.status(200).json({
            success: true,
            message: "User account has been disabled"
        });
    } catch (error) {
        console.error("Error in deleteUser:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user"
        });
    }
};
