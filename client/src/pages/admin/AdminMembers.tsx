import { useState, useMemo, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useAllProfiles,
  useAllTrips,
  useAllGroups,
  useAllUserRoles,
  useUserRoleMutations,
  useProfileMutations,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, UserCog, UserMinus, Upload, Send, FileText, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthToken, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function AdminMembers() {
  const { data: profiles, isLoading: profilesLoading } = useAllProfiles();
  const { data: trips } = useAllTrips();
  const { data: groups } = useAllGroups();
  const { data: userRoles } = useAllUserRoles();
  const { assignRole, removeFromTrip } = useUserRoleMutations();
  const { updateProfileGroup } = useProfileMutations();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<string>("all");
  const [editingMember, setEditingMember] = useState<{
    profile: (typeof profiles)[0];
    tripId: string;
    currentRole: string;
    currentGroupId: string | null;
  } | null>(null);
  const [removingMember, setRemovingMember] = useState<{
    userId: string;
    tripId: string;
    name: string;
  } | null>(null);

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [csvPreview, setCsvPreview] = useState<{ name: string; email: string }[] | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTripId = selectedTrip !== "all" ? selectedTrip : trips?.[0]?.id;

  const { data: tripMembers, isLoading: membersLoading } = useQuery<TripMember[]>({
    queryKey: ["/api/admin/trips", activeTripId, "members"],
    queryFn: async () => {
      if (!activeTripId) return [];
      const token = getAuthToken();
      const response = await fetch(`/api/admin/trips/${activeTripId}/members`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!activeTripId,
  });

  const { data: tripInvitations } = useQuery({
    queryKey: ["/api/admin/trips", activeTripId, "invitations"],
    queryFn: async () => {
      if (!activeTripId) return [];
      const token = getAuthToken();
      const response = await fetch(`/api/admin/trips/${activeTripId}/invitations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!activeTripId,
  });

  const importMutation = useMutation({
    mutationFn: async (members: { name: string; email: string }[]) => {
      const res = await apiRequest("POST", `/api/admin/trips/${activeTripId}/import-members`, { members });
      return res.json();
    },
    onSuccess: (data) => {
      setImportResults(data.results);
      setCsvPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trips", activeTripId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-roles"] });
      toast({ title: "匯入完成", description: `成功匯入 ${data.total} 位團員` });
    },
    onError: () => {
      toast({ title: "匯入失敗", description: "請稍後再試", variant: "destructive" });
    },
  });

  const notifyMutation = useMutation({
    mutationFn: async ({ userIds, code }: { userIds: string[]; code: string }) => {
      const res = await apiRequest("POST", `/api/admin/trips/${activeTripId}/send-notifications`, {
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

  const getUserRole = (userId: string, tripId: string) => {
    return userRoles?.find((r) => r.userId === userId && r.tripId === tripId)?.role;
  };

  const getGroupsForTrip = (tripId: string) => {
    return groups?.filter((g) => g.tripId === tripId) || [];
  };

  const filteredProfiles = useMemo(() => {
    let result = profiles || [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.phone?.includes(query)
      );
    }

    if (selectedTrip !== "all") {
      const tripGroupIds = groups
        ?.filter((g) => g.tripId === selectedTrip)
        .map((g) => g.id);
      result = result.filter(
        (p) =>
          (p.groupId && tripGroupIds?.includes(p.groupId)) ||
          userRoles?.some(
            (r) => r.userId === p.userId && r.tripId === selectedTrip
          )
      );
    }

    return result;
  }, [profiles, searchQuery, selectedTrip, groups, userRoles]);

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

  const handleImportConfirm = () => {
    if (!csvPreview || !activeTripId) return;
    importMutation.mutate(csvPreview);
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

  const handleSaveRole = async () => {
    if (!editingMember) return;
    await assignRole.mutateAsync({
      userId: editingMember.profile.userId,
      tripId: editingMember.tripId,
      role: editingMember.currentRole as "admin" | "leader" | "guide" | "member",
    });
    await updateProfileGroup.mutateAsync({
      profileId: editingMember.profile.id,
      groupId: editingMember.currentGroupId,
    });
    setEditingMember(null);
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    await removeFromTrip.mutateAsync({
      userId: removingMember.userId,
      tripId: removingMember.tripId,
    });
    setRemovingMember(null);
  };

  const activeInvitations = (tripInvitations as any[])?.filter((inv: any) => inv.isActive) || [];

  if (profilesLoading) {
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
        <div>
          <h2 className="text-display mb-2" data-testid="text-admin-members-title">團員管理</h2>
          <p className="text-body text-muted-foreground">
            匯入團員、管理角色、分組和發送行前通知
          </p>
        </div>

        {/* Trip Selection */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜尋團員姓名、電子郵件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-members"
            />
          </div>
          <Select value={selectedTrip} onValueChange={(v) => { setSelectedTrip(v); setSelectedMembers(new Set()); }}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-trip-filter">
              <SelectValue placeholder="篩選旅程" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有旅程</SelectItem>
              {trips?.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>
                  {trip.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Import & Actions Bar */}
        {activeTripId && (
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
              data-testid="input-csv-upload"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-import-csv"
            >
              <Upload className="w-4 h-4 mr-2" />
              匯入團員 (CSV)
            </Button>
            <Button
              variant="default"
              disabled={selectedMembers.size === 0}
              onClick={() => setShowNotifyDialog(true)}
              data-testid="button-send-notifications"
            >
              <Send className="w-4 h-4 mr-2" />
              寄送行前通知 ({selectedMembers.size})
            </Button>
          </div>
        )}

        {/* Trip Members Table */}
        {activeTripId && (
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-medium text-sm">
                行程團員列表
                {tripMembers && <span className="text-muted-foreground ml-2">共 {tripMembers.length} 人</span>}
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={tripMembers && tripMembers.length > 0 && selectedMembers.size === tripMembers.length}
                      onCheckedChange={toggleAllMembers}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>臨時密碼</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : tripMembers && tripMembers.length > 0 ? (
                  tripMembers.map((member) => (
                    <TableRow key={member.userId} data-testid={`row-member-${member.userId}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMembers.has(member.userId)}
                          onCheckedChange={() => toggleMember(member.userId)}
                          data-testid={`checkbox-member-${member.userId}`}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{member.name || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-caption">{member.email}</span>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {member.tempPassword || "-"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[member.role] || roleColors.member}>
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const profile = profiles?.find(p => p.userId === member.userId);
                            if (profile) {
                              setEditingMember({
                                profile,
                                tripId: activeTripId,
                                currentRole: member.role,
                                currentGroupId: member.groupId,
                              });
                            }
                          }}
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setRemovingMember({
                              userId: member.userId,
                              tripId: activeTripId,
                              name: member.name,
                            })
                          }
                        >
                          <UserMinus className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">尚無團員，請使用「匯入團員」功能新增</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
                <p className="text-sm text-muted-foreground">
                  即將匯入 {csvPreview.length} 位團員到此行程：
                </p>
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
                  <Button variant="outline" onClick={() => { setShowImportDialog(false); setCsvPreview(null); }}>
                    取消
                  </Button>
                  <Button onClick={handleImportConfirm} disabled={importMutation.isPending}>
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
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">{r.tempPassword}</code>
                          </TableCell>
                          <TableCell>
                            {r.status === "created" ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> 已建立
                              </span>
                            ) : r.status === "already_exists" ? (
                              <span className="text-amber-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> 已存在
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> 失敗
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setShowImportDialog(false); setImportResults(null); }}>
                    完成
                  </Button>
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
                即將發送行前通知給 {selectedMembers.size} 位團員。
                信件將包含行程登入碼、臨時密碼和 QR Code。
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">選擇行程登入碼</label>
                {activeInvitations.length > 0 ? (
                  <Select value={invitationCode} onValueChange={setInvitationCode}>
                    <SelectTrigger data-testid="select-invitation-code">
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
                  <p className="text-sm text-destructive">
                    尚未建立行程登入碼，請先至「邀請碼管理」建立。
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  if (!invitationCode) {
                    toast({ title: "請選擇登入碼", variant: "destructive" });
                    return;
                  }
                  notifyMutation.mutate({
                    userIds: Array.from(selectedMembers),
                    code: invitationCode,
                  });
                }}
                disabled={notifyMutation.isPending || !invitationCode}
                data-testid="button-confirm-send"
              >
                {notifyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                確認發送
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯會員 - {editingMember?.profile.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-caption font-medium">角色</label>
                <Select
                  value={editingMember?.currentRole}
                  onValueChange={(value) =>
                    editingMember &&
                    setEditingMember({ ...editingMember, currentRole: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理員</SelectItem>
                    <SelectItem value="guide">領隊</SelectItem>
                    <SelectItem value="leader">組長</SelectItem>
                    <SelectItem value="member">團員</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-caption font-medium">小組</label>
                <Select
                  value={editingMember?.currentGroupId || "none"}
                  onValueChange={(value) =>
                    editingMember &&
                    setEditingMember({
                      ...editingMember,
                      currentGroupId: value === "none" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未分組</SelectItem>
                    {editingMember &&
                      getGroupsForTrip(editingMember.tripId).map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>
                取消
              </Button>
              <Button
                onClick={handleSaveRole}
                disabled={assignRole.isPending || updateProfileGroup.isPending}
              >
                {(assignRole.isPending || updateProfileGroup.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                儲存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirmation */}
        <AlertDialog
          open={!!removingMember}
          onOpenChange={(open) => !open && setRemovingMember(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要移除此會員？</AlertDialogTitle>
              <AlertDialogDescription>
                {removingMember?.name} 將從此旅程中移除，但會員帳號不會被刪除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                移除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
