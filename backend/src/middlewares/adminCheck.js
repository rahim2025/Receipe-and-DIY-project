import User from "../models/user.model.js";

// Middleware to check if user is an admin
export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }
        
        next();
    } catch (error) {
        console.error("Error in isAdmin middleware:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Middleware to check if user is blocked
export const checkIfBlocked = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support for assistance.",
                isBlocked: true,
                blockReason: user.blockReason
            });
        }
        
        next();
    } catch (error) {
        console.error("Error in checkIfBlocked middleware:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
