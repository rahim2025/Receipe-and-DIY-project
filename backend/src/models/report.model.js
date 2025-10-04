import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        },
        postTitle: {
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
            enum: ['spam', 'harassment', 'inappropriate-content', 'impersonation', 'other'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'dismissed', 'action-taken'],
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
            enum: ['none', 'warning', 'temporary-block', 'permanent-block'],
            default: 'none'
        }
    },
    { timestamps: true }
);

// Indexes for efficient queries
reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
