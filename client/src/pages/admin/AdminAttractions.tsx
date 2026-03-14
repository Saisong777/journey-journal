import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useAllTrips,
  useAdminAttractions,
  useAttractionMutations,
  type AdminAttraction,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2, ArrowLeft, MapPin, Book, Search, Upload } from "lucide-react";

// Fields to show in the edit form, grouped
const FIELD_GROUPS = [
  {
    label: "基本資料",
    fields: [
      { key: "nameZh", label: "中文名稱", type: "input" },
      { key: "nameEn", label: "英文名稱", type: "input" },
      { key: "nameAlt", label: "別名/古名", type: "input" },
      { key: "country", label: "國家", type: "input" },
      { key: "dayNo", label: "天數", type: "number" },
      { key: "seq", label: "排序", type: "number" },
      { key: "date", label: "日期", type: "input" },
      { key: "modernLocation", label: "現代位置", type: "textarea" },
      { key: "ancientToponym", label: "古代地名", type: "textarea" },
      { key: "gps", label: "GPS 座標", type: "input" },
    ],
  },
  {
    label: "參觀資訊",
    fields: [
      { key: "openingHours", label: "開放時間", type: "textarea" },
      { key: "admission", label: "門票", type: "input" },
      { key: "duration", label: "建議停留時間", type: "input" },
      { key: "bestTime", label: "最佳造訪時間", type: "textarea" },
      { key: "dressCode", label: "服裝要求", type: "textarea" },
      { key: "photoRestrictions", label: "拍照限制", type: "input" },
      { key: "crowdLevels", label: "人潮程度", type: "textarea" },
      { key: "safetyNotes", label: "安全提醒", type: "textarea" },
      { key: "accessibility", label: "無障礙資訊", type: "input" },
      { key: "physicalComment", label: "體力備註", type: "textarea" },
    ],
  },
  {
    label: "聖經與歷史",
    fields: [
      { key: "scriptureRefs", label: "經文參考", type: "textarea" },
      { key: "bibleBooks", label: "相關書卷", type: "input" },
      { key: "storySummary", label: "聖經故事摘要", type: "textarea" },
      { key: "keyFigures", label: "關鍵人物", type: "input" },
      { key: "historicalEra", label: "歷史時期", type: "textarea" },
      { key: "theologicalSignificance", label: "神學意義", type: "textarea" },
      { key: "lifeApplication", label: "生活應用", type: "textarea" },
      { key: "discussionQuestions", label: "討論問題", type: "textarea" },
    ],
  },
  {
    label: "考古與文物",
    fields: [
      { key: "archaeologicalFindings", label: "考古發現", type: "textarea" },
      { key: "historicalStrata", label: "歷史分層", type: "textarea" },
      { key: "accuracyRating", label: "考古準確度", type: "input" },
      { key: "keyArtifacts", label: "重要文物", type: "textarea" },
    ],
  },
  {
    label: "周邊資訊",
    fields: [
      { key: "nearbyDining", label: "附近餐飲", type: "textarea" },
      { key: "accommodation", label: "住宿", type: "input" },
      { key: "nearbyBiblicalSites", label: "附近聖經景點", type: "textarea" },
      { key: "localProducts", label: "當地特產", type: "input" },
      { key: "recommendationScore", label: "推薦評分", type: "input" },
      { key: "tourRoutePosition", label: "行程位置", type: "input" },
    ],
  },
] as const;

function parseCsv(text: string): Record<string, string>[] {
  // Remove BOM if present
  const clean = text.replace(/^\uFEFF/, "");
  // Parse entire CSV at once to handle multiline quoted fields
  const rows = parseCsvRows(clean);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(values => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let fields: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = "";
      } else if (ch === '\r' || ch === '\n') {
        // Skip \n after \r
        if (ch === '\r' && text[i + 1] === '\n') i++;
        fields.push(current);
        current = "";
        if (fields.some(f => f.trim())) rows.push(fields);
        fields = [];
      } else {
        current += ch;
      }
    }
  }
  // Last row
  fields.push(current);
  if (fields.some(f => f.trim())) rows.push(fields);
  return rows;
}

