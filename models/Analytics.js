import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const analyticsSchema = new mongoose.Schema({
  analyticsID: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  urlHash: {
    type: String,
    required: true,
    ref: "Url",
  },
  clickTimestamp: {
    type: Date,
    default: Date.now,
  },
  referringSite: String,
  location: String,
});

export default mongoose.model("Analytics", analyticsSchema);
