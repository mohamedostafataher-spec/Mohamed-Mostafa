import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use the Gemini API key from environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  app.use(express.json());

  // API Route: Generate Splash Image
  app.get("/api/generate-splash", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    try {
      // Using gemini-2.5-flash-image for standard image generation as per skill guidelines
      const interaction = await ai.interactions.create({
        model: 'gemini-2.5-flash-image',
        input: "A high-end, luxury close-up of folded silk satin sleepwear in a soft champagne color, with an elegant rose gold SULTA logo visible on a ribbon, cinematic lighting, 8k resolution, minimalist aesthetic.",
        response_modalities: ['image'],
        generation_config: {
          image_config: {
            aspect_ratio: "16:9",
            image_size: "1K"
          },
        },
      });

      let imageUrl = null;
      for (const step of interaction.steps) {
        if (step.type === 'model_output') {
          const imageContent = step.content?.find(c => c.type === 'image');
          if (imageContent && imageContent.data) {
            const base64EncodeString: string = imageContent.data;
            const mimeType = imageContent.mime_type || 'image/png';
            imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
            break;
          }
        }
      }

      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: "Failed to generate image" });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
