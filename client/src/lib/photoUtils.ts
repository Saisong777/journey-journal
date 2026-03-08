import exifr from "exifr";

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;

export interface PhotoGps {
  latitude: number;
  longitude: number;
}

export interface PhotoWithMeta {
  photoUrl: string;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Extract GPS coordinates from photo EXIF data.
 * Must be called on the ORIGINAL file before compressImage() strips EXIF.
 */
export async function extractGps(file: File): Promise<PhotoGps | null> {
  try {
    if (!file.type.startsWith("image/")) return null;
    const coords = await exifr.gps(file);
    if (coords && typeof coords.latitude === "number" && typeof coords.longitude === "number") {
      return { latitude: coords.latitude, longitude: coords.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Compress an image file using canvas.
 * Resizes to max 1920px on longest side and re-encodes as JPEG at 80% quality.
 */
export function compressImage(file: File): Promise<File> {
  // Skip non-image files and GIFs (preserve animation)
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return Promise.resolve(file);
  }
  // Skip small files (< 300KB)
  if (file.size < 300 * 1024) {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Scale down if larger than MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
          } else {
            resolve(file); // Compressed is larger, keep original
          }
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // On error, keep original
    };
    img.src = url;
  });
}

export function transformPhotoUrl(photoUrl: string): string {
  // R2 images: stored as "r2://uploads/{uuid}"
  if (photoUrl.startsWith("r2://")) {
    const key = photoUrl.slice(5); // "uploads/{uuid}"
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
    }
    // Fallback: use server endpoint which will redirect to R2
    const objectId = key.replace("uploads/", "");
    return `/api/uploads/file/${objectId}`;
  }

  // Legacy: Google Cloud Storage URLs
  if (photoUrl.includes("storage.googleapis.com") && photoUrl.includes("/uploads/")) {
    const match = photoUrl.match(/\/uploads\/([a-f0-9-]+)/);
    if (match) {
      return `/api/uploads/file/${match[1]}`;
    }
  }

  // Legacy: PostgreSQL bytea objects
  if (photoUrl.startsWith("/objects/uploads/")) {
    const objectId = photoUrl.replace("/objects/uploads/", "");
    return `/api/uploads/file/${objectId}`;
  }

  return photoUrl;
}
