import { useState } from "react";
import { MapPin, Trash2, Pencil, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { transformPhotoUrl } from "@/lib/photoUtils";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

  // Group journals by entryDate, sorted chronologically (earliest first)
  const dateGroups = new Map<string, JournalEntryDB[]>();
  for (const j of journals.filter(j => j.entryDate)) {
    const group = dateGroups.get(j.entryDate) || [];
    group.push(j);
    dateGroups.set(j.entryDate, group);
  }
  const sortedDates = Array.from(dateGroups.keys()).sort();

  return (
    <section className="space-y-3">
      {sortedDates.map((date) => (
        <DayGroup
          key={date}
          date={date}
          journals={dateGroups.get(date)!}
          onEdit={onEdit}
          onDelete={(j) => setDeleteTarget(j)}
          openLightbox={openLightbox}
        />
      ))}

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

function DayGroup({
  date,
  journals,
  onEdit,
  onDelete,
  openLightbox,
}: {
  date: string;
  journals: JournalEntryDB[];
  onEdit?: (journal: JournalEntryDB) => void;
  onDelete?: (journal: JournalEntryDB) => void;
  openLightbox: (photos: FlatPhoto[], index: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const formattedDate = format(parseISO(date), "M月d日（EEEE）", { locale: zhTW });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <span className="text-body font-semibold">{formattedDate}（{journals.length} 篇）</span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pt-3">
          {journals.map((journal) => {
            const photos: FlatPhoto[] = (journal.photos || []).map(p => ({
              url: transformPhotoUrl(p.photoUrl),
              caption: p.caption,
              journalTitle: journal.title,
            }));

            return (
              <Card key={journal.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(journal)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {journal.content && (
                    <p className="text-caption text-muted-foreground leading-relaxed">{journal.content}</p>
                  )}

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
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
