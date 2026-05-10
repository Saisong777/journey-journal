import { useState, useEffect, useMemo, useRef } from "react";
import { X, Camera, MapPin, Smile, Loader2, Upload, CloudOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { get, set, del } from "idb-keyval";
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
import { compressImage, extractGps, transformPhotoUrl, type PhotoGps, type PhotoWithMeta } from "@/lib/photoUtils";
import { useToast } from "@/hooks/use-toast";

interface AddJournalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: string;
  defaultLocation?: string;
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

type PhotoDraft = {
  url: string;
  objectPath: string;
  gps: PhotoGps | null;
  file?: File;
  status: "uploaded" | "pending";
};

type PersistedPhotoDraft =
  | {
      status: "uploaded";
      objectPath: string;
      gps: PhotoGps | null;
    }
  | {
      status: "pending";
      file: File;
      gps: PhotoGps | null;
    };

type JournalDraft = {
  selectedLocation: string;
  content: string;
  selectedMood: string;
  photos: PersistedPhotoDraft[];
  updatedAt: number;
};

const MAX_PHOTOS = 7;

export function AddJournalSheet({ open, onOpenChange, date, defaultLocation, onSave }: AddJournalSheetProps) {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [locations, setLocations] = useState<string[]>(["其他景點"]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRetryingUploads, setIsRetryingUploads] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const { toast } = useToast();
  const hydratedRef = useRef(false);
  const draftKey = useMemo(() => `journey-journal-draft:${date || "today"}`, [date]);

  useEffect(() => {
    if (open) {
      if (defaultLocation && !selectedLocation) {
        setSelectedLocation(defaultLocation);
      }
      fetchLocations();
    }
  }, [open, date, defaultLocation]);

  useEffect(() => {
    if (!open || hydratedRef.current) return;

    hydratedRef.current = true;
    get<JournalDraft>(draftKey)
      .then((draft) => {
        if (!draft) return;
        setSelectedLocation(draft.selectedLocation || defaultLocation || "");
        setContent(draft.content || "");
        setSelectedMood(draft.selectedMood || "");
        setPhotos(
          draft.photos.slice(0, MAX_PHOTOS).map((photo) => {
            if (photo.status === "uploaded") {
              return {
                status: "uploaded",
                objectPath: photo.objectPath,
                gps: photo.gps,
                url: transformPhotoUrl(photo.objectPath),
              };
            }

            return {
              status: "pending",
              objectPath: "",
              gps: photo.gps,
              file: photo.file,
              url: URL.createObjectURL(photo.file),
            };
          })
        );
        setDraftRestored(true);
      })
      .catch(() => {});

    return () => {
      hydratedRef.current = false;
    };
  }, [defaultLocation, draftKey, open]);

  useEffect(() => {
    if (!open || !hydratedRef.current) return;

    const hasDraft = content.trim() || selectedLocation || selectedMood || photos.length > 0;
    const timeoutId = window.setTimeout(() => {
      if (!hasDraft) {
        del(draftKey).catch(() => {});
        return;
      }

      const draft: JournalDraft = {
        selectedLocation,
        content,
        selectedMood,
        photos: photos.map((photo) =>
          photo.status === "uploaded"
            ? { status: "uploaded", objectPath: photo.objectPath, gps: photo.gps }
            : { status: "pending", file: photo.file!, gps: photo.gps }
        ),
        updatedAt: Date.now(),
      };
      set(draftKey, draft).catch(() => {});
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [content, draftKey, open, photos, selectedLocation, selectedMood]);

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

  const uploadPreparedPhoto = async (file: File, gpsData: PhotoGps | null): Promise<PhotoDraft> => {
    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

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

    return {
      status: "uploaded",
      url: URL.createObjectURL(file),
      objectPath,
      gps: gpsData,
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    setIsUploading(true);

    try {
      const filesToUpload = Array.from(files).slice(0, remaining);

      const prepared = await Promise.all(filesToUpload.map(async (f) => {
        const [compressed, gpsData] = await Promise.all([compressImage(f), extractGps(f)]);
        return { compressed, gps: gpsData };
      }));

      const results = await Promise.all(prepared.map(async ({ compressed: file, gps: gpsData }) => {
        try {
          return await uploadPreparedPhoto(file, gpsData);
        } catch {
          return {
            status: "pending" as const,
            url: URL.createObjectURL(file),
            objectPath: "",
            gps: gpsData,
            file,
          };
        }
      }));

      setPhotos(prev => [...prev, ...results]);
      if (results.some((result) => result.status === "pending")) {
        toast({
          title: "照片已先保留在本機",
          description: "網路恢復後可在這個畫面點「重新上傳照片」。",
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "照片處理失敗",
        description: "請稍後再試，已填寫的文字草稿會保留。",
        variant: "destructive",
      });
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

  const retryPendingUploads = async () => {
    const pendingPhotos = photos.filter((photo) => photo.status === "pending" && photo.file);
    if (pendingPhotos.length === 0) return photos;

    setIsRetryingUploads(true);
    const nextPhotos: PhotoDraft[] = [];

    for (const photo of photos) {
      if (photo.status !== "pending" || !photo.file) {
        nextPhotos.push(photo);
        continue;
      }

      try {
        const uploaded = await uploadPreparedPhoto(photo.file, photo.gps);
        URL.revokeObjectURL(photo.url);
        nextPhotos.push(uploaded);
      } catch {
        nextPhotos.push(photo);
      }
    }

    setPhotos(nextPhotos);
    setIsRetryingUploads(false);

    const remaining = nextPhotos.filter((photo) => photo.status === "pending").length;
    toast({
      title: remaining ? "仍有照片待上傳" : "照片已上傳完成",
      description: remaining ? "網路仍不穩，照片草稿會繼續保留在本機。" : "現在可以一起儲存到日誌。",
      variant: remaining ? "destructive" : "default",
    });

    return nextPhotos;
  };

  const handleSave = async () => {
    // Only content is required - location is optional
    if (content.trim()) {
      setIsSaving(true);
      try {
        const latestPhotos = await retryPendingUploads();
        const pendingCount = latestPhotos.filter((photo) => photo.status === "pending").length;
        await onSave?.({
          location: selectedLocation || "",
          content,
          photos: latestPhotos.filter((photo) => photo.status === "uploaded").map(p => ({
            photoUrl: p.objectPath,
            latitude: p.gps?.latitude ?? null,
            longitude: p.gps?.longitude ?? null,
          })),
          mood: selectedMood,
        });
        if (pendingCount > 0) {
          toast({
            title: "文字已儲存，照片草稿仍保留",
            description: "等網路穩定後再開日誌草稿，可重新上傳照片。",
          });
          setPhotos(latestPhotos.filter((photo) => photo.status === "pending"));
          setContent("");
          setSelectedMood("");
          setSelectedLocation(defaultLocation || "");
          onOpenChange(false);
          return;
        }
        // Cleanup preview URLs
        latestPhotos.forEach(p => {
          if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
        });
        await del(draftKey);
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
  const pendingPhotoCount = photos.filter((photo) => photo.status === "pending").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="pb-4 flex-shrink-0">
          <SheetTitle className="text-title text-center">新增日誌</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pb-4">
          {(draftRestored || pendingPhotoCount > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
              <div className="flex items-start gap-2">
                {pendingPhotoCount > 0 ? <CloudOff className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {pendingPhotoCount > 0 ? `${pendingPhotoCount} 張照片待上傳` : "已載入上次未完成的草稿"}
                  </p>
                  <p className="mt-1 text-xs">
                    {pendingPhotoCount > 0
                      ? "照片先存在本機，網路穩定後可重新上傳。"
                      : "你可以接著寫，不會因為剛剛離開畫面就消失。"}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                    className={cn("w-24 h-24 object-cover rounded-lg", photo.status === "pending" && "opacity-80")}
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
                  {photo.status === "pending" && (
                    <span className="absolute bottom-1 left-1 right-1 rounded bg-black/65 px-1 py-0.5 text-center text-[10px] font-medium text-white">
                      待上傳
                    </span>
                  )}
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
            {pendingPhotoCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryPendingUploads}
                disabled={isRetryingUploads || isUploading}
                className="w-full"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isRetryingUploads && "animate-spin")} />
                {isRetryingUploads ? "重新上傳中..." : "重新上傳照片"}
              </Button>
            )}
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
        <div className="flex-shrink-0 p-4 bg-card border-t border-border">
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
