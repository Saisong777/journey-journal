import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Pencil, Trash2, X, Plus, Shield, Crown, Users, Star, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthToken, apiRequest, queryClient } from "@/lib/queryClient";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface UserTrip {
  tripId: string;
  title: string;
  role: string;
  roleId: string;
}

interface PlatformUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  tempPassword: string;
  tripCount: number;
  trips: UserTrip[];
  hasOwnPassword: boolean;
  createdAt: string;
  platformRole: string;
  platformPermissions: Record<string, boolean> | null;
}

interface TripOption {
  id: string;
  title: string;
}

const PLATFORM_ROLES = [
  { value: "super_admin", label: "總管理員", icon: Crown, color: "bg-red-100 text-red-700" },
  { value: "management", label: "管理團隊", icon: Shield, color: "bg-purple-100 text-purple-700" },
  { value: "guide", label: "導遊", icon: Users, color: "bg-blue-100 text-blue-700" },
  { value: "vip", label: "VIP", icon: Star, color: "bg-amber-100 text-amber-700" },
  { value: "member", label: "會員", icon: User, color: "bg-gray-100 text-gray-600" },
] as const;

const MODULE_PERMISSIONS = [
  { key: "trips", label: "行程管理" },
  { key: "members", label: "團員管理" },
  { key: "groups", label: "小組管理" },
  { key: "devotionals", label: "靈修課程" },
  { key: "invitations", label: "邀請碼管理" },
  { key: "notifications", label: "通知發送" },
] as const;

function getRoleBadge(role: string) {
  const roleConfig = PLATFORM_ROLES.find(r => r.value === role) || PLATFORM_ROLES[4];
  const Icon = roleConfig.icon;
  return (
    <Badge className={`${roleConfig.color} gap-1`} data-testid={`badge-role-${role}`}>
      <Icon className="w-3 h-3" />
      {roleConfig.label}
    </Badge>
  );
}

