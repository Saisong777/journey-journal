import { useState } from "react";
import { X, Heart, Send, Bookmark } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ReflectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripture: string;
  onSave?: (reflection: { content: string; prayerPoints: string[] }) => void;
}

const prayerTopics = [
  "感恩讚美",
  "認罪悔改",
  "為自己禱告",
  "為家人禱告",
  "為團員禱告",
  "為世界禱告",
];

export function ReflectionSheet({
  open,
  onOpenChange,
  scripture,
  onSave,
}: ReflectionSheetProps) {
  const [reflection, setReflection] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [prayerContent, setPrayerContent] = useState("");

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSave = () => {
    onSave?.({
      content: reflection,
      prayerPoints: selectedTopics,
    });
    setReflection("");
    setSelectedTopics([]);
    setPrayerContent("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-title text-center">靈修感言</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-180px)] pb-4">
          {/* Scripture Reference */}
          <div className="bg-olive-light/50 rounded-lg p-4 flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-secondary" />
            <span className="text-body font-medium">{scripture}</span>
          </div>

          {/* Reflection */}
          <div className="space-y-3">
            <label className="text-body font-medium flex items-center gap-2">
              <Heart className="w-5 h-5 text-terracotta" />
              今日感動
            </label>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="這段經文對我說了什麼？我有什麼感動或領受..."
              className="min-h-[120px] text-body resize-none"
            />
          </div>

          {/* Prayer Topics */}
          <div className="space-y-3">
            <label className="text-body font-medium">禱告主題</label>
            <div className="flex flex-wrap gap-2">
              {prayerTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    "px-4 py-2 rounded-full text-caption transition-all touch-target",
                    selectedTopics.includes(topic)
                      ? "gradient-olive text-secondary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Prayer Content */}
          <div className="space-y-3">
            <label className="text-body font-medium">禱告內容</label>
            <Textarea
              value={prayerContent}
              onChange={(e) => setPrayerContent(e.target.value)}
              placeholder="親愛的天父，感謝祢..."
              className="min-h-[100px] text-body resize-none"
            />
          </div>

          {/* Share Option */}
          <div className="bg-card rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-body font-medium">分享給小組</p>
              <p className="text-caption text-muted-foreground">
                讓團員一起為你禱告
              </p>
            </div>
            <button className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <Button
            onClick={handleSave}
            disabled={!reflection.trim()}
            className="w-full h-14 text-body-lg gradient-warm text-primary-foreground rounded-xl"
          >
            完成靈修
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
