import type { Express } from "express";
import { db } from "./db";
import { fileUploads } from "../shared/schema";
import { eq } from "drizzle-orm";
import express from "express";
import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function registerUploadRoutes(app: Express): void {
  // POST /api/uploads/request-url — accepts JSON metadata, stores nothing yet
  // Returns a direct upload URL pointing to our own server
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      // S2: Validate file type
      if (contentType && !ALLOWED_MIME_TYPES.has(contentType)) {
        return res.status(400).json({
          error: "File type not allowed. Allowed types: JPEG, PNG, WebP, GIF, PDF",
        });
      }

      // S2: Validate file size
      if (size && size > MAX_UPLOAD_SIZE) {
        return res.status(400).json({
          error: "File too large. Maximum size is 10MB",
        });
      }

      // S2: Sanitize filename
      const safeName = sanitizeFilename(name);

      // Generate a unique ID for this upload
      const id = crypto.randomUUID();
      const uploadURL = `/api/uploads/direct/${id}`;
      const objectPath = `/objects/uploads/${id}`;

      res.json({
        uploadURL,
        objectPath,
        metadata: { name: safeName, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // PUT /api/uploads/direct/:id — receives raw binary file data
  app.put("/api/uploads/direct/:id", express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
    try {
      const id = req.params.id;
      const contentType = req.headers["content-type"] || "application/octet-stream";

      // S2: Validate content type on actual upload
      if (!ALLOWED_MIME_TYPES.has(contentType)) {
        return res.status(400).json({
          error: "File type not allowed. Allowed types: JPEG, PNG, WebP, GIF, PDF",
        });
      }

      const data = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);

      await db.insert(fileUploads).values({
        id,
        data,
        contentType,
        size: data.length,
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Error storing upload:", error);
      res.status(500).json({ error: "Failed to store upload" });
    }
  });

  // GET /api/uploads/file/:objectId — serves file from PostgreSQL (auth required)
  app.get("/api/uploads/file/:objectId", async (req, res) => {
    try {
      // Require authentication: check session or Bearer token
      const authHeader = req.headers.authorization;
      const hasToken = authHeader && authHeader.startsWith("Bearer ");
      const hasSession = (req as any).session?.userId;
      if (!hasToken && !hasSession) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const objectId = req.params.objectId;
      const [file] = await db
        .select()
        .from(fileUploads)
        .where(eq(fileUploads.id, objectId))
        .limit(1);

      if (!file) {
        return res.status(404).json({ error: "Object not found" });
      }

      res.set({
        "Content-Type": file.contentType,
        "Content-Length": file.data.length.toString(),
        "Cache-Control": "public, max-age=86400",
      });
      res.send(file.data);
    } catch (error) {
      console.error("Error serving object:", error);
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
