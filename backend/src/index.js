import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import watchlistRoutes from "./routes/watchlist.js";
import tmdbRoutes from "./routes/tmdbProxy.js";
import reviewsRoutes from "./routes/reviews.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const mongoUrl = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tcc-mamahalls";
let dbConnected = false;

if (!process.env.MONGO_URI) {
  console.warn("Warning: MONGO_URI not set. Using default local URI. Create a .env with a MONGO_URI for Atlas or production.");
} else if (process.env.MONGO_URI.includes("<") || process.env.MONGO_URI.includes(">")) {
  console.warn("Warning: MONGO_URI appears to contain placeholders. Replace placeholders in .env with actual credentials.");
}

async function connectWithRetry(delayMs = 5000) {
  try {
    await mongoose.connect(mongoUrl, { autoIndex: true });
    dbConnected = true;
    console.log("Connected to MongoDB");
  } catch (err) {
    dbConnected = false;
    console.error("MongoDB connection error:", err.message || err);
    console.log(`Retrying connection in ${delayMs / 1000}s...`);
    setTimeout(() => connectWithRetry(delayMs), delayMs);
  }
}

// Start trying to connect (will retry on failure)
connectWithRetry();

// Health endpoint
app.get("/health", (req, res) => {
  return res.json({ ok: true, dbConnected });
});

app.get("/users", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "Database not connected" });
  try {
    const all = await User.find().select("username createdAt");
    return res.json(all);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/users", async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: "Database not connected" });
  const { username, password } = req.body || {};
  const clean = (v) => (typeof v === 'string' && v.trim() !== '') ? v.trim() : undefined;
  const cleanUsername = clean(username);
  if (!cleanUsername || !password) return res.status(400).json({ error: "username and password required" });

  try {
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) return res.status(409).json({ error: "username already exists" });

    const user = new User({ username: cleanUsername, password });
    await user.save();
    return res.status(201).json({ id: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    if (err && err.code === 11000) return res.status(409).json({ error: 'Duplicate key' });
    return res.status(500).json({ error: "Could not create user" });
  }
});

// API routes
app.use('/auth', authRoutes);
app.use('/watchlist', watchlistRoutes);
app.use('/tmdb', tmdbRoutes);
app.use('/reviews', reviewsRoutes);

// Serve frontend build if exists at ../front-end/cinelist/dist or ../front-end/cinelist/build
import { existsSync } from 'fs';
import { join } from 'path';
const possible = [
  join(process.cwd(), '..', 'front-end', 'cinelist', 'dist'),
  join(process.cwd(), '..', 'front-end', 'cinelist', 'build')
];
const staticDir = possible.find(p => existsSync(p));
if (staticDir) {
  console.log('Serving frontend from', staticDir);
  app.use(express.static(staticDir));
  app.get('*', (req, res) => res.sendFile(join(staticDir, 'index.html')));
}

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
