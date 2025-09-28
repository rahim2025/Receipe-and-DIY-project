import jwt from "jsonwebtoken"

export const genToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    const isProduction = process.env.NODE_ENV === "production";
    
    res.cookie("jwt", token, { 
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: isProduction, // Use secure cookies in production
        sameSite: isProduction ? "none" : "strict", // Allow cross-origin in production
        domain: isProduction ? ".vercel.app" : undefined // Allow subdomain sharing on Vercel
    });
    
    return token;
}