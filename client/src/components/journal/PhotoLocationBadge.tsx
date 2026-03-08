import { MapPin } from "lucide-react";

interface PhotoLocationBadgeProps {
  latitude: number;
  longitude: number;
}

export function PhotoLocationBadge({ latitude, longitude }: PhotoLocationBadgeProps) {
  const display = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

  return (
    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-black/50 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-tight backdrop-blur-sm">
      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
      <span className="truncate max-w-[80px]">{display}</span>
    </div>
  );
}
