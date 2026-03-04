export function transformPhotoUrl(photoUrl: string): string {
  if (photoUrl.includes("storage.googleapis.com") && photoUrl.includes("/uploads/")) {
    const match = photoUrl.match(/\/uploads\/([a-f0-9-]+)/);
    if (match) {
      return `/api/uploads/file/${match[1]}`;
    }
  }
  if (photoUrl.startsWith("/objects/uploads/")) {
    const objectId = photoUrl.replace("/objects/uploads/", "");
    return `/api/uploads/file/${objectId}`;
  }
  return photoUrl;
}
