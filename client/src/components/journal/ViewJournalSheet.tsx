import { useState, useEffect } from "react";
import { MapPin, Clock, Trash2, Loader2, Pencil, Save, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  onUpdate?: (id: string, data: { content: string; location: string }) => Promise<void>;
}

const moodLabels: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: "😊", label: "開心" },
  peaceful: { emoji: "🙏", label: "平靜" },
  grateful: { emoji: "💛", label: "感恩" },
  amazed: { emoji: "✨", label: "驚嘆" },
};

export function ViewJournalSheet({ entry, open, onOpenChange, onDelete, onUpdate }: ViewJournalSheetProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    if (entry) {
      setEditContent(entry.content);
      setEditLocation(entry.location || "");
    }
  }, [entry]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

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

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(entry.id, { content: editContent, location: editLocation });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(entry.content);
    setEditLocation(entry.location || "");
    setIsEditing(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-title">
                {isEditing ? "編輯日誌" : "日誌詳情"}
              </SheetTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-journal"
                >
                  <Pencil className="w-5 h-5" />
                </Button>
              )}
            </div>
            <SheetDescription className="sr-only">查看或編輯日誌內容</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-180px)] pb-4">
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
            {isEditing ? (
              <div className="space-y-3">
                <label className="text-body font-medium flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  景點 <span className="text-muted-foreground text-caption">(選填)</span>
                </label>
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="輸入景點名稱"
                  data-testid="input-edit-location"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                {entry.location && (
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-5 h-5" />
                    <span className="text-body font-medium">{entry.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                  <Clock className="w-4 h-4" />
                  <span className="text-caption">{entry.time}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-body font-medium">感言內容</h3>
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="寫下你的感言..."
                  className="min-h-[150px] text-body resize-none"
                  data-testid="input-edit-content"
                />
              ) : (
                <p className="text-body text-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </p>
              )}
            </div>

            {/* Mood */}
            {!isEditing && entry.mood && moodLabels[entry.mood] && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-3">
                <span className="text-2xl">{moodLabels[entry.mood].emoji}</span>
                <span className="text-body">心情：{moodLabels[entry.mood].label}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
            {isEditing ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 h-12"
                  data-testid="button-cancel-edit"
                >
                  <X className="w-5 h-5 mr-2" />
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !editContent.trim()}
                  className="flex-1 h-12 gradient-warm text-primary-foreground"
                  data-testid="button-save-edit"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      儲存修改
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 h-12"
                  data-testid="button-start-edit"
                >
                  <Pencil className="w-5 h-5 mr-2" />
                  編輯
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="flex-1 h-12"
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
                      刪除
                    </>
                  )}
                </Button>
              </div>
            )}
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
