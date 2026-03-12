import { useState } from "react";
import { MapPin, Trash2, Pencil, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { transformPhotoUrl } from "@/lib/photoUtils";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { JournalEntryDB } from "@/hooks/useJournalEntries";

interface JournalWithPhotosProps {
  journals: JournalEntryDB[];
  onEdit?: (journal: JournalEntryDB) => void;
  onDelete?: (journal: JournalEntryDB) => void;
}

interface FlatPhoto {
  url: string;
  caption: string | null;
  journalTitle: string;
}

export function JournalWithPhotos({ journals, onEdit, onDelete }: JournalWithPhotosProps) {
  const [deleteTarget, setDeleteTarget] = useState<JournalEntryDB | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<FlatPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (photos: FlatPhoto[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  if (journals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>尚無日誌</p>
        <p className="text-sm">開始記錄旅途中的精彩時刻吧！</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {journals.filter(j => j.entryDate).map((journal) => {
        const formattedDate = format(parseISO(journal.entryDate), "M月d日（EEEE）", { locale: zhTW });
        const photos: FlatPhoto[] = (journal.photos || []).map(p => ({
          url: transformPhotoUrl(p.photoUrl),
          caption: p.caption,
          journalTitle: journal.title,
        }));

        return (
          <Card key={journal.id} className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">{formattedDate}</p>
                  <h4 className="text-body font-semibold">{journal.title}</h4>
                  {journal.location && (
                    <div className="flex items-center gap-1 text-caption text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{journal.location}</span>
                    </div>
                  )}
                </div>
                {(onEdit || onDelete) && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(journal)}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget(journal)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              {journal.content && (
                <p className="text-caption text-muted-foreground leading-relaxed">{journal.content}</p>
              )}

              {/* Photo thumbnails */}
              {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(photos, idx)}
                      className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-lg p-0 bg-black border-none">
          {lightboxIndex !== null && lightboxPhotos[lightboxIndex] && (
            <div className="relative">
              <img
                src={lightboxPhotos[lightboxIndex].url}
                alt={lightboxPhotos[lightboxIndex].caption || ""}
                className="w-full h-auto max-h-[70vh] object-contain"
                loading="lazy"
              />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                  disabled={lightboxIndex === 0}
                  className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLightboxIndex(Math.min(lightboxPhotos.length - 1, lightboxIndex + 1))}
                  disabled={lightboxIndex === lightboxPhotos.length - 1}
                  className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
              {lightboxPhotos[lightboxIndex].caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white text-sm">{lightboxPhotos[lightboxIndex].caption}</p>
                </div>
              )}
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </DialogClose>
              <div className="absolute top-2 left-2 bg-black/50 px-3 py-1 rounded-full">
                <span className="text-white text-sm">{lightboxIndex + 1} / {lightboxPhotos.length}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定刪除？</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{deleteTarget?.title}」嗎？此操作無法復原。
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
