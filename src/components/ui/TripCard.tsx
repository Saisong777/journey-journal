import { Calendar, Users, MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripCardProps {
  title: string;
  destination: string;
  dateRange: string;
  memberCount: number;
  imageUrl?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function TripCard({
  title,
  destination,
  dateRange,
  memberCount,
  imageUrl,
  isActive = false,
  onClick,
}: TripCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-card rounded-lg overflow-hidden shadow-card transition-all duration-300",
        "hover:shadow-elevated active:scale-[0.99]",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isActive && "ring-2 ring-primary"
      )}
    >
      {/* Image Header */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-olive/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-primary/30" strokeWidth={1} />
          </div>
        )}
        {isActive && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-caption font-medium">
            進行中
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 text-left">
        <h3 className="text-title mb-2">{title}</h3>
        
        <div className="space-y-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-body">{destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-body">{dateRange}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="text-body">{memberCount} 位團員</span>
          </div>
        </div>

        <div className="flex items-center justify-end mt-4 text-primary">
          <span className="text-body font-medium">查看詳情</span>
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}
