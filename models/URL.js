import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true,
  },
  originalUrl: {
    type: String,
    required: true,
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
  expirationDate: Date,
  users: [
    {
      type: String,
      ref: "User",
    },
  ],
  category: {
    type: String,
    default: "Uncategorized",
  },
  clicks: { type: Number, default: 0 }, // 👈 Add this field
});

// Compound index to ensure a user can't shorten the same URL more than once
urlSchema.index({ originalUrl: 1, users: 1 }, { unique: false });

export default mongoose.model("Url", urlSchema);
