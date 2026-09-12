import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Video } from "@vonage/video";
import { Auth } from "@vonage/auth";
import { generateOutfitStyles, analyzeWardrobeItem, generateOutfitReview } from "../server/gemini.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let vonageVideo = null;
const vonageAppId = process.env.VONAGE_APPLICATION_ID || "e19566a8-75fb-4e14-beb1-52f2d5eba4e7";
let privateKey = process.env.VONAGE_PRIVATE_KEY || "";
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
  } catch (err) {
    console.error("Vercel Vonage Video init error:", err);
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory outfits store for serverless execution
let inMemoryOutfits = [];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), platform: "vercel" });
});

app.get("/api/vonage/session", async (req, res) => {
  try {
    if (!vonageVideo) {
      return res.status(503).json({ error: "Vonage Video client not configured" });
    }
    const session = await vonageVideo.createSession();
    const token = vonageVideo.generateClientToken(session.sessionId);
    res.json({
      applicationId: vonageAppId,
      sessionId: session.sessionId,
      token
    });
  } catch (err) {
    console.error("Vercel Vonage session error:", err);
    res.status(500).json({ error: "Failed to create Vonage Video session", message: err.message });
  }
});

app.post("/api/styles", async (req, res) => {
  try {
    const { occasion, gender, age, preferences, previousStyles } = req.body;
    if (!occasion) {
      return res.status(400).json({ error: "Occasion/event is required" });
    }
    const styles = await generateOutfitStyles({
      occasion,
      gender: gender || "Unisex",
      age: age || 24,
      preferences: preferences || "",
      previousStyles: previousStyles || []
    });
    res.json({ styles });
  } catch (err) {
    console.error("Vercel styles API error:", err);
    res.status(500).json({ error: "Failed to generate styles", message: err.message });
  }
});

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
    console.error("Vercel analyze-garment API error:", err);
    res.status(500).json({ error: "Failed to analyze garment", message: err.message });
  }
});

app.post("/api/review-outfit", async (req, res) => {
  try {
    const { style, occasion, items } = req.body;
    if (!style || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Style and items are required" });
    }
    const review = await generateOutfitReview({ style, occasion, items });
    res.json({ review });
  } catch (err) {
    console.error("Vercel review-outfit API error:", err);
    res.status(500).json({ error: "Failed to generate outfit review", message: err.message });
  }
});

app.get("/api/outfits", (req, res) => {
  const folders = {};
  inMemoryOutfits.forEach(outfit => {
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
    outfits: inMemoryOutfits,
    folders: Object.values(folders)
  });
});

app.post("/api/outfits", (req, res) => {
  try {
    const { styleName, styleId, occasionTag, items, editorialReview, createdAt } = req.body;
    if (!styleName || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid outfit payload" });
    }

    const newOutfit = {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      styleName,
      styleId: styleId || "custom",
      occasionTag: occasionTag || "Event",
      items,
      editorialReview: editorialReview || null,
      createdAt: createdAt || new Date().toISOString()
    };

    inMemoryOutfits.unshift(newOutfit);
    res.status(201).json({ outfit: newOutfit });
  } catch (err) {
    console.error("Vercel outfits post error:", err);
    res.status(500).json({ error: "Failed to save outfit" });
  }
});

app.delete("/api/outfits/:id", (req, res) => {
  const { id } = req.params;
  inMemoryOutfits = inMemoryOutfits.filter(o => o.id !== id);
  res.json({ success: true, remaining: inMemoryOutfits.length });
});

export default app;
