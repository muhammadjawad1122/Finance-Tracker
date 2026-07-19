import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI is missing in backend/.env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB Atlas...");

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("⚠️ MongoDB disconnected");
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // fail within 10 seconds if cannot connect
    });

    console.log(`☁️  MongoDB Host: ${mongoose.connection.host}`);
    console.log(`📦 MongoDB DB: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection FAILED:", error.message);
    process.exit(1);
  }
};

export default connectDB;