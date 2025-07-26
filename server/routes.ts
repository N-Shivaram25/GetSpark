import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertKeywordSchema, insertImgKeyMappingSchema } from "@shared/schema";
import { generateImageWithClipDrop } from "./clipdrop";
import { generateImageWithDeepAI } from "./deepai";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Keywords routes
  app.get("/api/keywords", async (req, res) => {
    try {
      const keywords = await storage.getKeywords();
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  app.post("/api/keywords", async (req, res) => {
    try {
      const keywordData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.addKeyword(keywordData);
      res.json(keyword);
    } catch (error) {
      res.status(400).json({ message: "Invalid keyword data" });
    }
  });

  app.post("/api/keywords/batch", async (req, res) => {
    try {
      const { keywords } = req.body;
      if (!Array.isArray(keywords)) {
        return res.status(400).json({ message: "Keywords must be an array" });
      }

      const addedKeywords = [];
      for (const keywordText of keywords) {
        if (keywordText.trim()) {
          const keyword = await storage.addKeyword({ keyword: keywordText.trim() });
          addedKeywords.push(keyword);
        }
      }

      res.json(addedKeywords);
    } catch (error) {
      res.status(500).json({ message: "Failed to add keywords" });
    }
  });

  app.put("/api/keywords/:id/used", async (req, res) => {
    try {
      await storage.markKeywordUsed(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark keyword as used" });
    }
  });

  app.delete("/api/keywords", async (req, res) => {
    try {
      await storage.clearKeywords();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear keywords" });
    }
  });

  // Img Key Mappings routes
  app.get("/api/img-key-mappings", async (req, res) => {
    try {
      const mappings = await storage.getImgKeyMappings();
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch img key mappings" });
    }
  });

  app.post("/api/img-key-mappings", upload.array('images'), async (req, res) => {
    try {
      const { keyword, duration, bulletPoints } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      const imageUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const imageUrl = await storage.saveImage(file.buffer, file.originalname);
          imageUrls.push(imageUrl);
        }
      }

      const mappingData = insertImgKeyMappingSchema.parse({
        keyword,
        imageUrls,
        duration: parseInt(duration) || 6,
        bulletPoints: bulletPoints === 'true'
      });

      const mapping = await storage.addImgKeyMapping(mappingData);
      res.json(mapping);
    } catch (error) {
      console.error("Error creating img key mapping:", error);
      res.status(400).json({ message: "Invalid mapping data" });
    }
  });

  app.delete("/api/img-key-mappings/:id", async (req, res) => {
    try {
      await storage.deleteImgKeyMapping(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mapping" });
    }
  });

  // ClipDrop API integration
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { keyword } = req.body;
      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      console.log(`Generating image for keyword: ${keyword}`);
      
      try {
        // Try ClipDrop first, then DeepAI as primary fallback
        let imageUrl;
        try {
          imageUrl = await generateImageWithClipDrop(keyword);
        } catch (clipdropError) {
          console.log('ClipDrop failed, trying DeepAI...');
          imageUrl = await generateImageWithDeepAI(keyword);
        }
        res.json({ imageUrl });
      } catch (primaryError) {
        console.error("Both ClipDrop and DeepAI failed, using image fallback:", primaryError);
        // Multiple fallback options for better image accuracy
        const fallbackOptions = [
          `https://api.lorem.space/image/abstract?w=600&h=400&hash=${encodeURIComponent(keyword)}`,
          `https://loremflickr.com/600/400/${encodeURIComponent(keyword)}`,
          `https://picsum.photos/600/400?random=${encodeURIComponent(keyword)}&t=${Date.now()}`
        ];
        
        // Try each fallback until one works
        for (const fallbackUrl of fallbackOptions) {
          try {
            const testResponse = await fetch(fallbackUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              res.json({ imageUrl: fallbackUrl });
              return;
            }
          } catch (e) {
            console.log(`Fallback ${fallbackUrl} failed, trying next...`);
          }
        }
        
        // Final fallback - SVG placeholder with keyword
        const svgPlaceholder = `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="600" height="400" fill="#f0f0f0"/>
            <text x="300" y="200" text-anchor="middle" font-family="Arial" font-size="20" fill="#666">
              ${keyword}
            </text>
          </svg>
        `).toString('base64')}`;
        res.json({ imageUrl: svgPlaceholder });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      const keyword = req.body.keyword || 'nature';
      
      // SVG placeholder as reliable fallback
      const svgPlaceholder = `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="600" height="400" fill="#f0f0f0"/>
          <text x="300" y="200" text-anchor="middle" font-family="Arial" font-size="20" fill="#666">
            ${keyword}
          </text>
        </svg>
      `).toString('base64')}`;
      res.json({ imageUrl: svgPlaceholder });
    }
  });

  // Serve images
  app.get("/api/images/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const imageBuffer = (storage as any).images.get(filename);
      
      if (!imageBuffer) {
        return res.status(404).json({ message: "Image not found" });
      }

      const extension = filename.split('.').pop()?.toLowerCase();
      let contentType = 'image/jpeg';
      
      switch (extension) {
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.send(imageBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
