import { Book, Calendar, Clock, Compass, Footprints, Mountain, Ticket, Users } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { ScriptureText } from "@/components/ScriptureLink";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface AttractionDB {
  id: string;
  tripId: string;
  dayNo: number;
  seq: number;
  nameZh: string;
  nameEn: string | null;
  nameAlt: string | null;
  country: string | null;
  date: string | null;
  modernLocation: string | null;
  ancientToponym: string | null;
  gps: string | null;
  openingHours: string | null;
  admission: string | null;
  duration: string | null;
  scriptureRefs: string | null;
  bibleBooks: string | null;
  storySummary: string | null;
  keyFigures: string | null;
  historicalEra: string | null;
  theologicalSignificance: string | null;
  lifeApplication: string | null;
  discussionQuestions: string | null;
  archaeologicalFindings: string | null;
  historicalStrata: string | null;
  accuracyRating: string | null;
  keyArtifacts: string | null;
  tourRoutePosition: string | null;
  bestTime: string | null;
  dressCode: string | null;
  photoRestrictions: string | null;
  crowdLevels: string | null;
  safetyNotes: string | null;
  accessibility: string | null;
  nearbyDining: string | null;
  accommodation: string | null;
  nearbyBiblicalSites: string | null;
  localProducts: string | null;
  recommendationScore: string | null;
  physicalComment: string | null;
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length === 2) return `${parts[0]}月${parts[1]}日`;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function MarkdownContent({ text, className }: { text: string; className?: string }) {
  return (
    <ReactMarkdown
      className={cn("prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        h1: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1">{children}</h3>,
        h2: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1">{children}</h3>,
        h3: ({ children }) => <h4 className="text-sm font-bold mt-2 mb-1">{children}</h4>,
        h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-amber-400 pl-3 italic my-2">{children}</blockquote>,
        hr: () => <hr className="my-3 border-border" />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function InfoBlock({ title, icon: Icon, children, className }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg p-4", className)}>
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h4>
      <div className="text-body leading-relaxed">{children}</div>
    </div>
  );
}

interface AttractionDetailSheetProps {
  attraction: AttractionDB | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttractionDetailSheet({ attraction, open, onOpenChange }: AttractionDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        {attraction && (
          <>
            <SheetHeader className="text-left pb-4 border-b">
              <SheetTitle className="text-xl">{attraction.nameZh}</SheetTitle>
              {attraction.nameEn && (
                <p className="text-sm text-muted-foreground">{attraction.nameEn}</p>
              )}
              {attraction.nameAlt && (
                <p className="text-xs text-muted-foreground/70">{attraction.nameAlt}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  第{attraction.dayNo}天{attraction.date && ` · ${formatDate(attraction.date)}`}
                </span>
                {attraction.country && (
                  <span className="inline-flex items-center gap-1">
                    <Compass className="w-4 h-4" />
                    {attraction.country}
                  </span>
                )}
              </div>
            </SheetHeader>

            <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(85vh-10rem)]">
              {/* Quick info badges */}
              <div className="flex flex-wrap gap-2">
                {attraction.duration && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> {attraction.duration}
                  </span>
                )}
                {attraction.admission && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                    <Ticket className="w-3 h-3" /> {attraction.admission}
                  </span>
                )}
                {attraction.openingHours && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> {attraction.openingHours.length > 30 ? attraction.openingHours.slice(0, 30) + "…" : attraction.openingHours}
                  </span>
                )}
                {attraction.recommendationScore && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-full">
                    {attraction.recommendationScore}
                  </span>
                )}
              </div>

              {/* Scripture */}
              {attraction.scriptureRefs && (
                <InfoBlock title="相關經文" icon={Book} className="bg-primary/10 text-primary">
                  <div className="text-foreground flex flex-wrap gap-x-2 gap-y-1">
                    <ScriptureText text={attraction.scriptureRefs} />
                  </div>
                </InfoBlock>
              )}

              {/* Story Summary */}
              {attraction.storySummary && (
                <InfoBlock title="聖經故事" icon={Book} className="bg-card border border-border">
                  <MarkdownContent text={attraction.storySummary} className="text-muted-foreground" />
                </InfoBlock>
              )}

              {/* Key Figures */}
              {attraction.keyFigures && (
                <InfoBlock title="關鍵人物" icon={Users} className="bg-card border border-border">
                  <MarkdownContent text={attraction.keyFigures} className="text-muted-foreground" />
                </InfoBlock>
              )}

              {/* Theological Significance */}
              {attraction.theologicalSignificance && (
                <InfoBlock title="神學意義" icon={Book} className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40">
                  <MarkdownContent text={attraction.theologicalSignificance} className="text-amber-900 dark:text-amber-100" />
                </InfoBlock>
              )}

              {/* Life Application */}
              {attraction.lifeApplication && (
                <InfoBlock title="生活應用" icon={Footprints} className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/40">
                  <MarkdownContent text={attraction.lifeApplication} className="text-emerald-900 dark:text-emerald-100" />
                </InfoBlock>
              )}

              {/* Discussion Questions */}
              {attraction.discussionQuestions && (
                <InfoBlock title="討論問題" icon={Users} className="bg-card border border-border">
                  <MarkdownContent text={attraction.discussionQuestions.replace(/\s*[｜|]\s*/g, "\n")} className="text-muted-foreground" />
                </InfoBlock>
              )}

              {/* Archaeological */}
              {attraction.archaeologicalFindings && (
                <InfoBlock title="考古發現" icon={Mountain} className="bg-card border border-border">
                  <MarkdownContent text={attraction.archaeologicalFindings} className="text-muted-foreground" />
                </InfoBlock>
              )}

              {/* Practical info */}
              {(attraction.dressCode || attraction.safetyNotes || attraction.physicalComment) && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">實用資訊</h4>
                  {attraction.dressCode && (
                    <p className="text-body text-muted-foreground"><span className="font-medium">服裝要求：</span>{attraction.dressCode}</p>
                  )}
                  {attraction.safetyNotes && (
                    <p className="text-body text-muted-foreground"><span className="font-medium">安全提醒：</span>{attraction.safetyNotes}</p>
                  )}
                  {attraction.physicalComment && (
                    <p className="text-body text-muted-foreground"><span className="font-medium">體力備註：</span>{attraction.physicalComment}</p>
                  )}
                  {attraction.modernLocation && (
                    <p className="text-body text-muted-foreground"><span className="font-medium">位置：</span>{attraction.modernLocation}</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
