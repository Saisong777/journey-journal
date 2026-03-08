import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { Response } from "express";

const BUCKET_NAME = "uploads";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  }
  return createClient(url, key);
}

export class SupabaseStorageService {
  private supabase = getSupabaseClient();

  async getUploadURL(contentType?: string): Promise<{ uploadURL: string; objectPath: string }> {
    const objectId = randomUUID();
    const filePath = `uploads/${objectId}`;

    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message}`);
    }

    return {
      uploadURL: data.signedUrl,
      objectPath: `/objects/uploads/${objectId}`,
    };
  }

  async downloadObject(objectId: string, res: Response): Promise<void> {
    const filePath = `uploads/${objectId}`;

    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (error || !data) {
      throw new Error(`File not found: ${error?.message}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    res.set({
      "Content-Type": data.type || "application/octet-stream",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=3600",
    });
    res.send(buffer);
  }

  getPublicUrl(objectId: string): string {
    const filePath = `uploads/${objectId}`;
    const { data } = this.supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    return data.publicUrl;
  }
}

export const storageService = new SupabaseStorageService();
