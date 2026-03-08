import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CoverImageUpload } from "./CoverImageUpload";

interface TripOverviewProps {
  title: string;
  destination: string;
  dateRange: string;
  duration: number;
  memberCount: number;
  coverImage: string;
  tripId?: string;
  editable?: boolean;
  onCoverChange?: (url: string) => void;
}

export function TripOverview({
  title,
  destination,
  dateRange,
  duration,
  memberCount,
  coverImage,
  tripId,
  editable = true,
  onCoverChange,
}: TripOverviewProps) {

  return (
    <div className="space-y-6">
      {/* Cover Image with Upload */}
      {editable ? (
        <CoverImageUpload
          currentImage={coverImage}
          onImageChange={(url) => onCoverChange?.(url)}
          tripId={tripId}
        />
      ) : (
        <div className="relative h-56 rounded-2xl overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      )}

      {/* Title Overlay for non-editable */}
      {!editable && (
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h2 className="text-2xl font-bold mb-1">{title}</h2>
          <p className="text-white/90">{destination}</p>
        </div>
      )}

      {/* Trip Info */}
      <div className="text-center -mt-2">
        <h2 className="text-title font-bold">{title}</h2>
        <p className="text-body text-muted-foreground">{destination}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">旅程日期</p>
              <p className="text-body font-medium">{dateRange}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">旅程天數</p>
              <p className="text-body font-medium">{duration} 天</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">目的地</p>
              <p className="text-body font-medium">{destination}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">團員人數</p>
              <p className="text-body font-medium">{memberCount} 人</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
