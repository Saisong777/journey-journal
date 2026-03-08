import type { Express } from "express";
import { storageService } from "./supabaseStorage";

export function registerUploadRoutes(app: Express): void {
  // POST /api/uploads/request-url — same contract as Replit object storage
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const { uploadURL, objectPath } = await storageService.getUploadURL(contentType);

      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // GET /api/uploads/file/:objectId — same contract as Replit object storage
  app.get("/api/uploads/file/:objectId", async (req, res) => {
    try {
      const objectId = req.params.objectId;
      await storageService.downloadObject(objectId, res);
    } catch (error) {
      console.error("Error serving object:", error);
      return res.status(404).json({ error: "Object not found" });
    }
  });
}
