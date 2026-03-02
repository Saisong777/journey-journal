import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
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
      toast({ title: "已新增區域注意事項" });
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
      toast({ title: "已更新區域注意事項" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/trip-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trip-notes"] });
      toast({ title: "已刪除區域注意事項" });
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
            <h2 className="text-2xl font-bold" data-testid="text-page-title">區域注意事項管理</h2>
            <p className="text-muted-foreground">每個區域一份完整注意事項，可分配至不同旅程</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} data-testid="button-create-note">
                <Plus className="w-4 h-4 mr-2" />
                新增區域
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增區域注意事項</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">區域名稱</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：土耳其、以色列、日本、美國"
                    data-testid="input-note-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">注意事項內容</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="輸入該區域的完整注意事項，包含餐食、天氣、住宿、出行、保險、出入境等各項說明..."
                    rows={20}
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
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>尚未建立任何區域注意事項</p>
            <p className="text-sm mt-1">點擊上方「新增區域」按鈕開始建立</p>
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
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-lg" data-testid={`text-note-title-${note.id}`}>
                        {note.title}
                      </h3>
                    </div>
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
                            確定要刪除「{note.title}」的注意事項嗎？此操作無法復原，已分配至旅程的關聯也會一併移除。
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
              <DialogTitle>編輯區域注意事項</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">區域名稱</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-edit-note-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">注意事項內容</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
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
