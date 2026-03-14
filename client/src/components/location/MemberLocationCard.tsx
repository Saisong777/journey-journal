import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MemberLocationData {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  lastUpdate: string;
  distance?: string;
  status: "online" | "offline" | "moving";
  group?: string;
  groupId?: string;
  latitude?: number;
  longitude?: number;
}

interface MemberLocationCardProps {
  member: MemberLocationData;
  onClick?: () => void;
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-stone",
  moving: "bg-terracotta",
};

const statusLabels = {
  online: "在線",
  offline: "離線",
  moving: "移動中",
};

export function MemberLocationCard({ member, onClick }: MemberLocationCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-card rounded-lg shadow-card p-4",
        "flex items-center gap-4 text-left",
        "transition-all hover:shadow-elevated active:brightness-95",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-title text-muted-foreground">
              {member.name.charAt(0)}
            </span>
          )}
        </div>
        <div
          className={cn(
            "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card",
            statusColors[member.status]
          )}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-body font-semibold truncate">{member.name}</h3>
          {member.group && (
            <span className="text-caption bg-olive-light text-secondary px-2 py-0.5 rounded-full">
              {member.group}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground text-caption mb-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{member.location}</span>
        </div>
        
        <div className="flex items-center gap-3 text-caption">
          <span className={cn(
            "flex items-center gap-1",
            member.status === "online" ? "text-green-600" : "text-muted-foreground"
          )}>
            <div className={cn("w-2 h-2 rounded-full", statusColors[member.status])} />
            {statusLabels[member.status]}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            {member.lastUpdate}
          </span>
          {member.distance && (
            <span className="text-primary font-medium">{member.distance}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
          <Phone className="w-4 h-4 text-muted-foreground" />
        </div>
        {member.latitude != null && member.longitude != null && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${member.latitude},${member.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
            data-testid={`button-google-maps-${member.id}`}
          >
            <Navigation className="w-4 h-4 text-primary" />
          </a>
        )}
      </div>
    </button>
  );
}
