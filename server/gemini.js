import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
}

// Curated high-fashion Pinterest-style moodboard imagery library
const AESTHETIC_IMAGES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=600&auto=format&fit=crop&q=80"
];

function getAestheticImage(index = 0, styleTitle = "") {
  const hash = styleTitle.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imgIdx = (hash + index) % AESTHETIC_IMAGES.length;
  return AESTHETIC_IMAGES[imgIdx];
}

/**
 * Generate 3 curated styles using Pinterest trends & aesthetic moodboards
 */
export async function generateOutfitStyles({ occasion, gender, age, preferences = "", previousStyles = [] }) {
  const previousTitles = previousStyles.map(s => s.title).join(", ");
  
  const prompt = `You are a modern celebrity fashion stylist drawing heavy inspiration from trending PINTEREST fashion boards, viral Pinterest aesthetics (clean girl, quiet luxury, downtown streetwear, dark academia, indie sleaze, mob wife chic, minimalist tailoring, Y2K), and runway trends.

A client needs outfit concepts.

Client Profile:
- Occasion / Event: "${occasion}"
- Gender Expression: "${gender}"
- Age: ${age}
${preferences ? `- Specific Clothing Preferences: "${preferences}"` : ""}
${previousTitles ? `- Previously Generated Styles to Avoid Duplicating: ${previousTitles}` : ""}

CRITICAL INSTRUCTIONS:
1. USE PINTEREST FOR INSPIRATION: Pull inspiration from popular Pinterest moodboards, trending Pinterest outfit pins, and aesthetic tags suitable for this event.
2. KEEP DESCRIPTIONS VERY SIMPLE AND ACCESSIBLE: Use crisp, clear, modern English. Do NOT use overly dense fashion jargon. Make it instantly understandable (1-2 sentences maximum).
3. PROVIDE EXACTLY 3 DISTINCT STYLES.

For each style, provide:
1. "title": Catchy, modern aesthetic title (e.g. "Pinterest Clean Girl Tailoring", "Downtown Streetwear & Leather", "Effortless Silk Slip & Chunky Knit")
2. "tagline": A crisp, simple 1-sentence vibe.
3. "simpleDescription": 1-2 straightforward sentences explaining what the look is and why it works for the event. Simple and clear!
4. "pinterestSearchQuery": Exact Pinterest search query for this look (e.g. "clean girl tailored blazer outfit pinterest", "downtown chic leather jacket street style pinterest")
5. "colorPalette": Array of 3-4 bright, vibrant, or cohesive colors with names and hex codes (e.g. ["#2563EB Royal Cobalt", "#F43F5E Neon Fuchsia", "#FFFFFF Crisp White"]).
6. "keyPieces": Array of 3-4 essential pieces:
   - "category": "Top" | "Bottom" | "Full-Body" | "Shoes" | "Outerwear" | "Accessory"
   - "name": Simple item name (e.g. "Oversized Blazer", "Wide-Leg Trousers", "White Platform Sneakers")
   - "examples": Array of 2-3 real-world items to look for in their closet
   - "isRequired": boolean
7. "stylingTips": 1-2 simple, practical styling tips (e.g. "Tuck in the front of your top to highlight your waist.").

Respond ONLY with valid JSON strictly conforming to this schema:
{
  "styles": [
    {
      "id": "string",
      "title": "string",
      "tagline": "string",
      "simpleDescription": "string",
      "pinterestSearchQuery": "string",
      "colorPalette": ["string"],
      "keyPieces": [
        {
          "category": "string",
          "name": "string",
          "examples": ["string"],
          "isRequired": boolean
        }
      ],
      "stylingTips": ["string"]
    }
  ]
}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        }
      });

      const responseText = response.text || "";
      const parsed = JSON.parse(responseText.trim());
      if (parsed && Array.isArray(parsed.styles) && parsed.styles.length > 0) {
        return parsed.styles.map((s, idx) => {
          const pinterestQuery = s.pinterestSearchQuery || `${s.title} outfit pinterest`;
          return {
            ...s,
            id: s.id || `style_${Date.now()}_${idx}`,
            vibeDescription: s.simpleDescription || s.vibeDescription,
            imageUrl: getAestheticImage(idx, s.title),
            pinterestUrl: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(pinterestQuery)}`,
          };
        });
      }
    } catch (err) {
      console.error("Gemini API Error in generateOutfitStyles:", err);
    }
  }

  // Fallback Pinterest curated styles
  return getCuratedPinterestStyles(occasion, gender, age, preferences);
}

/**
 * Multimodal wardrobe item analysis using Gemini Vision
 */
