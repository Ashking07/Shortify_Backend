import express from "express";
import Url from "../models/URL.js"; // MongoDB model
import { authenticateToken } from "../middlewear/authMiddleware.js";
import { client } from "../db/redis.js";
import crypto from "crypto";
import { categorizeURL } from "../utils/categorizeURL.js";

const router = express.Router();

//GET the already shortened URL
// router.get("/:shortCode", async (req, res) => {
//   const { shortCode } = req.params;

//   // 1. Try Redis first
//   const cachedUrl = await client.get(shortCode);
//   if (cachedUrl) {
//     console.log("✅ Cache Hit");
//     return res.redirect(cachedUrl);
//   }

//   // 2. Fallback to Mongo
//   const doc = await Url.findOne({ shortCode });
//   if (doc) {
//     // Cache it for future
//     await client.set(shortCode, doc.originalUrl, { EX: 1800 }); // 30 mins TTL
//     console.log("🔁 Cache Miss → MongoDB Hit → Caching Now");
//     return res.redirect(doc.originalUrl);
//   }

//   return res.status(404).send("Short URL not found");
// });
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

// POST /shorten - create a new short URL
router.post("/shorten", authenticateToken, async (req, res) => {
  const { originalUrl } = req.body;
  const userID = req.userID; // ✅ pulled from decoded token

  if (!originalUrl || !userID) {
    return res
      .status(400)
      .json({ error: "originalUrl and userID are required" });
  }

  try {
    // 1. Check Redis cache
    const cachedCode = await client.get(`shorten:${originalUrl}`);
    if (cachedCode) {
      console.log("Given by cache");
      return res.json({
        shortUrl: `https://shortify-backend-phlr.onrender.com/api/${cachedCode}`,
      });
    }

    // 2. Check MongoDB for the original URL
    let urlDoc = await Url.findOne({ originalUrl });

    if (urlDoc) {
      // Add userID to users array only if not already present
      await Url.updateOne(
        { _id: urlDoc._id },
        { $addToSet: { users: userID } }
      );

      // Cache and return
      await client.set(`shorten:${originalUrl}`, urlDoc.shortCode, {
        EX: 1800,
      });

      return res.json({
        shortUrl: `https://shortify-backend-phlr.onrender.com/api/${urlDoc.shortCode}`,
      });
    }

    // 3. Create new entry if URL not found
    const combined = `${originalUrl}:${userID}`;
    const hash = crypto.createHash("sha256").update(combined).digest();
    const base64 = hash.toString("base64");
    const shortCode = base64.replace(/[+/=]/g, "").slice(0, 6);

    const category = await categorizeURL(originalUrl); //New AI integration Update!
    const newUrl = new Url({
      originalUrl,
      shortCode,
      creationDate: new Date(),
      users: [userID], // Now an array
      category, // new field
    });
    try {
      await newUrl.save();
      console.log("Saved to MongoDB");
    } catch (error) {
      console.error("Error saving to DB:", error);
    }

    // 4. Cache in Redis
    await client.set(`shorten:${originalUrl}`, shortCode, { EX: 1800 });
    await client.set(shortCode, originalUrl, { EX: 1800 });

    return res.status(201).json({
      shortUrl: `https://shortify-backend-phlr.onrender.com/api/${shortCode}`,
    });
  } catch (err) {
    console.error("Error shortening URL:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/urls/:shortCode
router.delete("/urls/:shortCode", authenticateToken, async (req, res) => {
  try {
    const { shortCode } = req.params;
    const userID = req.userID;

    const urlDoc = await Url.findOne({ shortCode });

    if (!urlDoc) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    // Remove userID from the users array
    urlDoc.users = urlDoc.users.filter(
      (id) => id.toString() !== userID.toString()
    );

    // If users array is now empty, delete the whole document
    if (urlDoc.users.length === 0) {
      await Url.deleteOne({ _id: urlDoc._id });
      await client.del(shortCode); // 🧹 Remove from Redis cache
      await client.del(`shorten:${urlDoc.originalUrl}`);
      console.log("🗑️ URL deleted from DB and Redis cache.");
    } else {
      await urlDoc.save();
      console.log("👤 User removed from URL's user list");
    }

    res.status(200).json({ message: "URL deleted successfully" });
  } catch (err) {
    console.error("🔥 Error in DELETE route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
