import express from "express";
import Feedback from "../models/Feedback.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const email = req.body.email?.trim();
  const feedback = req.body.feedback?.trim();

  try {
    if (!email || !feedback) {
      return res
        .status(400)
        .json({ error: "Please login first and enter valid feedback" });
    }

    const newFeedBack = new Feedback({
      userEmail: email,
      userFeedBack: feedback,
    });

    await newFeedBack.save();

    return res
      .status(201)
      .json({ message: "Feedback received! Thanks for your time 😄" });
  } catch (err) {
    console.error("Feedback registration error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
