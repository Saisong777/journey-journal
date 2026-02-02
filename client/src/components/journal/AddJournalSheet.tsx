import { useState } from "react";
import { X, Camera, Image, MapPin, Smile } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

const locations = [
  "橄欖山",
  "聖墓教堂",
  "哭牆",
  "客西馬尼園",
  "苦路",
  "加利利海",
  "其他景點",
];

const moods = [
  { key: "happy", emoji: "😊", label: "開心" },
  { key: "peaceful", emoji: "🙏", label: "平靜" },
  { key: "grateful", emoji: "💛", label: "感恩" },
  { key: "amazed", emoji: "✨", label: "驚嘆" },
];

export function AddJournalSheet({ open, onOpenChange, onSave }: AddJournalSheetProps) {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const handleAddPhoto = () => {
    // 模擬添加照片 - 實際應用中會連接相機或相簿
    const demoPhotos = [
      "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400",
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400",
    ];
    const randomPhoto = demoPhotos[Math.floor(Math.random() * demoPhotos.length)];
    setPhotos([...photos, randomPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (selectedLocation && content) {
      onSave?.({
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
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
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
                    src={photo}
                    alt={`照片 ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddPhoto}
                className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Image className="w-6 h-6" />
                <span className="text-caption">添加照片</span>
              </button>
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
            disabled={!isValid}
            className="w-full h-14 text-body-lg gradient-warm text-primary-foreground rounded-xl"
          >
            儲存日誌
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
