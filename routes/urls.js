// server/routes/urls.js

import Url from "../models/URL.js"; // adjust path if needed
import express from "express";

const router = express.Router();

// GET /api/urls/user/:userID - Get all URLs by userID
router.get("/user/:userID", async (req, res) => {
  const { userID } = req.params;

  try {
    const urls = await Url.find({ users: userID }); // because you're now storing in `users` array
    return res.json(urls);
  } catch (err) {
    console.error("Error fetching user URLs:", err);
    return res.status(500).json({ error: "Failed to fetch URLs" });
  }
});

export default router;
