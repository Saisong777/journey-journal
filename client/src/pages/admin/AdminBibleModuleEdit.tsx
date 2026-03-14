import { useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useBibleLibraryModules,
  useBibleLibraryItems,
  useBibleLibraryItemMutations,
  type BibleLibraryItemType,
} from "@/hooks/useAdmin";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Image, FileUp, Upload } from "lucide-react";

export default function AdminBibleModuleEdit() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { data: modules } = useBibleLibraryModules();
  const module = modules?.find(m => m.id === moduleId);
  const { data: items, isLoading } = useBibleLibraryItems(moduleId || null);
  const { createItem, updateItem, deleteItem } = useBibleLibraryItemMutations(moduleId || null);
  const { uploadFile, isUploading } = useUpload();

  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BibleLibraryItemType | null>(null);
  const [form, setForm] = useState({ title: "", content: "", imageUrl: "", fileUrl: "", sortOrder: 0 });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const mdInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isDocumentLibrary = module?.moduleType === "document-library";

  const handleBatchImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !moduleId) return;

    // Build set of existing titles to skip duplicates
    const existingTitles = new Set((items || []).map(item => item.title));

    const filesToImport = Array.from(files).filter(file => {
      const title = file.name.replace(/\.(md|txt)$/i, "");
      return !existingTitles.has(title);
    });

    const skipped = files.length - filesToImport.length;

    if (filesToImport.length === 0) {
      toast({ title: `所有 ${files.length} 個檔案皆已存在，無需匯入` });
      if (mdInputRef.current) mdInputRef.current.value = "";
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: filesToImport.length });
    const token = getAuthToken();
    let imported = 0;
    const baseOrder = items?.length || 0;

    for (let i = 0; i < filesToImport.length; i++) {
      const file = filesToImport[i];
      const title = file.name.replace(/\.(md|txt)$/i, "");
      const content = await file.text();

      try {
        await fetch(`/api/admin/bible-library/modules/${moduleId}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ title, content, sortOrder: baseOrder + i }),
        });
        imported++;
      } catch {
        // skip failed
      }
      setImportProgress({ current: i + 1, total: filesToImport.length });
    }

    setImporting(false);
    queryClient.invalidateQueries({ queryKey: [`admin-bible-items-${moduleId}`] });
    const msg = skipped > 0
      ? `已匯入 ${imported} 個新檔案，跳過 ${skipped} 個已存在的檔案`
      : `已匯入 ${imported} / ${filesToImport.length} 個檔案`;
    toast({ title: msg });

    // Reset file input
    if (mdInputRef.current) mdInputRef.current.value = "";
  }, [moduleId, items, queryClient, toast]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ title: "", content: "", imageUrl: "", fileUrl: "", sortOrder: (items?.length || 0) });
    setShowDialog(true);
  };

  const openEdit = (item: BibleLibraryItemType) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content || "",
      imageUrl: item.imageUrl || "",
      fileUrl: item.fileUrl || "",
      sortOrder: item.sortOrder,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingItem) {
      updateItem.mutate({
        id: editingItem.id,
        title: form.title,
        content: form.content || null,
        imageUrl: form.imageUrl || null,
        fileUrl: form.fileUrl || null,
        sortOrder: form.sortOrder,
      }, { onSuccess: () => setShowDialog(false) });
    } else {
      createItem.mutate({
        title: form.title,
        content: form.content || undefined,
        imageUrl: form.imageUrl || undefined,
        fileUrl: form.fileUrl || undefined,
        sortOrder: form.sortOrder,
      }, { onSuccess: () => setShowDialog(false) });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file);
    if (result) {
      setForm(f => ({ ...f, imageUrl: result.objectPath }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file);
    if (result) {
      setForm(f => ({ ...f, fileUrl: result.objectPath }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/bible-library")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold">{module?.title || "模組內容"}</h2>
          </div>
          <div className="flex gap-2">
            {isDocumentLibrary && (
              <>
                <input
                  ref={mdInputRef}
                  type="file"
                  multiple
                  accept=".md,.txt"
                  className="hidden"
                  onChange={handleBatchImport}
                />
                <Button size="sm" variant="outline" onClick={() => mdInputRef.current?.click()} disabled={importing}>
                  {importing ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> {importProgress.current}/{importProgress.total}</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-1" /> 批次匯入 .md</>
                  )}
                </Button>
              </>
            )}
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> 新增項目
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : items?.length ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="bg-card border rounded-lg p-4 flex gap-3">
                {item.imageUrl && (
                  <img
                    src={transformPhotoUrl(item.imageUrl)}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.title}</p>
                  {item.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.content}</p>
                  )}
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    {item.imageUrl && <span className="inline-flex items-center gap-0.5"><Image className="w-3 h-3" /> 圖片</span>}
                    {item.fileUrl && <span className="inline-flex items-center gap-0.5"><FileUp className="w-3 h-3" /> 檔案</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>確認刪除</AlertDialogTitle>
                        <AlertDialogDescription>確定要刪除「{item.title}」？</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteItem.mutate(item.id)}>刪除</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">尚無內容，點擊「新增項目」開始</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "編輯項目" : "新增項目"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>標題</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>內容</Label>
              <Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} rows={6} className="mt-1" placeholder="支援純文字或 Markdown 格式" />
            </div>
            <div>
              <Label>圖片</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {form.imageUrl && (
                <div className="mt-2 relative">
                  <img src={transformPhotoUrl(form.imageUrl)} alt="" className="w-full max-h-40 object-cover rounded-lg" />
                  <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 text-xs" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}>移除</Button>
                </div>
              )}
            </div>
            <div>
              <Label>附件檔案 (PDF 等)</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input type="file" accept=".pdf,image/*" onChange={handleFileUpload} disabled={isUploading} />
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {form.fileUrl && <p className="text-xs text-muted-foreground mt-1">已上傳檔案</p>}
            </div>
            <div>
              <Label>排序</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="mt-1 w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleSave} disabled={!form.title || createItem.isPending || updateItem.isPending}>
              {(createItem.isPending || updateItem.isPending) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editingItem ? "儲存" : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
