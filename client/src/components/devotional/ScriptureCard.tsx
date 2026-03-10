import { BookOpen, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScriptureData {
  reference: string;
  verses: {
    number: number;
    text: string;
  }[];
  theme: string;
  reflection: string;
  place?: string;
  action?: string;
  prayer?: string;
  lifeQuestion?: string;
}

interface ScriptureCardProps {
  scripture: ScriptureData;
  onStartReading?: () => void;
}

export function ScriptureCard({ scripture, onStartReading }: ScriptureCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      {/* Header */}
      <div className="gradient-olive p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-secondary-foreground">
            <BookOpen className="w-5 h-5" />
            <span className="text-body font-semibold">{scripture.reference}</span>
          </div>
          <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <Volume2 className="w-4 h-4 text-secondary-foreground" />
          </button>
        </div>
        <p className="text-caption text-secondary-foreground/80 mt-1">
          {scripture.theme}
        </p>
      </div>

      {/* Scripture Content */}
      <div className="p-5 space-y-4">
        <div className="space-y-3">
          {scripture.verses.map((verse) => (
            <p key={verse.number} className="text-body leading-relaxed">
              <span className="text-primary font-semibold text-caption align-super mr-1">
                {verse.number}
              </span>
              {verse.text}
            </p>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Reflection Prompt */}
        <div className="bg-olive-light/50 rounded-lg p-4">
          <h4 className="text-caption font-semibold text-secondary mb-2">默想引導</h4>
          <p className="text-body text-muted-foreground leading-relaxed">
            {scripture.reflection}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-5 pb-5">
        <button
          onClick={onStartReading}
          className={cn(
            "w-full py-4 rounded-xl gradient-warm text-primary-foreground",
            "flex items-center justify-center gap-2",
            "text-body font-semibold shadow-card",
            "hover:shadow-elevated active:brightness-95 transition-all"
          )}
        >
          <Play className="w-5 h-5" />
          開始靈修
        </button>
      </div>
    </div>
  );
}
