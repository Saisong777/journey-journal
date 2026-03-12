import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface CoverImageUploadProps {
  currentImage: string;
  onImageChange: (url: string) => void;
}

export function CoverImageUpload({
  currentImage,
  onImageChange,
}: CoverImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "格式錯誤",
        description: "請選擇圖片檔案（JPG、PNG、WEBP）",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "檔案過大",
        description: "圖片大小不能超過 5MB",
        variant: "destructive",
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const result = await uploadFile(file);
      if (!result) {
        throw new Error("Upload failed");
      }

      await apiRequest("PATCH", `/api/my-summary-cover`, {
        summaryCoverUrl: result.objectPath,
      });

      onImageChange(result.objectPath);
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
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resolvedCurrent = currentImage.startsWith("http") ? currentImage : transformPhotoUrl(currentImage);
  const displayImage = previewUrl || resolvedCurrent;

  return (
    <div className="relative group">
      <div className="relative h-56 rounded-2xl overflow-hidden">
        <img
          src={displayImage}
          alt="封面圖片"
          className="w-full h-full object-cover transition-all group-hover:brightness-90"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

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
              data-testid="button-change-cover"
            >
              <Camera className="w-8 h-8 text-primary" />
            </button>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "absolute top-3 right-3 px-3 py-1.5 rounded-full",
            "bg-background/90 text-foreground text-sm font-medium",
            "flex items-center gap-1.5 transition-all",
            "hover:bg-background shadow-md",
            "disabled:opacity-50"
          )}
          data-testid="button-upload-cover"
        >
          <Upload className="w-4 h-4" />
          更換封面
        </button>

        {previewUrl && !isUploading && (
          <button
            onClick={handleRemovePreview}
            className="absolute top-3 left-3 p-2 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
            data-testid="button-remove-preview"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-cover-file"
      />

      <p className="text-center text-sm text-muted-foreground mt-2">
        點擊更換封面圖片（最大 5MB）
      </p>
    </div>
  );
}
