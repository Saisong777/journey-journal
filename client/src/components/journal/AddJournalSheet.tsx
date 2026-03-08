import { useState, useEffect } from "react";
import { X, Camera, MapPin, Smile, Loader2, Upload } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/queryClient";
import { compressImage, extractGps, type PhotoGps, type PhotoWithMeta } from "@/lib/photoUtils";

interface AddJournalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: string;
  onSave?: (entry: {
    location: string;
    content: string;
    photos: PhotoWithMeta[];
    mood: string;
  }) => void;
}

const moods = [
  { key: "happy", emoji: "😊", label: "開心" },
  { key: "peaceful", emoji: "🙏", label: "平靜" },
  { key: "grateful", emoji: "💛", label: "感恩" },
  { key: "amazed", emoji: "✨", label: "驚嘆" },
];

export function AddJournalSheet({ open, onOpenChange, date, onSave }: AddJournalSheetProps) {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [photos, setPhotos] = useState<{ url: string; objectPath: string; gps: PhotoGps | null }[]>([]);
  const [locations, setLocations] = useState<string[]>(["其他景點"]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLocations();
    }
  }, [open, date]);

  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const attractionsUrl = date
        ? `/api/trip-days/attractions?date=${date}`
        : "/api/trip-days/today/attractions";
      const response = await fetch(attractionsUrl, {
        credentials: "include",
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(data.length > 0 ? data : ["其他景點"]);
      } else {
        setLocations(["其他景點"]);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      setLocations(["其他景點"]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const MAX_PHOTOS = 7;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    setIsUploading(true);

    try {
      const token = getAuthToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);

      // Extract GPS and compress in parallel
      const prepared = await Promise.all(filesToUpload.map(async (f) => {
        const [compressed, gpsData] = await Promise.all([compressImage(f), extractGps(f)]);
        return { compressed, gps: gpsData };
      }));

      // Upload all in parallel
      const results = await Promise.all(prepared.map(async ({ compressed: file, gps: gpsData }) => {
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
        return { url: previewUrl, objectPath, gps: gpsData };
      }));

      setPhotos(prev => [...prev, ...results]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => {
      // Revoke object URL to free memory
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    // Only content is required - location is optional
    if (content.trim()) {
      setIsSaving(true);
      try {
        await onSave?.({
          location: selectedLocation || "",
          content,
          photos: photos.map(p => ({
            photoUrl: p.objectPath,
            latitude: p.gps?.latitude ?? null,
            longitude: p.gps?.longitude ?? null,
          })),
          mood: selectedMood,
        });
        // Cleanup preview URLs
        photos.forEach(p => URL.revokeObjectURL(p.url));
        // Reset form
        setSelectedLocation("");
        setContent("");
        setSelectedMood("");
        setPhotos([]);
        onOpenChange(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Only content is required
  const isValid = content.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-title text-center">新增日誌</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] pb-4">
          {/* Location Selection - Optional */}
          <div className="space-y-3">
            <label className="text-body font-medium flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              選擇景點 <span className="text-muted-foreground text-caption">(選填)</span>
            </label>
            {isLoadingLocations ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {locations.map((location) => (
                  <button
                    key={location}
                    onClick={() => setSelectedLocation(selectedLocation === location ? "" : location)}
                    data-testid={`button-location-${location}`}
                    className={cn(
                      "px-4 py-2 rounded-full text-body transition-all touch-target",
                      selectedLocation === location
                        ? "gradient-warm text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="space-y-3">
            <label className="text-body font-medium flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              照片記錄 <span className="text-muted-foreground text-caption">({photos.length}/{MAX_PHOTOS})</span>
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={photo.url}
                    alt={`照片 ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                    loading="lazy"
                    data-testid={`img-photo-${index}`}
                  />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    data-testid={`button-remove-photo-${index}`}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
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
                    data-testid="input-photo-upload"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Journal Content */}
          <div className="space-y-3">
            <label className="text-body font-medium">
              寫下感言 <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="此刻的心情與感動..."
              className="min-h-[120px] text-body resize-none"
              data-testid="input-journal-content"
            />
          </div>

          {/* Mood Selection */}
          <div className="space-y-3">
            <label className="text-body font-medium flex items-center gap-2">
              <Smile className="w-5 h-5 text-primary" />
              此刻心情 <span className="text-muted-foreground text-caption">(選填)</span>
            </label>
            <div className="flex gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.key}
                  onClick={() => setSelectedMood(selectedMood === mood.key ? "" : mood.key)}
                  data-testid={`button-mood-${mood.key}`}
                  className={cn(
                    "flex-1 py-3 rounded-lg flex flex-col items-center gap-1 transition-all touch-target",
                    selectedMood === mood.key
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-caption">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="w-full h-14 text-body-lg gradient-warm text-primary-foreground rounded-xl"
            data-testid="button-save-journal"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                儲存中...
              </>
            ) : (
              "儲存日誌"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
