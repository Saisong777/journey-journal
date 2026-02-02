import { Phone, MessageCircle, Mail, MapPin, Home, User, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MemberData } from "./MemberCard";
import { cn } from "@/lib/utils";

interface MemberDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberData | null;
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

export function MemberDetailSheet({ open, onOpenChange, member }: MemberDetailSheetProps) {
  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-6">
          <div className="flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden shadow-card">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-display text-muted-foreground">
                  {member.name.charAt(0)}
                </span>
              )}
            </div>
            
            <div className="text-center">
              <SheetTitle className="text-title mb-2">{member.name}</SheetTitle>
              <div className="flex items-center justify-center gap-2">
                <span className={cn(
                  "text-caption px-3 py-1 rounded-full",
                  roleColors[member.role]
                )}>
                  {roleLabels[member.role]}
                </span>
                <span className="text-caption text-muted-foreground">
                  {member.group}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-200px)]">
          {/* Contact Actions */}
          <div className="grid grid-cols-3 gap-3">
            <a
              href={`tel:${member.phone}`}
              className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg shadow-soft hover:shadow-card transition-all"
            >
              <div className="w-12 h-12 rounded-full gradient-warm flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-caption font-medium">撥打電話</span>
            </a>
            
            <a
              href={`sms:${member.phone}`}
              className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg shadow-soft hover:shadow-card transition-all"
            >
              <div className="w-12 h-12 rounded-full gradient-olive flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-secondary-foreground" />
              </div>
              <span className="text-caption font-medium">發送訊息</span>
            </a>
            
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="flex flex-col items-center gap-2 p-4 bg-card rounded-lg shadow-soft hover:shadow-card transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-stone flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="text-caption font-medium">發送郵件</span>
              </a>
            )}
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            {/* Phone */}
            <div className="bg-card rounded-lg shadow-soft p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-caption text-muted-foreground">電話號碼</p>
                <p className="text-body font-medium">{member.phone}</p>
              </div>
            </div>

            {/* Email */}
            {member.email && (
              <div className="bg-card rounded-lg shadow-soft p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-caption text-muted-foreground">電子郵件</p>
                  <p className="text-body font-medium">{member.email}</p>
                </div>
              </div>
            )}

            {/* Room Number */}
            {member.roomNumber && (
              <div className="bg-card rounded-lg shadow-soft p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-caption text-muted-foreground">房間號碼</p>
                  <p className="text-body font-medium">{member.roomNumber}</p>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {member.emergencyContact && (
              <div className="bg-card rounded-lg shadow-soft p-4 flex items-center gap-4 border-l-4 border-l-terracotta">
                <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-terracotta" />
                </div>
                <div className="flex-1">
                  <p className="text-caption text-muted-foreground">緊急聯絡人</p>
                  <p className="text-body font-medium">{member.emergencyContact}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {member.notes && (
              <div className="bg-olive-light/50 rounded-lg p-4">
                <p className="text-caption font-medium text-secondary mb-1">備註</p>
                <p className="text-body text-muted-foreground">{member.notes}</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
