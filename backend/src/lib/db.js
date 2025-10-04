import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/recipe-diy-hub";
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }
    
    await mongoose.connect(mongoUri);
    console.log(`✅ Database connected successfully`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    // Don't exit in serverless environment
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};