export default function AdminAttractions() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { data: trips } = useAllTrips();
  const { data: attractions, isLoading } = useAdminAttractions(tripId || null);
  const { updateAttraction, deleteAttraction, importAttractions } = useAttractionMutations(tripId || null);

  const [editingAttraction, setEditingAttraction] = useState<AdminAttraction | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Record<string, string>[] | null>(null);

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length === 0) return;
      setPendingImportData(rows);
      setShowImportConfirm(true);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const confirmImport = () => {
    if (pendingImportData) {
      importAttractions.mutate(pendingImportData);
    }
    setShowImportConfirm(false);
    setPendingImportData(null);
  };

  // Trip selection
  if (!tripId) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <h2 className="text-display mb-2">景點管理</h2>
          <p className="text-muted-foreground">請選擇行程：</p>
          <div className="grid gap-3">
            {trips?.map((trip: any) => (
              <Button
                key={trip.id}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => navigate(`/admin/attractions/${trip.id}`)}
              >
                <div className="text-left">
                  <p className="font-medium">{trip.title}</p>
                  <p className="text-xs text-muted-foreground">{trip.destination}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const handleEdit = (attraction: AdminAttraction) => {
    setEditingAttraction(attraction);
    setFormData({ ...attraction });
  };

  const handleSave = () => {
    if (!editingAttraction) return;
    const updates: Record<string, any> = {};
    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        const key = field.key;
        if (formData[key] !== (editingAttraction as any)[key]) {
          updates[key] = field.type === "number" ? Number(formData[key]) || 0 : formData[key] || null;
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      updateAttraction.mutate({ id: editingAttraction.id, ...updates });
    }
    setEditingAttraction(null);
  };

  const uniqueDays = attractions
    ? [...new Set(attractions.map(a => a.dayNo))].sort((a, b) => a - b)
    : [];

  const filtered = (attractions || []).filter(a => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      a.nameZh.toLowerCase().includes(q) ||
      (a.nameEn || "").toLowerCase().includes(q);
    const matchDay = filterDay === null || a.dayNo === filterDay;
    return matchSearch && matchDay;
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-display">景點管理</h2>
          <div className="flex gap-2">
            <label>
              <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-1" />
                  匯入 CSV
                </span>
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> 返回
            </Button>
          </div>
        </div>
        {/* Search + filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋景點..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            <Button
              variant={filterDay === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterDay(null)}
            >
              全部
            </Button>
            {uniqueDays.map(d => (
              <Button
                key={d}
                variant={filterDay === d ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterDay(d)}
              >
                D{d}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">共 {filtered.length} 個景點</p>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {/* Attraction list */}
        <div className="space-y-2">
          {filtered.map(a => (
            <div
              key={a.id}
              className="bg-card border rounded-lg p-3 flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    D{a.dayNo}
                  </span>
                  <span className="font-medium truncate">{a.nameZh}</span>
                  {a.nameEn && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">{a.nameEn}</span>
                  )}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  {a.gps && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" /> GPS
                    </span>
                  )}
                  {a.scriptureRefs && (
                    <span className="inline-flex items-center gap-0.5">
                      <Book className="w-3 h-3" /> {a.scriptureRefs.split(";")[0].split("／")[0].trim().slice(0, 15)}
                    </span>
                  )}
                  {a.storySummary && <span>有故事</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確認刪除</AlertDialogTitle>
                      <AlertDialogDescription>
                        確定要刪除「{a.nameZh}」？此操作無法復原。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteAttraction.mutate(a.id)}>
                        刪除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import preview & confirmation dialog */}
      <Dialog open={showImportConfirm} onOpenChange={(open) => { if (!open) { setShowImportConfirm(false); setPendingImportData(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>確認匯入景點</DialogTitle>
          </DialogHeader>
          {pendingImportData && pendingImportData.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                共 {pendingImportData.length} 筆資料。此操作會刪除現有所有景點並替換為新資料。
              </p>
              <div className="text-xs space-y-1">
                <p className="font-medium">偵測到的欄位名稱：</p>
                <p className="text-muted-foreground break-all">{Object.keys(pendingImportData[0]).join(", ")}</p>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-medium">前 3 筆預覽：</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingImportData.slice(0, 3).map((row, idx) => (
                    <div key={idx} className="bg-muted rounded p-2 space-y-0.5">
                      <p><span className="text-muted-foreground">名稱：</span>{row.name_zh || row.nameZh || "(空)"}</p>
                      <p><span className="text-muted-foreground">天數：</span>{row.day_no || row.dayNo || "(空)"}</p>
                      <p><span className="text-muted-foreground">排序：</span>{row.seq || "(空)"}</p>
                      <p><span className="text-muted-foreground">GPS：</span>{row.gps || "(空)"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportConfirm(false); setPendingImportData(null); }}>取消</Button>
            <Button onClick={confirmImport} disabled={importAttractions.isPending} variant="destructive">
              {importAttractions.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              確認匯入（覆蓋現有資料）
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingAttraction} onOpenChange={(open) => { if (!open) setEditingAttraction(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯景點：{editingAttraction?.nameZh}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {FIELD_GROUPS.map(group => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 border-b pb-1">{group.label}</h3>
                <div className="space-y-3">
                  {group.fields.map(field => (
                    <div key={field.key}>
                      <Label className="text-xs">{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          value={formData[field.key] || ""}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          rows={3}
                          className="mt-1"
                        />
                      ) : field.type === "number" ? (
                        <Input
                          type="number"
                          value={formData[field.key] ?? ""}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="mt-1"
                        />
                      ) : (
                        <Input
                          value={formData[field.key] || ""}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAttraction(null)}>取消</Button>
            <Button onClick={handleSave} disabled={updateAttraction.isPending}>
              {updateAttraction.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
