import { useState, useRef } from "react";
import { Camera, Save, Loader2, Lock, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { transformPhotoUrl } from "@/lib/photoUtils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface FamilyMember {
  relationship: "spouse" | "child" | "relative";
  name: string;
}

export interface ProfileData {
  name: string;
  phone: string;
  email: string;
  birthday: string;
  gender: string;
  familyMembers: FamilyMember[];
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
      setFormData((prev) => ({ ...prev, avatarUrl: response.objectPath }));
      toast({ title: "頭像已更新", description: "記得點擊「儲存變更」保存" });
    },
    onError: () => {
      toast({ title: "上傳失敗", variant: "destructive" });
    },
  });

  // Only reset form when sheet opens, not on every profile prop change while open
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setFormData(profile);
    setNewPassword("");
    setConfirmPassword("");
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: "請填寫密碼欄位", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "密碼至少需要 8 個字元", variant: "destructive" });
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
                  <img src={transformPhotoUrl(formData.avatarUrl)} alt="頭像" className="w-full h-full object-cover" />
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

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">生日</label>
              <Input
                data-testid="input-profile-birthday"
                value={formData.birthday}
                onChange={(e) => handleChange("birthday", e.target.value)}
                className="h-12 text-body"
                type="date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">性別</label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
              >
                <SelectTrigger className="h-12 text-body" data-testid="select-profile-gender">
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="female">女</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-body font-semibold">同行家人</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    familyMembers: [...prev.familyMembers, { relationship: "spouse", name: "" }],
                  }));
                }}
                data-testid="button-add-family"
              >
                <Plus className="w-4 h-4 mr-1" />
                新增
              </Button>
            </div>

            {formData.familyMembers.length === 0 && (
              <p className="text-caption text-muted-foreground">尚未新增同行家人，點擊「新增」添加。</p>
            )}

            {formData.familyMembers.map((member, index) => (
              <div key={index} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-medium">同行家人 {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        familyMembers: prev.familyMembers.filter((_, i) => i !== index),
                      }));
                    }}
                    data-testid={`button-remove-family-${index}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={member.relationship}
                    onValueChange={(value) => {
                      setFormData((prev) => {
                        const updated = [...prev.familyMembers];
                        updated[index] = { ...updated[index], relationship: value as FamilyMember["relationship"] };
                        return { ...prev, familyMembers: updated };
                      });
                    }}
                  >
                    <SelectTrigger className="h-12 text-body w-28 flex-shrink-0" data-testid={`select-family-relation-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">配偶</SelectItem>
                      <SelectItem value="child">子女</SelectItem>
                      <SelectItem value="relative">親人</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={member.name}
                    onChange={(e) => {
                      setFormData((prev) => {
                        const updated = [...prev.familyMembers];
                        updated[index] = { ...updated[index], name: e.target.value };
                        return { ...prev, familyMembers: updated };
                      });
                    }}
                    placeholder="姓名"
                    className="h-12 text-body flex-1"
                    data-testid={`input-family-name-${index}`}
                  />
                </div>
              </div>
            ))}
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
                    placeholder="至少 8 個字元"
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
