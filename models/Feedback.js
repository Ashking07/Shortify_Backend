import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const feedBackSchema = new mongoose.Schema({
  feedBackID: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userFeedBack: {
    type: String,
    required: true,
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Feedback", feedBackSchema);
