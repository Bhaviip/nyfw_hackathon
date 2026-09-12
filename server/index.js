import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Video } from "@vonage/video";
import { Auth } from "@vonage/auth";
import { generateOutfitStyles, analyzeWardrobeItem, generateOutfitReview } from "./gemini.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "..", "data", "outfits.json");

// Initialize Vonage Video API client
let vonageVideo = null;
const vonageAppId = process.env.VONAGE_APPLICATION_ID || "e19566a8-75fb-4e14-beb1-52f2d5eba4e7";
let privateKey = "";
try {
  const pkPath = path.join(__dirname, "..", "vonage_private.key");
  if (fs.existsSync(pkPath)) {
    privateKey = fs.readFileSync(pkPath, "utf-8");
  }
} catch (e) {}

if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET && privateKey) {
  try {
    const auth = new Auth({
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET,
      applicationId: vonageAppId,
      privateKey
    });
    vonageVideo = new Video(auth);
    console.log("Vonage Video API Client ready");
  } catch (err) {
    console.error("Vonage Video initialization error:", err);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// High payload limit for image snapshots
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Ensure data directory and file exist
function loadOutfits() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = [];
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading outfits data:", err);
    return [];
  }
}

function saveOutfits(outfits) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(outfits, null, 2));
  } catch (err) {
    console.error("Error writing outfits data:", err);
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Vonage Video Session & Client Token Generator
app.get("/api/vonage/session", async (req, res) => {
  try {
    if (!vonageVideo) {
      return res.status(503).json({ error: "Vonage Video client not initialized" });
    }
    const session = await vonageVideo.createSession();
    const token = vonageVideo.generateClientToken(session.sessionId);
    res.json({
      applicationId: vonageAppId,
      sessionId: session.sessionId,
      token
    });
  } catch (err) {
    console.error("Failed to generate Vonage Video session:", err);
    res.status(500).json({ error: "Failed to generate Vonage session", message: err.message });
  }
});

// 1. Generate Styles from Gemini
app.post("/api/styles", async (req, res) => {
  try {
    const { occasion, gender, age, preferences, previousStyles } = req.body;
    if (!occasion) {
      return res.status(400).json({ error: "Occasion/event is required" });
    }
    const styles = await generateOutfitStyles({
      occasion,
      gender: gender || "Unisex / Any",
      age: age || 25,
      preferences: preferences || "",
      previousStyles: previousStyles || []
    });
    res.json({ styles });
  } catch (err) {
    console.error("Failed to generate styles:", err);
    res.status(500).json({ error: "Failed to generate styles", message: err.message });
  }
});

// 2. Analyze Garment Photo via Gemini Vision
app.post("/api/analyze-garment", async (req, res) => {
  try {
    const { imageBase64, mimeType, style, occasion, existingItems } = req.body;
    if (!imageBase64 || !style) {
      return res.status(400).json({ error: "Image data and selected style are required" });
    }

    const analysis = await analyzeWardrobeItem({
      imageBase64,
      mimeType: mimeType || "image/jpeg",
      style,
      occasion: occasion || "Special Occasion",
      existingItems: existingItems || []
    });

    res.json({ analysis });
  } catch (err) {
    console.error("Failed to analyze garment:", err);
    res.status(500).json({ error: "Failed to analyze garment", message: err.message });
  }
});

// 3. Generate Editorial Review for Complete Outfit
app.post("/api/review-outfit", async (req, res) => {
  try {
    const { style, occasion, items } = req.body;
    if (!style || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Style and items are required" });
    }
    const review = await generateOutfitReview({ style, occasion, items });
    res.json({ review });
  } catch (err) {
    console.error("Failed to generate outfit review:", err);
    res.status(500).json({ error: "Failed to generate outfit review", message: err.message });
  }
});

// 4. Get all saved outfits organized by style folders
app.get("/api/outfits", (req, res) => {
  const outfits = loadOutfits();
  // Group by style folder
  const folders = {};
  outfits.forEach(outfit => {
    const folderName = outfit.styleName || "Uncategorized";
    if (!folders[folderName]) {
      folders[folderName] = {
        folderName,
        outfits: [],
        totalLooks: 0
      };
    }
    folders[folderName].outfits.push(outfit);
    folders[folderName].totalLooks++;
  });

  res.json({
    outfits,
    folders: Object.values(folders)
  });
});

// 5. Save completed outfit
app.post("/api/outfits", (req, res) => {
  try {
    const { styleName, styleId, occasionTag, items, editorialReview, createdAt } = req.body;
    if (!styleName || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid outfit payload" });
    }

    const outfits = loadOutfits();
    const newOutfit = {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      styleName,
      styleId: styleId || "custom",
      occasionTag: occasionTag || "Event",
      items,
      editorialReview: editorialReview || null,
      createdAt: createdAt || new Date().toISOString()
    };

    outfits.unshift(newOutfit);
    saveOutfits(outfits);

    res.status(201).json({ outfit: newOutfit });
  } catch (err) {
    console.error("Failed to save outfit:", err);
    res.status(500).json({ error: "Failed to save outfit" });
  }
});

// 6. Delete an outfit
app.delete("/api/outfits/:id", (req, res) => {
  const { id } = req.params;
  const outfits = loadOutfits();
  const filtered = outfits.filter(o => o.id !== id);
  saveOutfits(filtered);
  res.json({ success: true, remaining: filtered.length });
});

// Serve static client assets if built
const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Fashion Stylist Server running on http://localhost:${PORT}`);
});
