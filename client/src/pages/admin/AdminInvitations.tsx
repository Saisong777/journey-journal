import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useAllTrips,
  useTripInvitations,
  useTripInvitationMutations,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2, Ticket, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvitationFormData {
  description: string;
  maxUses: number | null;
  expiresAt: string;
}

const emptyForm: InvitationFormData = {
  description: "",
  maxUses: null,
  expiresAt: "",
};

export default function AdminInvitations() {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<InvitationFormData>(emptyForm);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: trips = [], isLoading: tripsLoading } = useAllTrips();
  const { data: invitations = [], isLoading: invitationsLoading } = useTripInvitations(selectedTripId);
  const { createInvitation, updateInvitation, deleteInvitation } = useTripInvitationMutations(selectedTripId);

  const handleCreate = async () => {
    if (!selectedTripId) return;
    
    await createInvitation.mutateAsync({
      description: formData.description || null,
      maxUses: formData.maxUses,
      expiresAt: formData.expiresAt || null,
    });
    
    setIsDialogOpen(false);
    setFormData(emptyForm);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateInvitation.mutateAsync({ id, isActive: !isActive });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "已複製驗證碼" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "無限期";
    return new Date(dateStr).toLocaleDateString("zh-TW");
  };

  if (tripsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">邀請碼管理</h1>
            <p className="text-gray-500 mt-1">建立和管理旅程邀請碼</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-600" />
              選擇旅程
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTripId || ""}
              onValueChange={(value) => setSelectedTripId(value || null)}
            >
              <SelectTrigger data-testid="select-trip">
                <SelectValue placeholder="選擇旅程..." />
              </SelectTrigger>
              <SelectContent>
                {trips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedTripId && (
          <>
            <div className="flex justify-end">
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
                data-testid="button-create-invitation"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增邀請碼
              </Button>
            </div>

            {invitationsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              </div>
            ) : invitations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>尚未建立邀請碼</p>
                  <p className="text-sm mt-1">點擊上方按鈕建立第一個邀請碼</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {invitations.map((invitation) => (
                  <Card key={invitation.id} data-testid={`card-invitation-${invitation.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <code className="text-2xl font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded">
                              {invitation.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyCode(invitation.code)}
                              data-testid={`button-copy-${invitation.id}`}
                            >
                              {copiedCode === invitation.code ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Badge variant={invitation.isActive ? "default" : "secondary"}>
                              {invitation.isActive ? "啟用中" : "已停用"}
                            </Badge>
                          </div>
                          {invitation.description && (
                            <p className="text-sm text-gray-600">{invitation.description}</p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>
                              使用次數：{invitation.usedCount}
                              {invitation.maxUses ? ` / ${invitation.maxUses}` : " (無限制)"}
                            </span>
                            <span>有效期限：{formatDate(invitation.expiresAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${invitation.id}`} className="text-sm">
                              啟用
                            </Label>
                            <Switch
                              id={`active-${invitation.id}`}
                              checked={invitation.isActive}
                              onCheckedChange={() => handleToggleActive(invitation.id, invitation.isActive)}
                              data-testid={`switch-active-${invitation.id}`}
                            />
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-delete-${invitation.id}`}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>確定要刪除此邀請碼？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  刪除後無法復原，已使用此邀請碼加入的會員不受影響。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteInvitation.mutateAsync(invitation.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  刪除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增邀請碼</DialogTitle>
              <DialogDescription>
                建立新的邀請碼讓會員加入此旅程
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">說明（選填）</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="例如：第一梯次報名"
                  data-testid="input-description"
                />
              </div>
              <div>
                <Label htmlFor="maxUses">使用次數上限（選填）</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min={1}
                  value={formData.maxUses || ""}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="留空表示無限制"
                  data-testid="input-max-uses"
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">有效期限（選填）</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  data-testid="input-expires-at"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createInvitation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
                data-testid="button-save-invitation"
              >
                {createInvitation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                建立
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
