import { useState, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Users, Upload, Send, FileText, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthToken, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TripFormData {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

interface TripMember {
  userId: string;
  name: string;
  email: string;
  tempPassword: string;
  role: string;
  phone: string;
  groupId: string | null;
}

interface ImportResult {
  name: string;
  email: string;
  tempPassword: string;
  userId: string;
  status: string;
}

const roleLabels: Record<string, string> = {
  admin: "管理員",
  leader: "組長",
  guide: "領隊",
  member: "團員",
};

const roleColors: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  leader: "bg-secondary text-secondary-foreground",
  guide: "bg-terracotta text-white",
  member: "bg-muted text-muted-foreground",
};

function parseCSV(text: string): { name: string; email: string }[] {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return [];
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("name") || firstLine.includes("email") || firstLine.includes("姓名");
  const startIdx = hasHeader ? 1 : 0;
  const results: { name: string; email: string }[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
    if (parts.length >= 2) {
      results.push({ name: parts[0], email: parts[1] });
    }
  }
  return results;
}

function TripMemberSection({ tripId }: { tripId: string }) {
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [csvPreview, setCsvPreview] = useState<{ name: string; email: string }[] | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tripMembers, isLoading: membersLoading } = useQuery<TripMember[]>({
    queryKey: ["/api/admin/trips", tripId, "members"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/trips/${tripId}/members`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: tripInvitations } = useQuery({
    queryKey: ["/api/admin/trips", tripId, "invitations"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/trips/${tripId}/invitations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const importMutation = useMutation({
    mutationFn: async (members: { name: string; email: string }[]) => {
      const res = await apiRequest("POST", `/api/admin/trips/${tripId}/import-members`, { members });
      return res.json();
    },
    onSuccess: (data) => {
      setImportResults(data.results);
      setCsvPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trips", tripId, "members"] });
      toast({ title: "匯入完成", description: `成功匯入 ${data.total} 位團員` });
    },
    onError: () => {
      toast({ title: "匯入失敗", description: "請稍後再試", variant: "destructive" });
    },
  });

  const notifyMutation = useMutation({
    mutationFn: async ({ userIds, code }: { userIds: string[]; code: string }) => {
      const res = await apiRequest("POST", `/api/admin/trips/${tripId}/send-notifications`, {
        userIds,
        invitationCode: code,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const sentCount = data.results.filter((r: any) => r.status === "sent").length;
      toast({ title: "通知已發送", description: `成功寄送 ${sentCount} 封行前通知` });
      setShowNotifyDialog(false);
      setSelectedMembers(new Set());
    },
    onError: () => {
      toast({ title: "發送失敗", description: "請稍後再試", variant: "destructive" });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (member: { name: string; email: string }) => {
      const res = await apiRequest("POST", `/api/admin/trips/${tripId}/import-members`, { members: [member] });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trips", tripId, "members"] });
      const result = data.results?.[0];
      if (result?.status === "created") {
        toast({ title: "新增成功", description: `已新增團員：${result.name}（臨時密碼：${result.tempPassword}）` });
      } else if (result?.status === "already_exists") {
        toast({ title: "團員已存在", description: `${result.name} 已在此行程中` });
      } else {
        toast({ title: "新增完成", description: `已處理團員：${result?.name}` });
      }
      setShowAddDialog(false);
      setAddName("");
      setAddEmail("");
    },
    onError: () => {
      toast({ title: "新增失敗", description: "請稍後再試", variant: "destructive" });
    },
  });

  const handleAddMember = () => {
    const name = addName.trim();
    const email = addEmail.trim().toLowerCase();
    if (!name || !email) {
      toast({ title: "請填寫完整資料", description: "姓名與 Email 皆為必填", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Email 格式錯誤", description: "請輸入有效的電子郵件地址", variant: "destructive" });
      return;
    }
    addMemberMutation.mutate({ name, email });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast({ title: "無法解析", description: "CSV 檔案中沒有有效的團員資料", variant: "destructive" });
        return;
      }
      setCsvPreview(parsed);
      setImportResults(null);
      setShowImportDialog(true);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllMembers = () => {
    if (!tripMembers) return;
    if (selectedMembers.size === tripMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(tripMembers.map(m => m.userId)));
    }
  };

  const activeInvitations = (tripInvitations as any[])?.filter((inv: any) => inv.isActive) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFileUpload}
          data-testid={`input-csv-upload-${tripId}`}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          data-testid={`button-add-member-${tripId}`}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          新增團員
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          data-testid={`button-import-csv-${tripId}`}
        >
          <Upload className="w-4 h-4 mr-2" />
          匯入團員 (CSV)
        </Button>
        <Button
          size="sm"
          disabled={selectedMembers.size === 0}
          onClick={() => setShowNotifyDialog(true)}
          data-testid={`button-send-notifications-${tripId}`}
        >
          <Send className="w-4 h-4 mr-2" />
          寄送行前通知 ({selectedMembers.size})
        </Button>
      </div>

      {membersLoading ? (
        <div className="text-center py-4">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
        </div>
      ) : tripMembers && tripMembers.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={tripMembers.length > 0 && selectedMembers.size === tripMembers.length}
                    onCheckedChange={toggleAllMembers}
                  />
                </TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>臨時密碼</TableHead>
                <TableHead>角色</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tripMembers.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.has(member.userId)}
                      onCheckedChange={() => toggleMember(member.userId)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{member.name || "-"}</TableCell>
                  <TableCell className="text-caption">{member.email}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{member.tempPassword || "-"}</code>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[member.role] || roleColors.member}>
                      {roleLabels[member.role] || member.role}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          尚無團員，請使用「匯入團員」功能新增
        </p>
      )}

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <FileText className="w-5 h-5 inline mr-2" />
              匯入團員預覽
            </DialogTitle>
          </DialogHeader>
          {csvPreview && !importResults && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">即將匯入 {csvPreview.length} 位團員：</p>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell>{m.name}</TableCell>
                        <TableCell className="text-caption">{m.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowImportDialog(false); setCsvPreview(null); }}>取消</Button>
                <Button onClick={() => importMutation.mutate(csvPreview)} disabled={importMutation.isPending}>
                  {importMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  確認匯入
                </Button>
              </DialogFooter>
            </div>
          )}
          {importResults && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">匯入結果：</p>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>臨時密碼</TableHead>
                      <TableHead>狀態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResults.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-caption">{r.email}</TableCell>
                        <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{r.tempPassword}</code></TableCell>
                        <TableCell>
                          {r.status === "created" ? (
                            <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 已建立</span>
                          ) : r.status === "already_exists" ? (
                            <span className="text-amber-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 已存在</span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4" /> 失敗</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowImportDialog(false); setImportResults(null); }}>完成</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Send className="w-5 h-5 inline mr-2" />
              寄送行前通知
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              即將發送行前通知給 {selectedMembers.size} 位團員。信件將包含行程登入碼、臨時密碼和 QR Code。
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">選擇行程登入碼</label>
              {activeInvitations.length > 0 ? (
                <Select value={invitationCode} onValueChange={setInvitationCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇登入碼" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeInvitations.map((inv: any) => (
                      <SelectItem key={inv.id} value={inv.code}>
                        {inv.code} {inv.description ? `- ${inv.description}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-destructive">尚未建立行程登入碼，請先至「邀請碼管理」建立。</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>取消</Button>
            <Button
              onClick={() => {
                if (!invitationCode) {
                  toast({ title: "請選擇登入碼", variant: "destructive" });
                  return;
                }
                notifyMutation.mutate({ userIds: Array.from(selectedMembers), code: invitationCode });
              }}
              disabled={notifyMutation.isPending || !invitationCode}
            >
              {notifyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              確認發送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <UserPlus className="w-5 h-5 inline mr-2" />
              新增團員
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名</label>
              <Input
                data-testid={`input-add-member-name-${tripId}`}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="請輸入團員姓名"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                data-testid={`input-add-member-email-${tripId}`}
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="請輸入團員 Email"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              系統將自動產生 4 碼臨時密碼。新增後可選取該團員並寄送行前通知 Email。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending}
              data-testid={`button-confirm-add-member-${tripId}`}
            >
              {addMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              確認新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
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

  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);

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
    await createGroup.mutateAsync({ name: newGroupName, tripId });
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
              建立、編輯旅程，管理小組與團員
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例：2025 聖地朝聖之旅"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">目的地</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">結束日期</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                <Button onClick={handleCreate} disabled={createTrip.isPending || !formData.title}>
                  {createTrip.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                          {format(new Date(trip.startDate), "yyyy/MM/dd", { locale: zhTW })} -{" "}
                          {format(new Date(trip.endDate), "MM/dd", { locale: zhTW })}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-6">
                      {/* Trip Actions */}
                      <div className="flex gap-2">
                        <Dialog
                          open={editingTrip?.id === trip.id}
                          onOpenChange={(open) => !open && setEditingTrip(null)}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEdit(trip)}>
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
                                <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-destination">目的地</Label>
                                <Input id="edit-destination" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-start">開始日期</Label>
                                  <Input id="edit-start" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-end">結束日期</Label>
                                  <Input id="edit-end" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingTrip(null)}>取消</Button>
                              <Button onClick={handleUpdate} disabled={updateTrip.isPending}>
                                {updateTrip.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                            <div key={group.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              {editingGroup?.id === group.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editingGroup.name}
                                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                    className="h-8"
                                  />
                                  <Button size="sm" onClick={handleUpdateGroup} disabled={updateGroup.isPending}>儲存</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingGroup(null)}>取消</Button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-body">{group.name}</span>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingGroup({ id: group.id, name: group.name })}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>確定要刪除此小組？</AlertDialogTitle>
                                          <AlertDialogDescription>小組成員將變為未分組狀態。</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>取消</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteGroup(group.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">刪除</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="新增小組名稱..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="h-9"
                          />
                          <Button size="sm" onClick={() => handleCreateGroup(trip.id)} disabled={createGroup.isPending || !newGroupName.trim()}>
                            <Plus className="w-4 h-4 mr-1" />
                            新增
                          </Button>
                        </div>
                      </div>

                      {/* Member Management */}
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <h4 className="text-body font-medium">團員管理</h4>
                        </div>
                        <TripMemberSection tripId={trip.id} />
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
