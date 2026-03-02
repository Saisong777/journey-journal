import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Loader2, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthToken, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface PlatformUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  tempPassword: string;
  tripCount: number;
  hasOwnPassword: boolean;
  createdAt: string;
}

export default function AdminMembers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null);

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

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, name, phone }: { userId: string; name: string; phone: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, { name, phone });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "修改成功", description: "會員資料已更新" });
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: "修改失敗", description: "請稍後再試", variant: "destructive" });
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

  const openEditDialog = (user: PlatformUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPhone(user.phone);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      userId: editingUser.id,
      name: editName.trim(),
      phone: editPhone.trim(),
    });
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
              placeholder="搜尋會員姓名、電子郵件..."
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

        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>電話</TableHead>
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
                    <TableCell>
                      {user.tripCount > 0 ? (
                        <Badge variant="secondary">{user.tripCount} 個行程</Badge>
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
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery ? "找不到符合條件的會員" : "尚無註冊會員"}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯會員資料</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">姓名</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="請輸入姓名"
                    data-testid="input-edit-user-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">電話</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="請輸入電話"
                    data-testid="input-edit-user-phone"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>取消</Button>
              <Button
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending}
                data-testid="button-confirm-edit-user"
              >
                {updateUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                儲存
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
