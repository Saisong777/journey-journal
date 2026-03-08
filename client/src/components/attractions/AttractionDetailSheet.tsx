import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MapPin, Clock, Book, Calendar, Info, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Attraction {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  category: "religious" | "historical" | "natural";
  visitDuration: string;
  description: string;
  history: string;
  scripture?: string;
  scriptureReference?: string;
  visitTips: string[];
  visitDate?: string;
}

interface AttractionDetailSheetProps {
  attraction: Attraction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttractionDetailSheet({
  attraction,
  open,
  onOpenChange,
}: AttractionDetailSheetProps) {
  if (!attraction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <ScrollArea className="h-full pr-4">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="text-display">{attraction.name}</SheetTitle>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-body">{attraction.location}</span>
            </div>
          </SheetHeader>

          <div className="space-y-6 pb-8">
            {/* Image */}
            <div className="rounded-xl overflow-hidden">
              <img
                src={attraction.imageUrl}
                alt={attraction.name}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-caption">建議停留</span>
                </div>
                <p className="text-body font-medium">{attraction.visitDuration}</p>
              </div>
              {attraction.visitDate && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-caption">參訪日期</span>
                  </div>
                  <p className="text-body font-medium">{attraction.visitDate}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="text-title font-semibold">景點介紹</h3>
              </div>
              <p className="text-body text-muted-foreground leading-relaxed">
                {attraction.description}
              </p>
            </section>

            <Separator />

            {/* History */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                <h3 className="text-title font-semibold">歷史背景</h3>
              </div>
              <p className="text-body text-muted-foreground leading-relaxed">
                {attraction.history}
              </p>
            </section>

            {/* Scripture */}
            {attraction.scripture && (
              <>
                <Separator />
                <section className="space-y-3">
                  <h3 className="text-title font-semibold">📖 相關經文</h3>
                  <div className="bg-primary/5 rounded-xl p-4 border-l-4 border-primary">
                    <p className="text-body italic leading-relaxed mb-2">
                      「{attraction.scripture}」
                    </p>
                    <p className="text-caption text-muted-foreground text-right">
                      — {attraction.scriptureReference}
                    </p>
                  </div>
                </section>
              </>
            )}

            <Separator />

            {/* Visit Tips */}
            <section className="space-y-3">
              <h3 className="text-title font-semibold">💡 參訪須知</h3>
              <ul className="space-y-2">
                {attraction.visitTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-body text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Action Button */}
            <Button className="w-full h-12 text-body" size="lg">
              <Navigation className="w-5 h-5 mr-2" />
              導航至此景點
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
