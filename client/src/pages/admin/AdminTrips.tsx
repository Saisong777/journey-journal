import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useAllTrips,
  useAllGroups,
  useTripMutations,
  useGroupMutations,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface TripFormData {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export default function AdminTrips() {
  const { data: trips, isLoading } = useAllTrips();
  const { data: groups } = useAllGroups();
  const { createTrip, updateTrip, deleteTrip } = useTripMutations();
  const { createGroup, updateGroup, deleteGroup } = useGroupMutations();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<(typeof trips)[0] | null>(null);
  const [formData, setFormData] = useState<TripFormData>({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
  });

  // Group form state
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(
    null
  );

  const resetForm = () => {
    setFormData({ title: "", destination: "", startDate: "", endDate: "" });
    setEditingTrip(null);
  };

  const handleCreate = async () => {
    await createTrip.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingTrip) return;
    await updateTrip.mutateAsync({ id: editingTrip.id, ...formData });
    setEditingTrip(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteTrip.mutateAsync(id);
  };

  const openEdit = (trip: (typeof trips)[0]) => {
    setEditingTrip(trip);
    setFormData({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  };

  const handleCreateGroup = async (tripId: string) => {
    if (!newGroupName.trim()) return;
    await createGroup.mutateAsync({ name: newGroupName, tripId: tripId });
    setNewGroupName("");
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    await updateGroup.mutateAsync(editingGroup);
    setEditingGroup(null);
  };

  const handleDeleteGroup = async (id: string) => {
    await deleteGroup.mutateAsync(id);
  };

  const getGroupsForTrip = (tripId: string) => {
    return groups?.filter((g) => g.tripId === tripId) || [];
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-display mb-2">旅程管理</h2>
            <p className="text-body text-muted-foreground">
              建立、編輯和刪除旅程專案
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增旅程
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增旅程</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">旅程名稱</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="例：2025 聖地朝聖之旅"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">目的地</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    placeholder="例：以色列、約旦"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">開始日期</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">結束日期</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createTrip.isPending || !formData.title}
                >
                  {createTrip.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  建立
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Trip List */}
        <div className="space-y-4">
          {trips?.length ? (
            <Accordion type="single" collapsible className="space-y-4">
              {trips.map((trip) => (
                <AccordionItem
                  key={trip.id}
                  value={trip.id}
                  className="bg-card rounded-lg shadow-card border-0"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <div className="flex-1">
                        <h3 className="text-body font-semibold">{trip.title}</h3>
                        <p className="text-caption text-muted-foreground">
                          {trip.destination} ·{" "}
                          {format(new Date(trip.startDate), "yyyy/MM/dd", {
                            locale: zhTW,
                          })}{" "}
                          -{" "}
                          {format(new Date(trip.endDate), "MM/dd", {
                            locale: zhTW,
                          })}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-4">
                      {/* Trip Actions */}
                      <div className="flex gap-2">
                        <Dialog
                          open={editingTrip?.id === trip.id}
                          onOpenChange={(open) => !open && setEditingTrip(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(trip)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              編輯
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>編輯旅程</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-title">旅程名稱</Label>
                                <Input
                                  id="edit-title"
                                  value={formData.title}
                                  onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-destination">目的地</Label>
                                <Input
                                  id="edit-destination"
                                  value={formData.destination}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      destination: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-start">開始日期</Label>
                                  <Input
                                    id="edit-start"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        startDate: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-end">結束日期</Label>
                                  <Input
                                    id="edit-end"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        endDate: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setEditingTrip(null)}
                              >
                                取消
                              </Button>
                              <Button
                                onClick={handleUpdate}
                                disabled={updateTrip.isPending}
                              >
                                {updateTrip.isPending && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                儲存
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4 mr-2" />
                              刪除
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確定要刪除此旅程？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此操作無法復原。所有相關的小組和成員資料都將被刪除。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(trip.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                刪除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Groups Management */}
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <h4 className="text-body font-medium">小組管理</h4>
                        </div>

                        <div className="space-y-2 mb-4">
                          {getGroupsForTrip(trip.id).map((group) => (
                            <div
                              key={group.id}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              {editingGroup?.id === group.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editingGroup.name}
                                    onChange={(e) =>
                                      setEditingGroup({
                                        ...editingGroup,
                                        name: e.target.value,
                                      })
                                    }
                                    className="h-8"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={handleUpdateGroup}
                                    disabled={updateGroup.isPending}
                                  >
                                    儲存
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingGroup(null)}
                                  >
                                    取消
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-body">{group.name}</span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setEditingGroup({
                                          id: group.id,
                                          name: group.name,
                                        })
                                      }
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            確定要刪除此小組？
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            小組成員將變為未分組狀態。
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>取消</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteGroup(group.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            刪除
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add new group */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="新增小組名稱..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="h-9"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleCreateGroup(trip.id)}
                            disabled={createGroup.isPending || !newGroupName.trim()}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            新增
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="bg-card rounded-lg shadow-card p-12 text-center">
              <p className="text-body text-muted-foreground mb-4">
                目前沒有任何旅程
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                建立第一個旅程
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
