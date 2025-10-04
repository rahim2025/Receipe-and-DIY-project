import Report from "../models/report.model.js";
import User from "../models/user.model.js";

// Create a new report
export const createReport = async (req, res) => {
    try {
        const { reportedUserId, reason, category, postId, postTitle } = req.body;
        
        if (!reportedUserId || !reason || !category) {
            return res.status(400).json({
                success: false,
                message: "Reported user, reason, and category are required"
            });
        }
        
        // Check if user is trying to report themselves
        if (reportedUserId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot report yourself"
            });
        }
        
        // Check if reported user exists
        const reportedUser = await User.findById(reportedUserId);
        
        if (!reportedUser) {
            return res.status(404).json({
                success: false,
                message: "Reported user not found"
            });
        }
        
        // Check if user is trying to report an admin
        if (reportedUser.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: "Cannot report admin users"
            });
        }
        
        // Check if user already reported this user for the same reason recently (within 24 hours)
        const recentReport = await Report.findOne({
            reportedBy: req.user._id,
            reportedUser: reportedUserId,
            category,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        
        if (recentReport) {
            return res.status(400).json({
                success: false,
                message: "You have already reported this user for the same reason in the last 24 hours"
            });
        }
        
        const report = new Report({
            reportedBy: req.user._id,
            reportedUser: reportedUserId,
            reason: reason.trim(),
            category,
            status: 'pending',
            ...(postId && { postId }),
            ...(postTitle && { postTitle })
        });
        
        await report.save();
        
        const populatedReport = await Report.findById(report._id)
            .populate('reportedBy', 'username fullName profilePic')
            .populate('reportedUser', 'username fullName profilePic');
        
        res.status(201).json({
            success: true,
            message: "Report submitted successfully. Our team will review it shortly.",
            report: populatedReport
        });
    } catch (error) {
        console.error("Error in createReport:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit report"
        });
    }
};

// Get user's own reports
export const getMyReports = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const reports = await Report.find({ reportedBy: req.user._id })
            .populate('reportedUser', 'username fullName profilePic isBlocked')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        
        const total = await Report.countDocuments({ reportedBy: req.user._id });
        
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
        console.error("Error in getMyReports:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reports"
        });
    }
};

// Get a specific report
export const getReportById = async (req, res) => {
    try {
        const { reportId } = req.params;
        
        const report = await Report.findById(reportId)
            .populate('reportedBy', 'username fullName profilePic')
            .populate('reportedUser', 'username fullName profilePic isBlocked')
            .populate('reviewedBy', 'username fullName');
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }
        
        // Only allow the reporter, reported user, or admin to view the report
        const isReporter = report.reportedBy._id.toString() === req.user._id.toString();
        const isReported = report.reportedUser._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isReporter && !isReported && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view this report"
            });
        }
        
        res.status(200).json({
            success: true,
            report
        });
    } catch (error) {
        console.error("Error in getReportById:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch report"
        });
    }
};