export async function analyzeWardrobeItem({ imageBase64, mimeType = "image/jpeg", style, occasion, existingItems = [] }) {
  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  const existingSummary = existingItems.map(item => `${item.category}: ${item.itemName} (${item.color})`).join(", ");

  const prompt = `You are a friendly, chic personal stylist.
A user took a photo of an item in their closet to see if it matches their chosen Pinterest-inspired outfit.

Outfit Style: "${style.title}" - ${style.tagline}
Event: "${occasion}"
Target Key Pieces: ${JSON.stringify(style.keyPieces)}
Items already matched so far: ${existingSummary || "None yet"}

Examine the image carefully:
1. Identify the item: category ("Top" | "Bottom" | "Full-Body" | "Shoes" | "Outerwear" | "Accessory" | "Unknown"), name, color, and silhouette.
2. Does it match the style "${style.title}" and occasion "${occasion}"?
   - Keep feedback simple, positive, and easy to read.
3. If MATCH (isMatch: true):
   - Explain simply why it works with this look.
4. If NOT MATCH (isMatch: false):
   - Kindly explain in 1 simple sentence what clashes and suggest what to grab instead from their closet.
5. Suggest what piece to hunt for next with 2-3 simple examples.
6. Is the outfit complete? (true if they have top + bottom + shoes, or dress + shoes).

Respond ONLY with valid JSON:
{
  "category": "Top" | "Bottom" | "Full-Body" | "Shoes" | "Outerwear" | "Accessory" | "Unknown",
  "itemName": "string",
  "color": "string",
  "silhouette": "string",
  "isMatch": boolean,
  "confidenceScore": number,
  "stylistFeedback": "string",
  "nextRecommendedCategory": "string",
  "nextRecommendedExamples": ["string"],
  "isOutfitNowComplete": boolean,
  "runwayTip": "string"
}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const responseText = response.text || "";
      return JSON.parse(responseText.trim());
    } catch (err) {
      console.error("Gemini Vision API Error in analyzeWardrobeItem:", err);
    }
  }

  return {
    category: existingItems.length === 0 ? "Top" : existingItems.length === 1 ? "Bottom" : "Shoes",
    itemName: "Scanned Garment",
    color: "Neutral Palette",
    silhouette: "Clean Cut",
    isMatch: true,
    confidenceScore: 92,
    stylistFeedback: `Great find! This item matches the ${style.title} Pinterest aesthetic with clean lines and great balance.`,
    nextRecommendedCategory: existingItems.length === 0 ? "Bottom" : existingItems.length === 1 ? "Shoes" : "Accessory",
    nextRecommendedExamples: ["Straight-leg trousers", "Clean white sneakers", "Minimalist shoulder bag"],
    isOutfitNowComplete: existingItems.length >= 2,
    runwayTip: "Keep the styling relaxed and effortless."
  };
}

/**
 * Simple editorial review generator for the celebration screen
 */
export async function generateOutfitReview({ style, occasion, items }) {
  const itemsList = items.map(i => `- ${i.category}: ${i.itemName} (${i.color})`).join("\n");
  
  const prompt = `You are a fun, friendly personal stylist.
The user just completed their outfit inspired by Pinterest trends:

- Occasion: "${occasion}"
- Style Aesthetic: "${style.title}"
- Assembled Pieces:
${itemsList}

Write a short, upbeat, simple review (2 short paragraphs):
1. Title: A snappy, fun headline (e.g. "Effortless Street Style Ready for ${occasion}!")
2. The Review: How nicely these pieces fit together. Keep it clear, simple, and encouraging.
3. Quick Tip: One easy tip on how to wear it.

Respond ONLY with valid JSON:
{
  "editorialTitle": "string",
  "editorialReview": "string",
  "masterTip": "string"
}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      return JSON.parse(response.text.trim());
    } catch (err) {
      console.error("Gemini API Error in generateOutfitReview:", err);
    }
  }

  return {
    editorialTitle: `Nailed the Look: The ${style.title} Edit`,
    editorialReview: `You put together a fantastic outfit for ${occasion}! Pairing your ${items.map(i => i.itemName).join(" with ")} creates a clean, stylish look that feels confident and effortless.`,
    masterTip: `Keep your accessories simple and let the clean silhouette shine.`
  };
}

