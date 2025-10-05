import VendorReport from "../models/vendorReport.model.js";
import Vendor from "../models/vendor.model.js";
import User from "../models/user.model.js";

// ============ CREATE VENDOR REPORT ============
export const createVendorReport = async (req, res) => {
    try {
        const { vendorId, reason, category } = req.body;
        const userId = req.user._id;

        // Validation
        if (!vendorId || !reason || !category) {
            return res.status(400).json({
                success: false,
                message: "Vendor ID, reason, and category are required"
            });
        }

        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        // Check for duplicate reports from the same user
        const existingReport = await VendorReport.findOne({
            reportedBy: userId,
            vendor: vendorId,
            status: { $in: ['pending', 'under-review'] }
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: "You have already reported this vendor. Your report is under review."
            });
        }

        // Create the report
        const report = new VendorReport({
            reportedBy: userId,
            vendor: vendorId,
            vendorName: vendor.name,
            reason,
            category,
            status: 'pending'
        });

        await report.save();

        res.status(201).json({
            success: true,
            message: "Report submitted successfully. Our team will review it shortly.",
            report
        });

    } catch (error) {
        console.error("Error creating vendor report:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating report"
        });
    }
};

// ============ GET ALL VENDOR REPORTS (Admin) ============
export const getVendorReports = async (req, res) => {
    try {
        const { status, vendorId } = req.query;
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (vendorId) {
            filter.vendor = vendorId;
        }

        const reports = await VendorReport.find(filter)
            .populate('reportedBy', 'username fullName profilePic')
            .populate('vendor', 'name type address phone email')
            .populate('reviewedBy', 'username fullName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            reports
        });

    } catch (error) {
        console.error("Error fetching vendor reports:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching reports"
        });
    }
};

// ============ GET VENDOR REPORT BY ID (Admin) ============
export const getVendorReportById = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await VendorReport.findById(reportId)
            .populate('reportedBy', 'username fullName profilePic email')
            .populate('vendor', 'name type description address phone email website')
            .populate('reviewedBy', 'username fullName');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        res.json({
            success: true,
            report
        });

    } catch (error) {
        console.error("Error fetching vendor report:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching report"
        });
    }
};

// ============ UPDATE VENDOR REPORT STATUS (Admin) ============
export const updateVendorReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, adminNotes, actionTaken } = req.body;
        const adminId = req.user._id;

        const report = await VendorReport.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        // Update report
        report.status = status || report.status;
        report.adminNotes = adminNotes || report.adminNotes;
        report.actionTaken = actionTaken || report.actionTaken;
        report.reviewedBy = adminId;
        report.reviewedAt = new Date();

        await report.save();

        // Populate before sending response
        await report.populate('reportedBy', 'username fullName profilePic');
        await report.populate('vendor', 'name type address');
        await report.populate('reviewedBy', 'username fullName');

        res.json({
            success: true,
            message: "Report updated successfully",
            report
        });

    } catch (error) {
        console.error("Error updating vendor report:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating report"
        });
    }
};

// ============ DELETE VENDOR (Admin - via report) ============
export const deleteVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { reportId, reason } = req.body;
        const adminId = req.user._id;

        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        // If reportId is provided, update the report
        if (reportId) {
            const report = await VendorReport.findById(reportId);
            if (report) {
                report.status = 'resolved';
                report.actionTaken = 'vendor-deleted';
                report.adminNotes = reason || 'Vendor deleted by admin';
                report.reviewedBy = adminId;
                report.reviewedAt = new Date();
                await report.save();
            }
        }

        // Delete the vendor
        await Vendor.findByIdAndDelete(vendorId);

        res.json({
            success: true,
            message: `Vendor "${vendor.name}" has been deleted successfully`
        });

    } catch (error) {
        console.error("Error deleting vendor:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting vendor"
        });
    }
};

// ============ GET REPORT STATISTICS (Admin) ============
export const getVendorReportStats = async (req, res) => {
    try {
        const totalReports = await VendorReport.countDocuments();
        const pendingReports = await VendorReport.countDocuments({ status: 'pending' });
        const underReviewReports = await VendorReport.countDocuments({ status: 'under-review' });
        const resolvedReports = await VendorReport.countDocuments({ status: 'resolved' });
        const dismissedReports = await VendorReport.countDocuments({ status: 'dismissed' });

        // Get reports by category
        const reportsByCategory = await VendorReport.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get most reported vendors
        const mostReportedVendors = await VendorReport.aggregate([
            {
                $group: {
                    _id: '$vendor',
                    reportCount: { $sum: 1 },
                    vendorName: { $first: '$vendorName' }
                }
            },
            { $sort: { reportCount: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            stats: {
                total: totalReports,
                pending: pendingReports,
                underReview: underReviewReports,
                resolved: resolvedReports,
                dismissed: dismissedReports,
                byCategory: reportsByCategory,
                mostReported: mostReportedVendors
            }
        });

    } catch (error) {
        console.error("Error fetching vendor report stats:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching statistics"
        });
    }
};
