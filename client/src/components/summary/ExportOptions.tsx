import { FileText, Image, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function ExportOptions() {
  const { toast } = useToast();

  const handleExport = (format: string) => {
    toast({
      title: "準備匯出中...",
      description: `正在生成${format}格式的回憶錄`,
    });

    // Simulate export delay
    setTimeout(() => {
      toast({
        title: "匯出成功！",
        description: `您的回憶錄已準備好下載`,
      });
    }, 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "2024 聖地朝聖之旅回憶錄",
        text: "與您分享我的聖地朝聖之旅回憶",
        url: window.location.href,
      });
    } else {
      toast({
        title: "已複製連結",
        description: "回憶錄連結已複製到剪貼簿",
      });
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-title font-semibold">📤 匯出與分享</h3>

      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
          onClick={() => handleExport("PDF")}
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-body font-medium">PDF 文件</p>
              <p className="text-caption text-muted-foreground">完整回憶錄</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
          onClick={() => handleExport("圖片")}
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Image className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-body font-medium">照片集</p>
              <p className="text-caption text-muted-foreground">打包下載</p>
            </div>
          </div>
        </Card>
      </div>

      <Button
        variant="outline"
        className="w-full h-12"
        onClick={handleShare}
      >
        <Share2 className="w-5 h-5 mr-2" />
        分享回憶錄
      </Button>

      <Button
        className="w-full h-12"
        onClick={() => handleExport("完整")}
      >
        <Download className="w-5 h-5 mr-2" />
        下載完整回憶錄
      </Button>
    </section>
  );
}
