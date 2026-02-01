import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapPlaceholderProps {
  memberCount: number;
  currentLocation?: string;
}

export function MapPlaceholder({ memberCount, currentLocation = "耶路撒冷舊城區" }: MapPlaceholderProps) {
  return (
    <div className="relative w-full h-64 bg-gradient-to-br from-olive-light to-sand rounded-lg overflow-hidden shadow-card">
      {/* Simulated Map Background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Road lines */}
          <path d="M0,100 Q100,80 200,100 T400,100" stroke="hsl(var(--stone))" strokeWidth="3" fill="none" />
          <path d="M200,0 Q180,100 200,200" stroke="hsl(var(--stone))" strokeWidth="2" fill="none" />
          <path d="M50,0 L150,200" stroke="hsl(var(--stone))" strokeWidth="1.5" fill="none" />
          <path d="M350,0 L250,200" stroke="hsl(var(--stone))" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Member dots */}
      <div className="absolute inset-0">
        {[
          { x: "20%", y: "30%", color: "bg-primary" },
          { x: "35%", y: "45%", color: "bg-secondary" },
          { x: "50%", y: "40%", color: "bg-primary" },
          { x: "65%", y: "55%", color: "bg-terracotta" },
          { x: "45%", y: "60%", color: "bg-primary" },
          { x: "75%", y: "35%", color: "bg-secondary" },
          { x: "30%", y: "70%", color: "bg-primary" },
        ].map((dot, index) => (
          <div
            key={index}
            className={cn(
              "absolute w-4 h-4 rounded-full shadow-lg animate-pulse",
              dot.color
            )}
            style={{ left: dot.x, top: dot.y }}
          >
            <div className={cn("absolute inset-0 rounded-full animate-ping opacity-40", dot.color)} />
          </div>
        ))}

        {/* Current user marker */}
        <div
          className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2"
          style={{ left: "50%", top: "50%" }}
        >
          <div className="w-full h-full rounded-full gradient-warm shadow-elevated flex items-center justify-center">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <div className="absolute inset-0 rounded-full gradient-warm animate-ping opacity-30" />
        </div>
      </div>

      {/* Location Info Overlay */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-body font-medium">{currentLocation}</span>
            </div>
            <span className="text-caption text-muted-foreground">
              {memberCount} 位團員在附近
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-lg p-2 shadow-soft">
        <div className="flex items-center gap-3 text-caption">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>第一組</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <span>第二組</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-terracotta" />
            <span>第三組</span>
          </div>
        </div>
      </div>
    </div>
  );
}