export default function AdminMembers() {
  const { toast } = useToast();
  const { data: adminStatus } = useIsAdmin();
  const isSuperAdmin = adminStatus?.isSuperAdmin || false;

  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPlatformRole, setEditPlatformRole] = useState("member");
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});
  const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null);
  const [addingTripForUser, setAddingTripForUser] = useState<PlatformUser | null>(null);
  const [selectedTripId, setSelectedTripId] = useState("");

  const { data: users, isLoading } = useQuery<PlatformUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/admin/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: allTrips } = useQuery<TripOption[]>({
    queryKey: ["/api/admin/trips"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/admin/trips", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, name, phone, email }: { userId: string; name: string; phone: string; email: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, { name, phone, email });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "修改成功", description: "會員資料已更新" });
    },
    onError: (error: any) => {
      toast({ title: "修改失敗", description: error?.message || "請稍後再試", variant: "destructive" });
    },
  });

  const updatePlatformRoleMutation = useMutation({
    mutationFn: async ({ userId, role, permissions }: { userId: string; role: string; permissions: Record<string, boolean> | null }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/platform-role`, { role, permissions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    },
    onError: () => {
      toast({ title: "權限更新失敗", description: "請稍後再試", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "已刪除", description: "會員帳號已永久刪除" });
      setDeletingUser(null);
    },
    onError: () => {
      toast({ title: "刪除失敗", description: "請稍後再試", variant: "destructive" });
    },
  });

  const addTripMutation = useMutation({
    mutationFn: async ({ userId, tripId }: { userId: string; tripId: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/trips`, { tripId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "已加入行程" });
      setAddingTripForUser(null);
      setSelectedTripId("");
    },
    onError: (error: any) => {
      toast({ title: "加入失敗", description: error?.message || "請稍後再試", variant: "destructive" });
    },
  });

  const removeTripMutation = useMutation({
    mutationFn: async ({ userId, tripId }: { userId: string; tripId: string }) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}/trips/${tripId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "已移除行程" });
    },
    onError: () => {
      toast({ title: "移除失敗", description: "請稍後再試", variant: "destructive" });
    },
  });

  const openEditDialog = (user: PlatformUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditPlatformRole(user.platformRole);
    setEditPermissions(user.platformPermissions || {});
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    await updateUserMutation.mutateAsync({
      userId: editingUser.id,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
    });

    if (isSuperAdmin && editPlatformRole !== editingUser.platformRole) {
      await updatePlatformRoleMutation.mutateAsync({
        userId: editingUser.id,
        role: editPlatformRole,
        permissions: editPlatformRole === "management" ? editPermissions : null,
      });
    } else if (isSuperAdmin && editPlatformRole === "management") {
      await updatePlatformRoleMutation.mutateAsync({
        userId: editingUser.id,
        role: editPlatformRole,
        permissions: editPermissions,
      });
    }

    toast({ title: "修改成功", description: "會員資料已更新" });
    setEditingUser(null);
  };

  const togglePermission = (key: string) => {
    setEditPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone?.includes(query)
    );
  }, [users, searchQuery]);

  const availableTripsForUser = useMemo(() => {
    if (!allTrips || !addingTripForUser) return [];
    const userTripIds = new Set(addingTripForUser.trips.map(t => t.tripId));
    return allTrips.filter(t => !userTripIds.has(t.id));
  }, [allTrips, addingTripForUser]);

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
        <div>
          <h2 className="text-display mb-2" data-testid="text-admin-members-title">會員管理</h2>
          <p className="text-body text-muted-foreground">
            管理平台上所有已註冊的會員帳號
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜尋會員姓名、電子郵件、電話..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-members"
            />
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            共 {filteredUsers.length} 位會員
          </div>
        </div>

        <div className="md:hidden space-y-3">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-card rounded-lg shadow-card p-4 space-y-3" data-testid={`card-user-${user.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{user.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(user)} data-testid={`button-edit-user-m-${user.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeletingUser(user)} data-testid={`button-delete-user-m-${user.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getRoleBadge(user.platformRole)}
                  {user.hasOwnPassword ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">已設定密碼</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">臨時密碼</Badge>
                  )}
                </div>
                {user.trips.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {user.trips.map(t => (
                      <Badge key={t.tripId} variant="secondary" className="text-xs">{t.title}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-card rounded-lg">
              <p className="text-muted-foreground text-sm">{searchQuery ? "找不到符合條件的會員" : "尚無註冊會員"}</p>
            </div>
          )}
        </div>

        <div className="hidden md:block bg-card rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>電話</TableHead>
                  <TableHead>權限</TableHead>
                  <TableHead>參加行程</TableHead>
                  <TableHead>帳號狀態</TableHead>
                  <TableHead>註冊日期</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{user.name || "-"}</TableCell>
                      <TableCell className="text-caption">{user.email}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.platformRole)}</TableCell>
                      <TableCell>
                        {user.trips.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.trips.map(t => (
                              <Badge key={t.tripId} variant="secondary" className="text-xs">
                                {t.title}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">無</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.hasOwnPassword ? (
                          <Badge className="bg-green-100 text-green-700">已設定密碼</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">臨時密碼</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-caption">
                        {user.createdAt
                          ? format(new Date(user.createdAt), "yyyy/MM/dd", { locale: zhTW })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeletingUser(user)}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchQuery ? "找不到符合條件的會員" : "尚無註冊會員"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>編輯會員資料</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="請輸入姓名"
                    data-testid="input-edit-user-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="請輸入 Email"
                    data-testid="input-edit-user-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>電話</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="請輸入電話"
                    data-testid="input-edit-user-phone"
                  />
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    參加行程
                  </Label>
                  {editingUser.trips.length > 0 ? (
                    <div className="space-y-2">
                      {editingUser.trips.map(trip => (
                        <div key={trip.tripId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span className="text-sm">{trip.title}</span>
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => removeTripMutation.mutate({ userId: editingUser.id, tripId: trip.tripId })}
                              disabled={removeTripMutation.isPending}
                              data-testid={`button-remove-trip-${trip.tripId}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">尚未參加任何行程</p>
                  )}
                  {isSuperAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setAddingTripForUser(editingUser);
                        setSelectedTripId("");
                      }}
                      data-testid="button-add-trip"
                    >
                      <Plus className="w-4 h-4" />
                      加入行程
                    </Button>
                  )}
                </div>

                {isSuperAdmin && (
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      平台權限
                    </Label>
                    <Select value={editPlatformRole} onValueChange={setEditPlatformRole}>
                      <SelectTrigger data-testid="select-platform-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value} data-testid={`option-role-${role.value}`}>
                            <span className="flex items-center gap-2">
                              <role.icon className="w-4 h-4" />
                              {role.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {editPlatformRole === "management" && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-md">
                        <Label className="text-sm font-medium">模組權限</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {MODULE_PERMISSIONS.map(perm => (
                            <div key={perm.key} className="flex items-center gap-2">
                              <Checkbox
                                id={`perm-${perm.key}`}
                                checked={editPermissions[perm.key] || false}
                                onCheckedChange={() => togglePermission(perm.key)}
                                data-testid={`checkbox-perm-${perm.key}`}
                              />
                              <label htmlFor={`perm-${perm.key}`} className="text-sm cursor-pointer">
                                {perm.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>取消</Button>
              <Button
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending || updatePlatformRoleMutation.isPending}
                data-testid="button-confirm-edit-user"
              >
                {(updateUserMutation.isPending || updatePlatformRoleMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                儲存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!addingTripForUser} onOpenChange={(open) => !open && setAddingTripForUser(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>加入行程</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                為 <strong>{addingTripForUser?.name || addingTripForUser?.email}</strong> 指定行程
              </p>
              {availableTripsForUser.length > 0 ? (
                <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                  <SelectTrigger data-testid="select-trip-to-add">
                    <SelectValue placeholder="選擇行程" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTripsForUser.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">沒有可用的行程（已參加所有行程）</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddingTripForUser(null)}>取消</Button>
              <Button
                onClick={() => addingTripForUser && selectedTripId && addTripMutation.mutate({ userId: addingTripForUser.id, tripId: selectedTripId })}
                disabled={!selectedTripId || addTripMutation.isPending}
                data-testid="button-confirm-add-trip"
              >
                {addTripMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                確認加入
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要刪除此會員？</AlertDialogTitle>
              <AlertDialogDescription>
                將永久刪除 <strong>{deletingUser?.name || deletingUser?.email}</strong> 的帳號，
                包含所有相關資料（個人檔案、日誌、靈修記錄等）。此操作無法復原。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingUser && deleteUserMutation.mutate(deletingUser.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-user"
              >
                {deleteUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                永久刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
