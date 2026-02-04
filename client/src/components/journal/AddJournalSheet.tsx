import { useState, useEffect } from "react";
import { X, Camera, Image, MapPin, Smile, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useAuth } from "@/hooks/use-auth";

interface AddJournalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (entry: {
    location: string;
    content: string;
    photos: string[];
    mood: string;
  }) => void;
}

const moods = [
  { key: "happy", emoji: "😊", label: "開心" },
  { key: "peaceful", emoji: "🙏", label: "平靜" },
  { key: "grateful", emoji: "💛", label: "感恩" },
  { key: "amazed", emoji: "✨", label: "驚嘆" },
];

export function AddJournalSheet({ open, onOpenChange, onSave }: AddJournalSheetProps) {
  const { token } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && token) {
      fetchLocations();
    }
  }, [open, token]);

  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await fetch("/api/trip-days/today/attractions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const handlePhotoUploadComplete = (result: { successful: Array<{ response?: { objectPath?: string } }> }) => {
    const newPhotoPaths = result.successful
      .map(file => file.response?.objectPath)
      .filter((path): path is string => !!path);
    setPhotos(prev => [...prev, ...newPhotoPaths]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (selectedLocation && content) {
      setIsSaving(true);
      try {
        await onSave?.({
          location: selectedLocation,
          content,
          photos,
          mood: selectedMood,
        });
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

  const isValid = selectedLocation && content.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-title text-center">新增日誌</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] pb-4">
          {/* Location Selection */}
          <div className="space-y-3">
            <label className="text-body font-medium flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              選擇景點
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
                    onClick={() => setSelectedLocation(location)}
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
              照片記錄
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={photo.startsWith("http") ? photo : `/api/uploads/public/${photo}`}
                    alt={`照片 ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
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
              <ObjectUploader
                onGetUploadParameters={async (file) => {
                  const res = await fetch("/api/uploads/request-url", {
                    method: "POST",
                    headers: { 
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      name: file.name,
                      size: file.size,
                      contentType: file.type,
                    }),
                  });
                  const { uploadURL, objectPath } = await res.json();
                  return {
                    method: "PUT" as const,
                    url: uploadURL,
                    headers: { "Content-Type": file.type },
                    body: undefined,
                    fields: { objectPath },
                  };
                }}
                onComplete={handlePhotoUploadComplete}
              >
                <div className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <Image className="w-6 h-6" />
                  <span className="text-caption">添加照片</span>
                </div>
              </ObjectUploader>
            </div>
          </div>

          {/* Journal Content */}
          <div className="space-y-3">
            <label className="text-body font-medium">寫下感言</label>
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
              此刻心情
            </label>
            <div className="flex gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.key}
                  onClick={() => setSelectedMood(mood.key)}
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
