import type { Express } from "express";
import { db } from "./db";
import { fileUploads } from "../shared/schema";
import { eq } from "drizzle-orm";
import express from "express";
import path from "path";
import { isR2Configured, uploadToR2, getPublicUrl } from "./r2";

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
  // POST /api/uploads/request-url — returns a local upload URL (server proxies to R2)
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      // Require authentication (session or Bearer token)
      const authHeader = req.headers.authorization;
      const hasToken = authHeader && authHeader.startsWith("Bearer ");
      const hasSession = (req as any).session?.userId;
      if (!hasToken && !hasSession) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      if (contentType && !ALLOWED_MIME_TYPES.has(contentType)) {
        return res.status(400).json({
          error: "File type not allowed. Allowed types: JPEG, PNG, WebP, GIF, PDF",
        });
      }

      if (size && size > MAX_UPLOAD_SIZE) {
        return res.status(400).json({
          error: "File too large. Maximum size is 10MB",
        });
      }

      const safeName = sanitizeFilename(name);
      const id = crypto.randomUUID();

      // Always use local upload URL — server will proxy to R2 if configured
      const uploadURL = `/api/uploads/direct/${id}`;
      const objectPath = isR2Configured() ? `r2://uploads/${id}` : `/objects/uploads/${id}`;

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

  // PUT /api/uploads/direct/:id — receives file, stores to R2 or PostgreSQL
  app.put("/api/uploads/direct/:id", express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
    try {
      // No auth check needed — the upload ID is a random UUID from request-url
      // which already requires authentication
      const id = req.params.id;
      const contentType = req.headers["content-type"] || "application/octet-stream";

      if (!ALLOWED_MIME_TYPES.has(contentType)) {
        return res.status(400).json({
          error: "File type not allowed. Allowed types: JPEG, PNG, WebP, GIF, PDF",
        });
      }

      const data = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);

      if (isR2Configured()) {
        // Upload to R2
        await uploadToR2(`uploads/${id}`, data, contentType);
      } else {
        // Fallback: store in PostgreSQL
        await db.insert(fileUploads).values({
          id,
          data,
          contentType,
          size: data.length,
        });
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Error storing upload:", error);
      res.status(500).json({ error: "Failed to store upload" });
    }
  });

  // GET /api/uploads/file/:objectId — serves file from R2 or PostgreSQL
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

      // Try R2 first if configured — redirect to presigned URL
      if (isR2Configured()) {
        const key = `uploads/${objectId}`;
        const url = await getPublicUrl(key);
        return res.redirect(302, url);
      }

      // Fallback: serve from PostgreSQL
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
