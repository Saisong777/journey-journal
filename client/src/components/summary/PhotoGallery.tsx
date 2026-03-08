import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

interface Photo {
  id: string;
  url: string;
  caption: string;
  date: string;
  location: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
        {photos.slice(0, 9).map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square rounded-lg overflow-hidden group"
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
                <p className="text-white/70 text-sm">
                  {photos[selectedIndex].date} · {photos[selectedIndex].location}
                </p>
              </div>

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
    </section>
  );
}
