import { useState, useRef, useCallback } from "react";
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
import { Plus, Trash2, Loader2, Ticket, Copy, Check, Download, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

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

function getInviteUrl(code: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/verify-trip?code=${code}`;
}

export default function AdminInvitations() {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<InvitationFormData>(emptyForm);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrDialogCode, setQrDialogCode] = useState<string | null>(null);
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
    toast({ title: "已複製邀請碼" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(getInviteUrl(code));
    toast({ title: "已複製邀請連結" });
  };

  const handleDownloadQR = useCallback((code: string) => {
    const svgElement = document.getElementById(`qr-${code}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
      }
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `invite-${code}.png`;
      link.href = pngUrl;
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

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
            <p className="text-gray-500 mt-1">建立和管理旅程邀請碼（4位數）</p>
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
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => setQrDialogCode(invitation.code)}
                          className="flex-shrink-0 p-1 rounded-lg border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
                          title="點擊放大 QR Code"
                          data-testid={`button-qr-${invitation.id}`}
                        >
                          <QRCodeSVG
                            id={`qr-${invitation.code}`}
                            value={getInviteUrl(invitation.code)}
                            size={80}
                            level="M"
                            marginSize={1}
                          />
                        </button>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <code className="text-2xl font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded tracking-widest">
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
                          <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                            <span>
                              使用次數：{invitation.usedCount}
                              {invitation.maxUses ? ` / ${invitation.maxUses}` : " (無限制)"}
                            </span>
                            <span>有效期限：{formatDate(invitation.expiresAt)}</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(invitation.code)}
                              data-testid={`button-copy-link-${invitation.id}`}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              複製連結
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadQR(invitation.code)}
                              data-testid={`button-download-qr-${invitation.id}`}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              下載 QR
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
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
                系統將自動產生 4 位數邀請碼
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

        <Dialog open={!!qrDialogCode} onOpenChange={() => setQrDialogCode(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">邀請碼 QR Code</DialogTitle>
              <DialogDescription className="text-center">
                掃描加入旅程
              </DialogDescription>
            </DialogHeader>
            {qrDialogCode && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <QRCodeSVG
                    id={`qr-large-${qrDialogCode}`}
                    value={getInviteUrl(qrDialogCode)}
                    size={240}
                    level="M"
                    marginSize={2}
                  />
                </div>
                <code className="text-3xl font-mono font-bold text-amber-700 tracking-[0.5em]">
                  {qrDialogCode}
                </code>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(qrDialogCode)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    複製連結
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadQR(qrDialogCode)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    下載圖片
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
