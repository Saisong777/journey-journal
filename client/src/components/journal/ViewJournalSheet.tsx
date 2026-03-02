import { useState, useEffect } from "react";
import { MapPin, Clock, Trash2, Loader2, Pencil, Save, X, Upload, Camera } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JournalEntryData } from "./JournalEntry";
import { getAuthToken } from "@/lib/queryClient";

const MAX_PHOTOS = 7;

interface ViewJournalSheetProps {
  entry: JournalEntryData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (id: string, data: { content: string; location: string; photos?: string[] }) => Promise<void>;
}

const moodLabels: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "開心" },
  peaceful: { emoji: "🙏", label: "平靜" },
  grateful: { emoji: "💛", label: "感恩" },
  amazed: { emoji: "✨", label: "驚嘆" },
};

function transformPhotoUrl(photoUrl: string): string {
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

interface EditPhoto {
  displayUrl: string;
  objectPath: string;
  isNew: boolean;
}

export function ViewJournalSheet({ entry, open, onOpenChange, onDelete, onUpdate }: ViewJournalSheetProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhotos, setEditPhotos] = useState<EditPhoto[]>([]);

  useEffect(() => {
    if (entry) {
      setEditContent(entry.content);
      setEditLocation(entry.location || "");
      setEditPhotos((entry.originalPhotoPaths || entry.photos).map(p => ({
        displayUrl: transformPhotoUrl(p),
        objectPath: p,
        isNew: false,
      })));
    }
  }, [entry]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  if (!entry) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      const photoPaths = editPhotos.map(p => p.objectPath);
      await onUpdate(entry.id, { content: editContent, location: editLocation, photos: photoPaths });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(entry.content);
    setEditLocation(entry.location || "");
    setEditPhotos((entry.originalPhotoPaths || entry.photos).map(p => ({
      displayUrl: transformPhotoUrl(p),
      objectPath: p,
      isNew: false,
    })));
    setIsEditing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_PHOTOS - editPhotos.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        const token = getAuthToken();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const urlResponse = await fetch("/api/uploads/request-url", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type,
          }),
        });

        if (!urlResponse.ok) throw new Error("Failed to get upload URL");

        const { uploadURL, objectPath } = await urlResponse.json();

        const uploadResponse = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload file");

        const previewUrl = URL.createObjectURL(file);
        setEditPhotos(prev => [...prev, { displayUrl: previewUrl, objectPath, isNew: true }]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setEditPhotos(prev => {
      const photo = prev[index];
      if (photo.isNew && photo.displayUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photo.displayUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-title">
                {isEditing ? "編輯日誌" : "日誌詳情"}
              </SheetTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-journal"
                >
                  <Pencil className="w-5 h-5" />
                </Button>
              )}
            </div>
            <SheetDescription className="sr-only">查看或編輯日誌內容</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-180px)] pb-4">
            {isEditing ? (
              <div className="space-y-3">
                <label className="text-body font-medium flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  照片記錄 <span className="text-muted-foreground text-caption">({editPhotos.length}/{MAX_PHOTOS})</span>
                </label>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {editPhotos.map((photo, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img
                        src={photo.displayUrl}
                        alt={`照片 ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg"
                        data-testid={`img-edit-photo-${index}`}
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        data-testid={`button-remove-edit-photo-${index}`}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {editPhotos.length < MAX_PHOTOS && (
                    <label className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6" />
                          <span className="text-caption">添加照片</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                        data-testid="input-edit-photo-upload"
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              entry.photos.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {entry.photos.map((photo, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo}
                          alt={`照片 ${index + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`img-view-photo-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {isEditing ? (
              <div className="space-y-3">
                <label className="text-body font-medium flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  景點 <span className="text-muted-foreground text-caption">(選填)</span>
                </label>
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="輸入景點名稱"
                  data-testid="input-edit-location"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                {entry.location && (
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-5 h-5" />
                    <span className="text-body font-medium">{entry.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                  <Clock className="w-4 h-4" />
                  <span className="text-caption">{entry.time}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-body font-medium">感言內容</h3>
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="寫下你的感言..."
                  className="min-h-[150px] text-body resize-none"
                  data-testid="input-edit-content"
                />
              ) : (
                <p className="text-body text-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              )}
            </div>

            {!isEditing && entry.mood && moodLabels[entry.mood] && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-3">
                <span className="text-2xl">{moodLabels[entry.mood].emoji}</span>
                <span className="text-body">心情：{moodLabels[entry.mood].label}</span>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
            {isEditing ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 h-12"
                  data-testid="button-cancel-edit"
                >
                  <X className="w-5 h-5 mr-2" />
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !editContent.trim()}
                  className="flex-1 h-12 gradient-warm text-primary-foreground"
                  data-testid="button-save-edit"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      儲存修改
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 h-12"
                  data-testid="button-start-edit"
                >
                  <Pencil className="w-5 h-5 mr-2" />
                  編輯
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="flex-1 h-12"
                  data-testid="button-delete-journal"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      刪除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      刪除
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這則日誌嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原，日誌及相關照片將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
