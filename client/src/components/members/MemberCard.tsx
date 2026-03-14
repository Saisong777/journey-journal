import { Phone, MessageCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MemberData {
  id: string;
  name: string;
  avatar?: string;
  role: "leader" | "member" | "guide";
  group: string;
  phone: string;
  email?: string;
  birthday?: string;
  roomNumber?: string;
  emergencyContact?: string;
  notes?: string;
}

interface MemberCardProps {
  member: MemberData;
  onClick?: () => void;
}

const roleLabels = {
  leader: "組長",
  member: "團員",
  guide: "領隊",
};

const roleColors = {
  leader: "bg-primary text-primary-foreground",
  member: "bg-muted text-muted-foreground",
  guide: "bg-secondary text-secondary-foreground",
};

export function MemberCard({ member, onClick }: MemberCardProps) {
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${member.phone}`;
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `sms:${member.phone}`;
  };

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
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-body font-semibold truncate">{member.name}</h3>
          <span className={cn(
            "text-caption px-2 py-0.5 rounded-full",
            roleColors[member.role]
          )}>
            {roleLabels[member.role]}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-caption text-muted-foreground">
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[11px]">{member.group}</span>
          {member.roomNumber && (
            <>
              <span>·</span>
              <span>房號 {member.roomNumber}</span>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <div 
          onClick={handleCall}
          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        >
          <Phone className="w-4 h-4 text-primary" />
        </div>
        <div 
          onClick={handleMessage}
          className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center hover:bg-secondary/20 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-secondary" />
        </div>
      </div>
    </button>
  );
}
