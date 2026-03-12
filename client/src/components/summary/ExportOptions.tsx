import { useState } from "react";
import { FileText, Image, Share2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTrip } from "@/hooks/useTrip";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useDevotionalEntries } from "@/hooks/useDevotional";
import { useEveningReflection } from "@/hooks/useEveningReflection";
import { useTripPhotos } from "@/hooks/useTripSummary";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";

function generateTextSummary(trip: any, journals: any[], devotionals: any[]): string {
  const lines: string[] = [];
  lines.push(`═══════════════════════════════════`);
  lines.push(`  ${trip?.title || "平安同行"} — 旅程回憶錄`);
  lines.push(`═══════════════════════════════════`);
  lines.push("");

  if (trip?.destination) lines.push(`目的地：${trip.destination}`);
  if (trip?.startDate && trip?.endDate) {
    lines.push(`日期：${format(parseISO(trip.startDate), "yyyy年M月d日", { locale: zhTW })} ~ ${format(parseISO(trip.endDate), "yyyy年M月d日", { locale: zhTW })}`);
  }
  lines.push("");

  if (devotionals && devotionals.length > 0) {
    lines.push(`───────────────────────────────────`);
    lines.push(`  靈修記錄 (${devotionals.length} 篇)`);
    lines.push(`───────────────────────────────────`);
    for (const d of devotionals) {
      lines.push("");
      lines.push(`📅 ${d.entryDate || "未知日期"}`);
      if (d.scriptureReference) lines.push(`📖 經文：${d.scriptureReference}`);
      if (d.reflection) lines.push(`💭 心得：${d.reflection}`);
      if (d.prayer) lines.push(`🙏 禱告：${d.prayer}`);
    }
    lines.push("");
  }

  if (journals && journals.length > 0) {
    lines.push(`───────────────────────────────────`);
    lines.push(`  旅途日誌 (${journals.length} 篇)`);
    lines.push(`───────────────────────────────────`);
    for (const j of journals) {
      lines.push("");
      lines.push(`📅 ${j.entryDate || "未知日期"}`);
      if (j.location) lines.push(`📍 ${j.location}`);
      if (j.title) lines.push(`📝 ${j.title}`);
      if (j.content) lines.push(j.content);
      if (j.photos && j.photos.length > 0) {
        lines.push(`📷 附圖 ${j.photos.length} 張`);
      }
    }
    lines.push("");
  }

  lines.push(`───────────────────────────────────`);
  lines.push(`  匯出時間：${format(new Date(), "yyyy年M月d日 HH:mm", { locale: zhTW })}`);
  lines.push(`───────────────────────────────────`);

  return lines.join("\n");
}

function downloadTextFile(content: string, filename: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportOptions() {
  const { toast } = useToast();
  const { data: trip } = useTrip();
  const { data: journals } = useJournalEntries();
  const { data: devotionals } = useDevotionalEntries();
  const { data: photos } = useTripPhotos();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPhotos, setExportingPhotos] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  const handleExportPdf = () => {
    setExportingPdf(true);
    try {
      const content = generateTextSummary(trip, journals || [], devotionals || []);
      const tripTitle = trip?.title || "平安同行";
      downloadTextFile(content, `${tripTitle}_回憶錄.txt`);
      toast({
        title: "匯出成功",
        description: "回憶錄文字檔已下載",
      });
    } catch (error) {
      toast({
        title: "匯出失敗",
        description: "生成文件時發生錯誤",
        variant: "destructive",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportPhotos = async () => {
    if (!photos || photos.length === 0) {
      toast({
        title: "沒有照片",
        description: "尚無照片可匯出",
        variant: "destructive",
      });
      return;
    }

    setExportingPhotos(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      let successCount = 0;
      for (let i = 0; i < photos.length; i++) {
        try {
          const response = await fetch(photos[i].url);
          if (!response.ok) continue;
          const blob = await response.blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          const caption = photos[i].caption ? `_${photos[i].caption.replace(/[/\\?%*:|"<>]/g, "")}` : "";
          zip.file(`photo_${i + 1}${caption}.${ext}`, blob);
          successCount++;
        } catch {
          continue;
        }
      }

      if (successCount === 0) {
        toast({
          title: "匯出失敗",
          description: "無法下載任何照片",
          variant: "destructive",
        });
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const tripTitle = trip?.title || "平安同行";
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tripTitle}_照片集.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "匯出成功",
        description: `已下載 ${successCount} 張照片`,
      });
    } catch (error) {
      toast({
        title: "匯出失敗",
        description: "打包照片時發生錯誤",
        variant: "destructive",
      });
    } finally {
      setExportingPhotos(false);
    }
  };

  const handleExportFull = async () => {
    setExportingFull(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const content = generateTextSummary(trip, journals || [], devotionals || []);
      const BOM = "\uFEFF";
      zip.file("回憶錄.txt", BOM + content);

      if (photos && photos.length > 0) {
        const photosFolder = zip.folder("照片");
        for (let i = 0; i < photos.length; i++) {
          try {
            const response = await fetch(photos[i].url);
            if (!response.ok) continue;
            const blob = await response.blob();
            const ext = blob.type.includes("png") ? "png" : "jpg";
            photosFolder?.file(`photo_${i + 1}.${ext}`, blob);
          } catch {
            continue;
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const tripTitle = trip?.title || "平安同行";
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tripTitle}_完整回憶錄.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "匯出成功",
        description: "完整回憶錄已下載",
      });
    } catch (error) {
      toast({
        title: "匯出失敗",
        description: "打包回憶錄時發生錯誤",
        variant: "destructive",
      });
    } finally {
      setExportingFull(false);
    }
  };

  const handleShare = async () => {
    const tripTitle = trip?.title || "平安同行";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tripTitle} 回憶錄`,
          text: `與您分享我的${tripTitle}回憶`,
          url: window.location.href,
        });
      } catch {
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "已複製連結",
        description: "回憶錄連結已複製到剪貼簿",
      });
    }
  };

  const anyExporting = exportingPdf || exportingPhotos || exportingFull;

  return (
    <section className="space-y-4">
      <h3 className="text-title font-semibold">匯出與分享</h3>

      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow active:brightness-95"
          onClick={anyExporting ? undefined : handleExportPdf}
          data-testid="card-export-pdf"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              {exportingPdf ? <Loader2 className="w-6 h-6 animate-spin text-destructive" /> : <FileText className="w-6 h-6 text-destructive" />}
            </div>
            <div>
              <p className="text-body font-medium">文字記錄</p>
              <p className="text-caption text-muted-foreground">靈修 + 日誌</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow active:brightness-95"
          onClick={anyExporting ? undefined : handleExportPhotos}
          data-testid="card-export-photos"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {exportingPhotos ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Image className="w-6 h-6 text-primary" />}
            </div>
            <div>
              <p className="text-body font-medium">照片集</p>
              <p className="text-caption text-muted-foreground">打包下載 ZIP</p>
            </div>
          </div>
        </Card>
      </div>

      <Button
        variant="outline"
        className="w-full h-12"
        onClick={handleShare}
        disabled={anyExporting}
        data-testid="button-share"
      >
        <Share2 className="w-5 h-5 mr-2" />
        分享回憶錄
      </Button>

      <Button
        className="w-full h-12"
        onClick={handleExportFull}
        disabled={anyExporting}
        data-testid="button-export-full"
      >
        {exportingFull ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
        下載完整回憶錄
      </Button>
    </section>
  );
}
