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
      for (const keywordData of keywords) {
        if (typeof keywordData === 'string') {
          // Support legacy format (just strings)
          if (keywordData.trim()) {
            const keyword = await storage.addKeyword({ keyword: keywordData.trim(), duration: 6 });
            addedKeywords.push(keyword);
          }
        } else if (keywordData.keyword && keywordData.keyword.trim()) {
          // New format with duration
          const keyword = await storage.addKeyword({ 
            keyword: keywordData.keyword.trim(),
            duration: keywordData.duration || 6
          });
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

  // Enhanced ClipDrop API integration with better prompt accuracy
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { keyword, duration = 6 } = req.body;
      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      console.log(`Generating image for keyword: ${keyword} with duration: ${duration}`);
      
      try {
        // Try ClipDrop first, then DeepAI as primary fallback
        let imageUrl;
        try {
          imageUrl = await generateImageWithClipDrop(keyword);
        } catch (clipdropError) {
          console.log('ClipDrop failed, trying DeepAI...');
          imageUrl = await generateImageWithDeepAI(keyword);
        }
        res.json({ imageUrl, duration, source: 'ai' });
      } catch (primaryError) {
        console.error("Both ClipDrop and DeepAI failed, using image fallback:", primaryError);
        // Enhanced fallback options for better image accuracy based on keyword
        const enhancedKeyword = encodeURIComponent(keyword.replace(/[^\w\s]/g, ''));
        const fallbackOptions = [
          `https://loremflickr.com/600/400/${enhancedKeyword}`,
          `https://source.unsplash.com/600x400/?${enhancedKeyword}`,
          `https://picsum.photos/600/400?random=${enhancedKeyword}&t=${Date.now()}`
        ];
        
        // Try each fallback until one works
        for (const fallbackUrl of fallbackOptions) {
          try {
            const testResponse = await fetch(fallbackUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              res.json({ imageUrl: fallbackUrl, duration, source: 'fallback' });
              return;
            }
          } catch (e) {
            console.log(`Fallback ${fallbackUrl} failed, trying next...`);
          }
        }
        
        // Final fallback - Enhanced SVG with better visual representation
        const svgPlaceholder = `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:0.1" />
                <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:0.2" />
              </linearGradient>
            </defs>
            <rect width="600" height="400" fill="url(#grad)"/>
            <circle cx="300" cy="150" r="40" fill="#4f46e5" opacity="0.3"/>
            <text x="300" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#374151">
              ${keyword}
            </text>
            <text x="300" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
              Generated Visual
            </text>
          </svg>
        `).toString('base64')}`;
        res.json({ imageUrl: svgPlaceholder, duration, source: 'placeholder' });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      const keyword = req.body.keyword || 'nature';
      const duration = req.body.duration || 6;
      
      // Enhanced SVG placeholder as reliable fallback
      const svgPlaceholder = `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.1" />
              <stop offset="100%" style="stop-color:#f97316;stop-opacity:0.2" />
            </linearGradient>
          </defs>
          <rect width="600" height="400" fill="url(#grad)"/>
          <circle cx="300" cy="150" r="40" fill="#ef4444" opacity="0.3"/>
          <text x="300" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#374151">
            ${keyword}
          </text>
          <text x="300" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
            Visual Placeholder
          </text>
        </svg>
      `).toString('base64')}`;
      res.json({ imageUrl: svgPlaceholder, duration, source: 'error' });
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
