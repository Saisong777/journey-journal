import { MapPin, Clock, Book } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttractionCardProps {
  name: string;
  location: string;
  imageUrl: string;
  category: "religious" | "historical" | "natural";
  visitDuration: string;
  onClick: () => void;
}

const categoryStyles = {
  religious: "bg-primary/10 text-primary",
  historical: "bg-amber-100 text-amber-700",
  natural: "bg-emerald-100 text-emerald-700",
};

const categoryLabels = {
  religious: "宗教聖地",
  historical: "歷史遺跡",
  natural: "自然景觀",
};

export function AttractionCard({
  name,
  location,
  imageUrl,
  category,
  visitDuration,
  onClick,
}: AttractionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 active:scale-[0.98] text-left"
    >
      <div className="relative h-40">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={cn(
            "px-3 py-1 rounded-full text-caption font-medium",
            categoryStyles[category]
          )}>
            {categoryLabels[category]}
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <h3 className="text-title font-semibold">{name}</h3>
        
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span className="text-caption">{location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="text-caption">{visitDuration}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
