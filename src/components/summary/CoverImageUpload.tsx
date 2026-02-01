import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CoverImageUploadProps {
  currentImage: string;
  onImageChange: (url: string) => void;
  tripId?: string;
}

export function CoverImageUpload({
  currentImage,
  onImageChange,
  tripId,
}: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "格式錯誤",
        description: "請選擇圖片檔案（JPG、PNG、WEBP）",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "檔案過大",
        description: "圖片大小不能超過 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cover-${tripId || "temp"}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { data, error } = await supabase.storage
        .from("photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      onImageChange(urlData.publicUrl);
      toast({
        title: "上傳成功",
        description: "封面圖片已更新",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "上傳失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="relative group">
      {/* Current/Preview Image */}
      <div className="relative h-56 rounded-2xl overflow-hidden">
        <img
          src={displayImage}
          alt="封面圖片"
          className="w-full h-full object-cover transition-all group-hover:brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Upload Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity",
            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {isUploading ? (
            <div className="bg-background/90 rounded-full p-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-background/90 hover:bg-background rounded-full p-4 transition-colors"
            >
              <Camera className="w-8 h-8 text-primary" />
            </button>
          )}
        </div>

        {/* Upload Button Badge */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "absolute top-3 right-3 px-3 py-1.5 rounded-full",
            "bg-background/90 text-foreground text-caption font-medium",
            "flex items-center gap-1.5 transition-all",
            "hover:bg-background shadow-md",
            "disabled:opacity-50"
          )}
        >
          <Upload className="w-4 h-4" />
          更換封面
        </button>

        {/* Remove Preview */}
        {previewUrl && !isUploading && (
          <button
            onClick={handleRemovePreview}
            className="absolute top-3 left-3 p-2 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Hint */}
      <p className="text-center text-caption text-muted-foreground mt-2">
        點擊更換封面圖片（最大 5MB）
      </p>
    </div>
  );
}
