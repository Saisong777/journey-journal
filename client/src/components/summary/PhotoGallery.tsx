import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-title font-semibold">📸 精選照片</h3>
        <span className="text-caption text-muted-foreground">{photos.length} 張</span>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative group">
            <button
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-square rounded-lg overflow-hidden w-full"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              {index === 8 && photos.length > 9 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-semibold">+{photos.length - 9}</span>
                </div>
              )}
            </button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(photo);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
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

              {/* Navigation */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={selectedIndex === 0}
                  className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={selectedIndex === photos.length - 1}
                  className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              {/* Caption */}
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

              {/* Delete button in lightbox */}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-10 text-white hover:bg-white/20"
                  onClick={() => {
                    setDeleteTarget(photos[selectedIndex]);
                    setSelectedIndex(null);
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}

              {/* Close button */}
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </DialogClose>

              {/* Counter */}
              <div className="absolute top-2 left-2 bg-black/50 px-3 py-1 rounded-full">
                <span className="text-white text-sm">
                  {selectedIndex + 1} / {photos.length}
                </span>
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
            <AlertDialogDescription>
              確定要刪除這張照片嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDelete?.(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertContent>
      </AlertDialog>
    </section>
  );
}
