import { useState } from "react";
import { Camera, Save } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ProfileData {
  name: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  dietaryRestrictions: string;
  medicalNotes: string;
}

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  onSave?: (profile: ProfileData) => void;
}

export function ProfileEditSheet({
  open,
  onOpenChange,
  profile,
  onSave,
}: ProfileEditSheetProps) {
  const [formData, setFormData] = useState<ProfileData>(profile);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave?.(formData);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-title text-center">編輯個人資料</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] pb-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden shadow-card">
                <span className="text-display text-muted-foreground">
                  {formData.name.charAt(0)}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-warm flex items-center justify-center shadow-card">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-body font-semibold">基本資料</h3>
            
            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">姓名</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="h-12 text-body"
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">電話號碼</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="h-12 text-body"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">電子郵件</label>
              <Input
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-12 text-body"
                type="email"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-body font-semibold">緊急聯絡人</h3>
            
            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">聯絡人姓名</label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) => handleChange("emergencyContact", e.target.value)}
                className="h-12 text-body"
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">聯絡人電話</label>
              <Input
                value={formData.emergencyPhone}
                onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                className="h-12 text-body"
                type="tel"
              />
            </div>
          </div>

          {/* Special Needs */}
          <div className="space-y-4">
            <h3 className="text-body font-semibold">特殊需求</h3>
            
            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">飲食限制</label>
              <Input
                value={formData.dietaryRestrictions}
                onChange={(e) => handleChange("dietaryRestrictions", e.target.value)}
                className="h-12 text-body"
                placeholder="例如：素食、過敏..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">醫療備註</label>
              <Input
                value={formData.medicalNotes}
                onChange={(e) => handleChange("medicalNotes", e.target.value)}
                className="h-12 text-body"
                placeholder="例如：慢性病、用藥..."
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <Button
            onClick={handleSave}
            className="w-full h-14 text-body-lg gradient-warm text-primary-foreground rounded-xl"
          >
            <Save className="w-5 h-5 mr-2" />
            儲存變更
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
