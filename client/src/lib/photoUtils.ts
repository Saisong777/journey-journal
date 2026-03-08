const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "";

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
