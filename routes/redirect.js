import express from "express";
import { client } from "../db/redis.js";
import Url from "../models/URL.js"; // MongoDB model

const router = express.Router();

router.get("/:shortCode", async (req, res) => {
  const { shortCode } = req.params;

  try {
    // 1. Try Redis first
    const cachedUrl = await client.get(shortCode);
    if (cachedUrl) {
      console.log("✅ Cache Hit");

      // Increment click count in MongoDB
      await Url.findOneAndUpdate({ shortCode }, { $inc: { clicks: 1 } });

      return res.redirect(cachedUrl);
    }

    // 2. Fallback to MongoDB
    const doc = await Url.findOneAndUpdate(
      { shortCode },
      { $inc: { clicks: 1 } } // Increment clicks while fetching
    );

    if (doc) {
      // Cache it for next time
      await client.set(shortCode, doc.originalUrl, { EX: 1800 }); // 30 mins TTL
      console.log("🔁 Cache Miss → MongoDB Hit → Caching Now");

      return res.redirect(doc.originalUrl);
    }

    return res.status(404).send("Short URL not found");
  } catch (err) {
    console.error("Error during redirect:", err);
    return res.status(500).send("Server error");
  }
});

export default router;
