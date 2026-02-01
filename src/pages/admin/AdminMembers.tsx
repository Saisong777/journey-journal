import { useState, useMemo } from "react";
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
import { Search, Loader2, UserCog, UserMinus } from "lucide-react";

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

export default function AdminMembers() {
  const { data: profiles, isLoading: profilesLoading } = useAllProfiles();
  const { data: trips } = useAllTrips();
  const { data: groups } = useAllGroups();
  const { data: userRoles } = useAllUserRoles();
  const { assignRole, removeFromTrip } = useUserRoleMutations();
  const { updateProfileGroup } = useProfileMutations();

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

  // Get role for a user in a specific trip
  const getUserRole = (userId: string, tripId: string) => {
    return userRoles?.find((r) => r.user_id === userId && r.trip_id === tripId)?.role;
  };

  // Get groups for a specific trip
  const getGroupsForTrip = (tripId: string) => {
    return groups?.filter((g) => g.trip_id === tripId) || [];
  };

  // Filter profiles based on search and trip
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
        ?.filter((g) => g.trip_id === selectedTrip)
        .map((g) => g.id);
      result = result.filter(
        (p) =>
          (p.group_id && tripGroupIds?.includes(p.group_id)) ||
          userRoles?.some(
            (r) => r.user_id === p.user_id && r.trip_id === selectedTrip
          )
      );
    }

    return result;
  }, [profiles, searchQuery, selectedTrip, groups, userRoles]);

  const handleSaveRole = async () => {
    if (!editingMember) return;

    // Update role
    await assignRole.mutateAsync({
      user_id: editingMember.profile.user_id,
      trip_id: editingMember.tripId,
      role: editingMember.currentRole as "admin" | "leader" | "guide" | "member",
    });

    // Update group
    await updateProfileGroup.mutateAsync({
      profile_id: editingMember.profile.id,
      group_id: editingMember.currentGroupId,
    });

    setEditingMember(null);
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    await removeFromTrip.mutateAsync({
      user_id: removingMember.userId,
      trip_id: removingMember.tripId,
    });
    setRemovingMember(null);
  };

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
          <h2 className="text-display mb-2">會員管理</h2>
          <p className="text-body text-muted-foreground">
            管理會員角色、分組和旅程成員
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜尋會員姓名、電子郵件或電話..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedTrip} onValueChange={setSelectedTrip}>
            <SelectTrigger className="w-full sm:w-48">
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

        {/* Members Table */}
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>會員</TableHead>
                <TableHead>聯絡方式</TableHead>
                <TableHead>小組</TableHead>
                <TableHead>角色</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => {
                  const tripId = selectedTrip !== "all" ? selectedTrip : trips?.[0]?.id;
                  const role = tripId ? getUserRole(profile.user_id, tripId) : null;

                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-body text-muted-foreground">
                                {profile.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">{profile.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-caption">
                          <p>{profile.email || "-"}</p>
                          <p className="text-muted-foreground">
                            {profile.phone || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.group?.name || (
                          <span className="text-muted-foreground">未分組</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {role ? (
                          <Badge className={roleColors[role]}>
                            {roleLabels[role]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {tripId && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setEditingMember({
                                    profile,
                                    tripId,
                                    currentRole: role || "member",
                                    currentGroupId: profile.group_id,
                                  })
                                }
                              >
                                <UserCog className="w-4 h-4" />
                              </Button>
                              {role && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setRemovingMember({
                                      userId: profile.user_id,
                                      tripId,
                                      name: profile.name,
                                    })
                                  }
                                >
                                  <UserMinus className="w-4 h-4 text-destructive" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">沒有找到符合條件的會員</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

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
