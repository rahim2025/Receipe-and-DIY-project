import mongoose from "mongoose";

const vendorReportSchema = new mongoose.Schema(
    {
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true
        },
        vendorName: {
            type: String,
            trim: true
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        category: {
            type: String,
            enum: [
                'incorrect-information',
                'closed-permanently',
                'duplicate',
                'inappropriate-content',
                'spam',
                'scam-fraud',
                'safety-concern',
                'other'
            ],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'under-review', 'resolved', 'dismissed'],
            default: 'pending'
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: {
            type: Date
        },
        adminNotes: {
            type: String,
            maxlength: 1000
        },
        actionTaken: {
            type: String,
            enum: ['none', 'vendor-updated', 'vendor-deleted', 'warning-sent'],
            default: 'none'
        }
    },
    { timestamps: true }
);

// Indexes for efficient queries
vendorReportSchema.index({ vendor: 1, status: 1 });
vendorReportSchema.index({ reportedBy: 1 });
vendorReportSchema.index({ status: 1, createdAt: -1 });

const VendorReport = mongoose.model("VendorReport", vendorReportSchema);
export default VendorReport;
