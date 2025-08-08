// // server/index.js
// import express, { json } from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { connectToMongo } from "./db/mongo.js";
// import { client } from "./db/redis.js";
// import shortenRouter from "./routes/shorten.js";
// import authRoutes from "./routes/auth.js";
// import urlRoutes from "./routes/urls.js";
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT;

// app.use(cors());
// app.use(json());

// await connectToMongo();
// await client.connect();

// app.use("/api", shortenRouter);
// app.use("/auth", authRoutes);
// app.use("/api/urls", urlRoutes); // where urlRoutes has the /user/:userID handler

// app.get("/", (req, res) => {
//   res.send("Server is running...");
// });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

// server/index.js
import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { connectToMongo } from "./db/mongo.js";
import { client } from "./db/redis.js";
import shortenRouter from "./routes/shorten.js";
import redirectRouter from "./routes/redirect.js";
import authRoutes from "./routes/auth.js";
import urlRoutes from "./routes/urls.js";
import feedBackRouter from "./routes/feedback.js";
import { sanitizeInput } from "./middlewear/sanitizeInput.js"; // New sanitizer middleware

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 🛡 Security Middleware
app.use(helmet()); // Set secure HTTP headers
app.use(hpp()); // Prevent HTTP parameter pollution

// Use a more modern and compatible sanitizer.
// We'll create a new middleware for this.
app.use(sanitizeInput);

// ✅ Body parser
app.use(json({ limit: "10kb" })); // Body limit

// 🚫 Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter); // Apply to all /api routes

// ✅ CORS
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN?.split(",") ||
      "https://shortify-frontend-psi.vercel.app",
    credentials: true,
  })
);

// ✅ Connect DBs
await connectToMongo();
await client.connect();

// ✅ Routes
app.use("/", redirectRouter); // mount the redirect route at root
app.use("/api", shortenRouter); // everything else under /api
app.use("/auth", authRoutes);
app.use("/api/urls", urlRoutes);
app.use("/feedback", feedBackRouter);

// Health Check
// app.get("/", (req, res) => {
//   res.send("Shortify Backend is live at shfy.live and also on Render 🚀");
// });

app.listen(PORT, () => {
  console.log(
    `✅ Server running on https://shortify-backend-phlr.onrender.com and https://shfy.live`
  );
});
