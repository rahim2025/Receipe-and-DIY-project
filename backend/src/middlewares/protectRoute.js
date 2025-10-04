import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
export const protectRoute = async (req, res, next) => {
    try {
        // Try to get token from cookies first, then Authorization header
        let token = req.cookies.jwt;
        
        // Fallback to Authorization header for cases where cookies don't work
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.startsWith('Bearer ') 
                ? req.headers.authorization.slice(7) 
                : req.headers.authorization;
        }
        
        if (!token) {
            console.log('No token found in cookies or headers');
            return res.status(401).json({
                message: "Please login first"
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded) {
            return res.status(401).json({
                message: "Invalid token, please login"
            });  
        }
        const user = await User.findById(decoded.userId).select("-password");
        
        if (!user) {
            return res.status(404).json({
                message: "User not found, please login"
            });
        }
        
        req.user = user;
        next();
        
    } catch (error) {
        console.error("Error in protect middleware:", error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: "Invalid token, please login"
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expired, please login again"
            });
        }
        
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}