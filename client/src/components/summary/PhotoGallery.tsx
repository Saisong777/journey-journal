import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Trash2, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface Photo {
  id: string;
  url: string;
  caption: string;
  date: string;
  location: string;
  journalEntryId?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photo: Photo) => void;
}

export function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);

  // Group by date
  const dateGroups = new Map<string, Photo[]>();
  for (const p of photos) {
    const key = p.date || "未知日期";
    const group = dateGroups.get(key) || [];
    group.push(p);
    dateGroups.set(key, group);
  }
  const sortedDates = Array.from(dateGroups.keys());

  // Flat index for lightbox navigation
  const flatIndexOf = (date: string, indexInGroup: number): number => {
    let offset = 0;
    for (const d of sortedDates) {
      if (d === date) return offset + indexInGroup;
      offset += dateGroups.get(d)!.length;
    }
    return 0;
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };
  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) setSelectedIndex(selectedIndex + 1);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-title font-semibold">照片匯集</h3>
        <span className="text-caption text-muted-foreground">{photos.length} 張</span>
      </div>

      <div className="space-y-3">
        {sortedDates.map((date) => (
          <DayPhotoGroup
            key={date}
            date={date}
            photos={dateGroups.get(date)!}
            onPhotoClick={(idx) => setSelectedIndex(flatIndexOf(date, idx))}
            onDelete={onDelete ? (photo) => setDeleteTarget(photo) : undefined}
          />
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-lg p-0 bg-black border-none">
          {selectedIndex !== null && photos[selectedIndex] && (
            <div className="relative">
              <img
                src={photos[selectedIndex].url}
                alt={photos[selectedIndex].caption}
                className="w-full h-auto max-h-[70vh] object-contain"
                loading="lazy"
              />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                <Button variant="ghost" size="icon" onClick={handlePrev} disabled={selectedIndex === 0} className="text-white hover:bg-white/20 disabled:opacity-30">
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext} disabled={selectedIndex === photos.length - 1} className="text-white hover:bg-white/20 disabled:opacity-30">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white font-medium">{photos[selectedIndex].caption}</p>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <span>{photos[selectedIndex].date}</span>
                  {photos[selectedIndex].location && photos[selectedIndex].location !== "未知地點" && (
                    <>
                      <span>·</span>
                      <MapPin className="w-3 h-3" />
                      <span>{photos[selectedIndex].location}</span>
                    </>
                  )}
                </div>
              </div>
              {onDelete && (
                <Button variant="ghost" size="icon" className="absolute top-2 right-10 text-white hover:bg-white/20"
                  onClick={() => { setDeleteTarget(photos[selectedIndex]); setSelectedIndex(null); }}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </DialogClose>
              <div className="absolute top-2 left-2 bg-black/50 px-3 py-1 rounded-full">
                <span className="text-white text-sm">{selectedIndex + 1} / {photos.length}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定刪除照片？</AlertDialogTitle>
            <AlertDialogDescription>確定要刪除這張照片嗎？此操作無法復原。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { onDelete?.(deleteTarget); setDeleteTarget(null); } }}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertContent>
      </AlertDialog>
    </section>
  );
}

function DayPhotoGroup({
  date,
  photos,
  onPhotoClick,
  onDelete,
}: {
  date: string;
  photos: Photo[];
  onPhotoClick: (index: number) => void;
  onDelete?: (photo: Photo) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <span className="text-caption font-semibold">{date}（{photos.length} 張）</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-3 gap-2 pt-2">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group">
              <button onClick={() => onPhotoClick(index)} className="relative aspect-square rounded-lg overflow-hidden w-full">
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              </button>
              {onDelete && (
                <Button variant="ghost" size="icon"
                  className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onDelete(photo); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
