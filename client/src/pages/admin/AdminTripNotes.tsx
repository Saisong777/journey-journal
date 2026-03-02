import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TripNote } from "@shared/schema";

export default function AdminTripNotes() {
  const { toast } = useToast();
  const [editNote, setEditNote] = useState<TripNote | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: notes = [], isLoading } = useQuery<TripNote[]>({
    queryKey: ["/api/admin/trip-notes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", "/api/admin/trip-notes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trip-notes"] });
      setCreateOpen(false);
      setTitle("");
      setContent("");
      toast({ title: "已新增說明項目" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title: string; content: string } }) => {
      const res = await apiRequest("PATCH", `/api/admin/trip-notes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trip-notes"] });
      setEditOpen(false);
      setEditNote(null);
      toast({ title: "已更新說明項目" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/trip-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trip-notes"] });
      toast({ title: "已刪除說明項目" });
    },
  });

  const openEdit = (note: TripNote) => {
    setEditNote(note);
    setTitle(note.title);
    setContent(note.content);
    setEditOpen(true);
  };

  const openCreate = () => {
    setTitle("");
    setContent("");
    setCreateOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-page-title">說明管理</h2>
            <p className="text-muted-foreground">管理出團說明與注意事項，可分配至不同旅程</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} data-testid="button-create-note">
                <Plus className="w-4 h-4 mr-2" />
                新增說明
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增說明項目</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">標題</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：關於餐食"
                    data-testid="input-note-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">內容</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="輸入說明內容..."
                    rows={12}
                    data-testid="input-note-content"
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate({ title, content })}
                  disabled={!title || !content || createMutation.isPending}
                  className="w-full"
                  data-testid="button-save-note"
                >
                  {createMutation.isPending ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">載入中...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>尚未建立任何說明項目</p>
            <p className="text-sm mt-1">點擊上方「新增說明」按鈕開始建立</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-card rounded-lg border border-border p-4"
                data-testid={`card-note-${note.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg" data-testid={`text-note-title-${note.id}`}>
                      {note.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-line">
                      {note.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(note)}
                      data-testid={`button-edit-note-${note.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-delete-note-${note.id}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認刪除</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要刪除「{note.title}」嗎？此操作無法復原，已分配至旅程的關聯也會一併移除。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(note.id)}>
                            刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>編輯說明項目</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">標題</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-edit-note-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">內容</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  data-testid="input-edit-note-content"
                />
              </div>
              <Button
                onClick={() => editNote && updateMutation.mutate({ id: editNote.id, data: { title, content } })}
                disabled={!title || !content || updateMutation.isPending}
                className="w-full"
                data-testid="button-update-note"
              >
                {updateMutation.isPending ? "更新中..." : "更新"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
