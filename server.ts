import express from "express";
import path from "path";
import fs from "fs";
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

  // Middleware to disable caching during development/updates
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // API Route: Generate Splash Image
  app.get("/api/generate-splash", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    try {
      // Using gemini-2.0-flash which is the recommended model for Interactions
      const interaction = await ai.interactions.create({
        model: 'gemini-2.0-flash',
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
      appType: "custom", // Use 'custom' to handle the main HTML response manually
    });
    
    app.use(vite.middlewares);

    // Dynamic SEO middleware for development
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API if not handled by previous routes, and skip anything that looks like a file
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }

      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (!fs.existsSync(indexPath)) {
           console.error("index.html not found in dev at:", indexPath);
           return next();
        }
        
        let html = fs.readFileSync(indexPath, 'utf-8');
        // Transform the index.html for Vite features (client script injection)
        html = await vite.transformIndexHtml(url, html);
        
        const seo = {
          title: "Sulta | بيت الأزياء الملكي - لانجري وبيجامات فاخرة",
          description: "اكتشفي عالم SULTA الساحر: أرقى مجموعات البيجامات واللانجري المصنوعة من الساتان الإيطالي والحرير الطبيعي. تجربة ملكية تبدأ من اختيارك.",
          image: "/src/assets/images/hero_sleepwear_luxury_1780620325112.png"
        };

        const finalHtml = html
          .replace(/__TITLE__/g, seo.title)
          .replace(/__DESCRIPTION__/g, seo.description)
          .replace(/__IMAGE__/g, seo.image);
          
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    
    app.get('*', (req, res) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send("Index file not found");
        }
        let html = fs.readFileSync(indexPath, 'utf-8');
        
        const seo = {
          title: "Sulta | بيت الأزياء الملكي - لانجري وبيجامات فاخرة",
          description: "اكتشفي عالم SULTA الساحر: أرقى مجموعات البيجامات واللانجري المصنوعة من الساتان الإيطالي والحرير الطبيعي. تجربة ملكية تبدأ من اختيارك.",
          image: "/src/assets/images/hero_sleepwear_luxury_1780620325112.png"
        };

        const finalHtml = html
          .replace(/__TITLE__/g, seo.title)
          .replace(/__DESCRIPTION__/g, seo.description)
          .replace(/__IMAGE__/g, seo.image);
          
        res.status(200).set({ 'Content-Type': 'text/html' }).send(finalHtml);
      } catch (e) {
        res.status(500).send("Error loading page");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
