import { useState, useCallback } from "react";
import { BookOpen, Copy, Check, Loader2, X } from "lucide-react";
import { getAuthToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BibleVerse {
  number: number;
  text: string;
}

interface BibleLookupResult {
  reference: string;
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
}

// Global cache shared across all ScriptureLink instances
const verseCache: Record<string, BibleLookupResult | null> = {};
const loadingRefs = new Set<string>();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function fetchVerses(ref: string): Promise<BibleLookupResult | null> {
  if (verseCache[ref] !== undefined) return verseCache[ref];
  if (loadingRefs.has(ref)) return null;

  loadingRefs.add(ref);
  notifyListeners();

  try {
    const token = getAuthToken();
    const response = await fetch(`/api/bible/lookup?ref=${encodeURIComponent(ref)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.ok) {
      const data = await response.json();
      verseCache[ref] = data;
    } else {
      verseCache[ref] = null;
    }
  } catch {
    verseCache[ref] = null;
  } finally {
    loadingRefs.delete(ref);
    notifyListeners();
  }

  return verseCache[ref];
}

/**
 * Clickable scripture reference that shows a popup with the Bible text.
 * Usage: <ScriptureLink reference="約翰福音 3:16" />
 */
export function ScriptureLink({ reference, className }: { reference: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [verses, setVerses] = useState<BibleLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (verseCache[reference] !== undefined) {
      setVerses(verseCache[reference]);
      setOpen(true);
      return;
    }

    setOpen(true);
    setLoading(true);
    const result = await fetchVerses(reference);
    setVerses(result);
    setLoading(false);
  }, [reference]);

  const handleCopy = useCallback(() => {
    if (!verses?.verses.length) return;
    const text = `${reference}\n${verses.verses
      .filter((v) => v.number !== 0)
      .map((v) => `${v.number} ${v.text}`)
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "經文已複製到剪貼簿" });
    setTimeout(() => setCopied(false), 2000);
  }, [reference, verses, toast]);

  return (
    <>
      <button
        onClick={handleClick}
        className={className || "inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline cursor-pointer font-medium"}
      >
        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{reference}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col shadow-xl animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-sm">{reference}</h3>
              </div>
              <div className="flex items-center gap-1">
                {verses?.verses && verses.verses.length > 0 && (
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="複製經文"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-4 py-3 space-y-1.5">
              {loading ? (
                <div className="flex items-center gap-2 py-6 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  <span className="text-sm text-muted-foreground">載入經文中...</span>
                </div>
              ) : verses && verses.verses.length > 0 ? (
                verses.verses.map((v, i) =>
                  v.number === 0 ? (
                    <p key={i} className="text-xs text-amber-600 font-semibold pt-2 pb-1">{v.text}</p>
                  ) : (
                    <p key={i} className="text-sm text-foreground leading-relaxed">
                      <span className="text-xs text-amber-600 font-bold mr-1">{v.number}</span>
                      {v.text}
                    </p>
                  )
                )
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">無法載入經文內容</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Parse a string containing scripture references (separated by ; or ；or ／)
 * and render each as a clickable ScriptureLink.
 * Non-scripture text is rendered as-is.
 *
 * Usage: <ScriptureText text="徒16:6-12; 提後4:13" />
 */
export function ScriptureText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;

  // Split by common delimiters: ; ； ／ /
  const refs = text.split(/[;；／]/).map((r) => r.trim()).filter(Boolean);

  return (
    <span className={className}>
      {refs.map((ref, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground mx-1">;</span>}
          <ScriptureLink reference={ref} />
        </span>
      ))}
    </span>
  );
}