function getCuratedPinterestStyles(occasion, gender, age, preferences = "") {
  return [
    {
      id: `style_pin_${Date.now()}_1`,
      title: "Clean Girl Minimalist Chic",
      tagline: "Sleek, polished, and effortless Pinterest vibes.",
      vibeDescription: `A crisp, elevated aesthetic with clean tailoring and neutral tones. Comfortable, modern, and perfectly suited for ${occasion}.`,
      simpleDescription: `A crisp, elevated aesthetic with clean tailoring and neutral tones. Comfortable, modern, and perfectly suited for ${occasion}.`,
      imageUrl: AESTHETIC_IMAGES[0],
      pinterestUrl: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent("clean girl aesthetic outfit pinterest " + occasion)}`,
      colorPalette: ["#2563EB Cobalt Blue", "#FFFFFF Crisp White", "#D97706 Warm Amber"],
      keyPieces: [
        {
          category: "Top",
          name: "Oversized Tailored Blazer",
          examples: ["Black or beige boxy blazer", "Navy tailored jacket", "Relaxed linen blazer"],
          isRequired: true
        },
        {
          category: "Bottom",
          name: "Wide-Leg Flowy Trousers",
          examples: ["High-waisted pleated pants", "Cream or black straight trousers", "Relaxed dark slacks"],
          isRequired: true
        },
        {
          category: "Shoes",
          name: "Chic Chunky Loafers or Clean White Sneakers",
          examples: ["Black platform loafers", "Clean leather retro sneakers", "Pointed-toe flats"],
          isRequired: true
        }
      ],
      stylingTips: ["Tuck in a basic tee or mock neck under the open blazer for a clean, elongated silhouette."]
    },
    {
      id: `style_pin_${Date.now()}_2`,
      title: "Downtown Leather & Street Style",
      tagline: "Cool-girl energy with an edgy modern twist.",
      vibeDescription: `Inspired by viral Pinterest street-style boards. Balances a statement jacket with relaxed basics for a confident look.`,
      simpleDescription: `Inspired by viral Pinterest street-style boards. Balances a statement jacket with relaxed basics for a confident look.`,
      imageUrl: AESTHETIC_IMAGES[1],
      pinterestUrl: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent("downtown street style leather outfit pinterest " + occasion)}`,
      colorPalette: ["#E11D48 Electric Fuchsia", "#0F172A Deep Slate", "#F59E0B Bright Sun"],
      keyPieces: [
        {
          category: "Outerwear",
          name: "Vintage-Style Leather or Bomber Jacket",
          examples: ["Oversized biker jacket", "Distressed brown leather jacket", "Boxy bomber"],
          isRequired: true
        },
        {
          category: "Bottom",
          name: "Straight-Leg Denim or Cargo Pants",
          examples: ["Washed black jeans", "Mid-blue vintage denim", "Relaxed utility pants"],
          isRequired: true
        },
        {
          category: "Shoes",
          name: "Statement Lug Boots or Retro Trainers",
          examples: ["Chunky Chelsea boots", "Samba / Gazelle style trainers", "Square-toe booties"],
          isRequired: true
        }
      ],
      stylingTips: ["Mix smooth leather with comfortable cotton or denim for a textured, high-low balance."]
    },
    {
      id: `style_pin_${Date.now()}_3`,
      title: "Effortless Silk & Knit Layering",
      tagline: "Soft luxury and chic fluid silhouettes.",
      vibeDescription: `A popular Pinterest aesthetic pairing flowing silks with cozy structured knits. Chic, comfortable, and eye-catching.`,
      simpleDescription: `A popular Pinterest aesthetic pairing flowing silks with cozy structured knits. Chic, comfortable, and eye-catching.`,
      imageUrl: AESTHETIC_IMAGES[2],
      pinterestUrl: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent("slip dress knitwear layered outfit pinterest " + occasion)}`,
      colorPalette: ["#8B5CF6 Electric Violet", "#10B981 Vivid Emerald", "#F8FAFC Pure Ice"],
      keyPieces: [
        {
          category: "Full-Body",
          name: "Midi Slip Dress or Satin Skirt + Top",
          examples: ["Bias-cut black slip dress", "Silk champagne midi skirt", "Satin camisole"],
          isRequired: true
        },
        {
          category: "Top",
          name: "Oversized Cozy Knit Sweater",
          examples: ["Chunky cream crewneck", "Dark grey cardigan", "Oversized V-neck knit"],
          isRequired: false
        },
        {
          category: "Shoes",
          name: "Pointed Knee-High Boots or Slingbacks",
          examples: ["Black leather kitten-heel boots", "Sleek pointed slingback pumps", "Heeled mules"],
          isRequired: true
        }
      ],
      stylingTips: ["Drape the sweater over your shoulders or wear it oversized over the slip dress."]
    }
  ];
}
