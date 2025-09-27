import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI 
    await mongoose.connect(mongoUri);
    console.log(`✅ Database connected successfully to: ${mongoUri}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};



