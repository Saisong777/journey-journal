import { MapPin, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PhotoDetail {
  url: string;
  originalPath: string;
  latitude: number | null;
  longitude: number | null;
}

export interface JournalEntryData {
  id: string;
  location: string;
  time: string;
  content: string;
  photos: string[];
  photoDetails?: PhotoDetail[];
  originalPhotoPaths?: string[];
  mood?: "happy" | "peaceful" | "grateful" | "amazed";
}

interface JournalEntryProps {
  entry: JournalEntryData;
  onClick?: () => void;
}

const moodEmojis = {
  happy: "😊",
  peaceful: "🙏",
  grateful: "💛",
  amazed: "✨",
};

export function JournalEntry({ entry, onClick }: JournalEntryProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-card rounded-lg shadow-card overflow-hidden",
        "text-left transition-all hover:shadow-elevated active:brightness-95",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      {/* Photos Grid */}
      {entry.photos.length > 0 && (
        <div className={cn(
          "grid gap-1",
          entry.photos.length === 1 && "grid-cols-1",
          entry.photos.length === 2 && "grid-cols-2",
          entry.photos.length >= 3 && "grid-cols-3"
        )}>
          {entry.photos.slice(0, 3).map((photo, index) => (
            <div
              key={index}
              className={cn(
                "relative bg-muted",
                entry.photos.length === 1 ? "h-48" : "h-24",
                entry.photos.length >= 3 && index === 0 && "col-span-2 row-span-2 h-48"
              )}
            >
              <img
                src={photo}
                alt={`照片 ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {entry.photos.length > 3 && index === 2 && (
                <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                  <span className="text-white text-title">+{entry.photos.length - 3}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Location & Time */}
        <div className="flex items-center justify-between">
          {entry.location ? (
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="w-4 h-4" />
              <span className="text-body font-medium">{entry.location}</span>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-1 text-muted-foreground text-caption">
            <Clock className="w-3 h-3" />
            {entry.time}
          </div>
        </div>

        {/* Journal Content */}
        <p className="text-body text-foreground line-clamp-3 leading-relaxed">
          {entry.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          {entry.mood && (
            <span className="text-xl">{moodEmojis[entry.mood]}</span>
          )}
          <div className="flex items-center gap-1 text-primary text-caption font-medium ml-auto">
            查看更多
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </button>
  );
}
