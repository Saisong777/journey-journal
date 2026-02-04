import { useState } from "react";
import { MapPin, Clock, Trash2, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JournalEntryData } from "./JournalEntry";

interface ViewJournalSheetProps {
  entry: JournalEntryData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => Promise<void>;
}

const moodLabels: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "開心" },
  peaceful: { emoji: "🙏", label: "平靜" },
  grateful: { emoji: "💛", label: "感恩" },
  amazed: { emoji: "✨", label: "驚嘆" },
};

export function ViewJournalSheet({ entry, open, onOpenChange, onDelete }: ViewJournalSheetProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!entry) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-title text-center">日誌詳情</SheetTitle>
            <SheetDescription className="sr-only">查看日誌詳細內容</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-160px)] pb-4">
            {/* Photos */}
            {entry.photos.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {entry.photos.map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={photo}
                        alt={`照片 ${index + 1}`}
                        className="w-full h-full object-cover"
                        data-testid={`img-view-photo-${index}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Time */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              {entry.location && (
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="w-5 h-5" />
                  <span className="text-body font-medium">{entry.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-caption">{entry.time}</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-body font-medium">感言內容</h3>
              <p className="text-body text-foreground leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>

            {/* Mood */}
            {entry.mood && moodLabels[entry.mood] && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-3">
                <span className="text-2xl">{moodLabels[entry.mood].emoji}</span>
                <span className="text-body">心情：{moodLabels[entry.mood].label}</span>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="w-full h-12"
              data-testid="button-delete-journal"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  刪除中...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  刪除日誌
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這則日誌嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原，日誌及相關照片將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
