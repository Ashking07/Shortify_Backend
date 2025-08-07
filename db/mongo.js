// db/mongo.js
import mongoose from "mongoose";

export const connectToMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected to 'urlshortener' DB");
  } catch (err) {
    console.error("❌ MongoDB connection error", err);
  }
};
