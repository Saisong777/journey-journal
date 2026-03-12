import { useState, useEffect, useRef } from "react";
import { Camera, Save, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { transformPhotoUrl } from "@/lib/photoUtils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface ProfileData {
  name: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  dietaryRestrictions: string;
  medicalNotes: string;
  avatarUrl?: string | null;
}

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  onSave?: (profile: ProfileData) => void;
  isSaving?: boolean;
  showPasswordSection?: boolean;
}

export function ProfileEditSheet({
  open,
  onOpenChange,
  profile,
  onSave,
  isSaving,
  showPasswordSection = true,
}: ProfileEditSheetProps) {
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, isUploading: isUploadingAvatar } = useUpload({
    onSuccess: (response) => {
      const url = transformPhotoUrl(response.objectPath);
      setFormData((prev) => ({ ...prev, avatarUrl: url }));
      toast({ title: "頭像已更新", description: "記得點擊「儲存變更」保存" });
    },
    onError: () => {
      toast({ title: "上傳失敗", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (open) {
      setFormData(profile);
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open, profile]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: "請填寫密碼欄位", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "密碼至少需要 6 個字元", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "兩次輸入的密碼不一致", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiRequest("PATCH", "/api/auth/change-password", { newPassword });
      toast({ title: "密碼修改成功", description: "下次登入請使用新密碼" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "密碼修改失敗", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = () => {
    onSave?.(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-title text-center">編輯個人資料</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] pb-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden shadow-card">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="頭像" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-display text-muted-foreground">
                    {formData.name.charAt(0)}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                  e.target.value = "";
                }}
              />
              <button
                data-testid="button-change-avatar"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-warm flex items-center justify-center shadow-card"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-primary-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-body font-semibold">基本資料</h3>
            
            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">姓名</label>
              <Input
                data-testid="input-profile-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="h-12 text-body"
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">電話號碼</label>
              <Input
                data-testid="input-profile-phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="h-12 text-body"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">電子郵件</label>
              <Input
                data-testid="input-profile-email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-12 text-body"
                type="email"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-body font-semibold">緊急聯絡人</h3>
            
            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">聯絡人姓名</label>
              <Input
                data-testid="input-profile-emergency-contact"
                value={formData.emergencyContact}
                onChange={(e) => handleChange("emergencyContact", e.target.value)}
                className="h-12 text-body"
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">聯絡人電話</label>
              <Input
                data-testid="input-profile-emergency-phone"
                value={formData.emergencyPhone}
                onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                className="h-12 text-body"
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-body font-semibold">特殊需求</h3>
            
            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">飲食限制</label>
              <Input
                data-testid="input-profile-dietary"
                value={formData.dietaryRestrictions}
                onChange={(e) => handleChange("dietaryRestrictions", e.target.value)}
                className="h-12 text-body"
                placeholder="例如：素食、過敏..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">醫療備註</label>
              <Input
                data-testid="input-profile-medical"
                value={formData.medicalNotes}
                onChange={(e) => handleChange("medicalNotes", e.target.value)}
                className="h-12 text-body"
                placeholder="例如：慢性病、用藥..."
              />
            </div>
          </div>

          {showPasswordSection && (
            <div className="space-y-4">
              <h3 className="text-body font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4" />
                修改密碼
              </h3>
              
              <div className="space-y-2">
                <label className="text-caption text-muted-foreground">新密碼</label>
                <div className="relative">
                  <Input
                    data-testid="input-new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 text-body pr-12"
                    placeholder="至少 6 個字元"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    data-testid="button-toggle-new-password"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-caption text-muted-foreground">確認新密碼</label>
                <div className="relative">
                  <Input
                    data-testid="input-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 text-body pr-12"
                    placeholder="再次輸入新密碼"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                data-testid="button-change-password"
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                variant="outline"
                className="w-full h-12 text-body"
              >
                {isChangingPassword ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5 mr-2" />
                )}
                {isChangingPassword ? "修改中..." : "確認修改密碼"}
              </Button>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <Button
            data-testid="button-save-profile"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 text-body-lg gradient-warm text-primary-foreground rounded-xl"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSaving ? "儲存中..." : "儲存變更"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
