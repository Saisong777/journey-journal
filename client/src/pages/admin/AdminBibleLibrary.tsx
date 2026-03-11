import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Switch } from "@/components/ui/switch";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  useAllTrips,
  useBibleLibraryModules,
  useBibleLibraryModuleMutations,
  useModuleTrips,
  useModuleTripMutations,
  type BibleLibraryModuleType,
} from "@/hooks/useAdmin";
import {
  Library, Globe, Map, Loader2, Plus, Pencil, Trash2, BookOpen, Lock, FileText, Check,
} from "lucide-react";

export default function AdminBibleLibrary() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Global + trip toggles
  const { data: globalSetting, isLoading: globalLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/admin/app-settings/bible-library"],
  });
  const { data: tripsBibleList, isLoading: tripsLoading } = useQuery<{ id: string; title: string; bibleLibraryEnabled: boolean }[]>({
    queryKey: ["/api/admin/trips-bible-library"],
  });
  const { data: adminInfo } = useQuery<{ isSuperAdmin: boolean }>({
    queryKey: ["/api/is-admin"],
  });

  const toggleGlobal = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("PATCH", "/api/admin/app-settings/bible-library", { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app-settings/bible-library"] });
      toast({ title: "已更新全域設定" });
    },
  });
  const toggleTrip = useMutation({
    mutationFn: async ({ tripId, enabled }: { tripId: string; enabled: boolean }) => {
      await apiRequest("PATCH", `/api/admin/trips/${tripId}/bible-library`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trips-bible-library"] });
      toast({ title: "已更新旅程設定" });
    },
  });

  // Modules
  const { data: modules, isLoading: modulesLoading } = useBibleLibraryModules();
  const { createModule, updateModule, deleteModule } = useBibleLibraryModuleMutations();
  const { data: allTrips } = useAllTrips();

  const [showCreate, setShowCreate] = useState(false);
  const [editingModule, setEditingModule] = useState<BibleLibraryModuleType | null>(null);
  const [form, setForm] = useState({ slug: "", title: "", description: "", iconName: "BookOpen" });
  const [assigningModule, setAssigningModule] = useState<BibleLibraryModuleType | null>(null);

  const isSuperAdmin = adminInfo?.isSuperAdmin ?? false;

  const handleCreate = () => {
    createModule.mutate(form, {
      onSuccess: () => { setShowCreate(false); setForm({ slug: "", title: "", description: "", iconName: "BookOpen" }); },
    });
  };

  const handleUpdate = () => {
    if (!editingModule) return;
    updateModule.mutate({ id: editingModule.id, title: form.title, description: form.description, iconName: form.iconName }, {
      onSuccess: () => setEditingModule(null),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">聖經資料館管理</h2>
        </div>

        {/* Global toggle */}
        <section className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">全域開關</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            啟用後，管理員可為各旅程獨立開啟聖經資料館功能。
          </p>
          {globalLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-body font-medium">{globalSetting?.enabled ? "已啟用" : "已停用"}</span>
              <Switch
                checked={globalSetting?.enabled ?? false}
                onCheckedChange={(checked) => toggleGlobal.mutate(checked)}
                disabled={!isSuperAdmin || toggleGlobal.isPending}
              />
            </div>
          )}
          {!isSuperAdmin && <p className="text-xs text-muted-foreground">僅總管理員可修改全域開關</p>}
        </section>

        {/* Trip toggles */}
        <section className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">各旅程設定</h3>
          </div>
          {tripsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : tripsBibleList?.length ? (
            <div className="space-y-3">
              {tripsBibleList.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <span className="text-body font-medium">{trip.title}</span>
                  <Switch
                    checked={trip.bibleLibraryEnabled}
                    onCheckedChange={(checked) => toggleTrip.mutate({ tripId: trip.id, enabled: checked })}
                    disabled={!(globalSetting?.enabled) || toggleTrip.isPending}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">尚無旅程</p>
          )}
          {!globalSetting?.enabled && <p className="text-xs text-amber-600">請先啟用全域開關才能設定各旅程</p>}
        </section>

        {/* Modules management */}
        <section className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-medium">模組管理</h3>
            </div>
            <Button size="sm" onClick={() => { setForm({ slug: "", title: "", description: "", iconName: "BookOpen" }); setShowCreate(true); }}>
              <Plus className="w-4 h-4 mr-1" /> 新增模組
            </Button>
          </div>

          {modulesLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : modules?.length ? (
            <div className="space-y-2">
              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {mod.isBuiltin && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{mod.slug} {mod.description ? `· ${mod.description}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setAssigningModule(mod)}>
                      <Map className="w-3.5 h-3.5 mr-1" /> 行程
                    </Button>
                    {!mod.isBuiltin && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/bible-library/modules/${mod.id}`)}>
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setForm({ slug: mod.slug, title: mod.title, description: mod.description || "", iconName: mod.iconName || "BookOpen" }); setEditingModule(mod); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確認刪除</AlertDialogTitle>
                              <AlertDialogDescription>確定要刪除「{mod.title}」？此操作無法復原。</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteModule.mutate(mod.id)}>刪除</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">尚無模組</p>
          )}
        </section>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增模組</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>名稱</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例：十二使徒" className="mt-1" />
            </div>
            <div>
              <Label>代碼 (slug)</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="例：twelve-apostles" className="mt-1" />
            </div>
            <div>
              <Label>說明</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.slug || createModule.isPending}>
              {createModule.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} 建立
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingModule} onOpenChange={(o) => { if (!o) setEditingModule(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>編輯模組</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>名稱</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>說明</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>取消</Button>
            <Button onClick={handleUpdate} disabled={updateModule.isPending}>
              {updateModule.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} 儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip assignment dialog */}
      {assigningModule && (
        <ModuleTripAssignDialog
          module={assigningModule}
          trips={allTrips || []}
          onClose={() => setAssigningModule(null)}
        />
      )}
    </AdminLayout>
  );
}

function ModuleTripAssignDialog({ module, trips, onClose }: {
  module: BibleLibraryModuleType;
  trips: { id: string; title: string }[];
  onClose: () => void;
}) {
  const { data: assignments } = useModuleTrips(module.id);
  const { assignTrip, unassignTrip } = useModuleTripMutations(module.id);
  const assignedTripIds = new Set(assignments?.map(a => a.tripId) || []);

  const handleToggle = (tripId: string, assigned: boolean) => {
    if (assigned) {
      unassignTrip.mutate(tripId);
    } else {
      assignTrip.mutate(tripId);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>指派「{module.title}」到行程</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2">
          {trips.map((trip) => {
            const assigned = assignedTripIds.has(trip.id);
            return (
              <button
                key={trip.id}
                onClick={() => handleToggle(trip.id, assigned)}
                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <span className="text-sm font-medium">{trip.title}</span>
                {assigned && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
          {trips.length === 0 && <p className="text-sm text-muted-foreground">尚無行程</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
