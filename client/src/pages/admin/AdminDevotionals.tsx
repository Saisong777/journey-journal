import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useAllTrips,
  useDevotionalCourses,
  useDevotionalCourseMutations,
  type DevotionalCourse,
} from "@/hooks/useAdmin";
import { useBibleLookup } from "@/hooks/useDevotional";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, BookOpen, AlertCircle, Upload, FileText, MapPin, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DevotionalFormData {
  dayNo: number | null;
  title: string;
  place: string;
  scripture: string;
  reflection: string;
  action: string;
  prayer: string;
}

const emptyForm: DevotionalFormData = {
  dayNo: null,
  title: "",
  place: "",
  scripture: "",
  reflection: "",
  action: "",
  prayer: "",
};

export default function AdminDevotionals() {
  const { tripId: urlTripId } = useParams();
  const navigate = useNavigate();
  const { data: trips, isLoading: tripsLoading } = useAllTrips();

  const [selectedTripId, setSelectedTripId] = useState<string | null>(urlTripId || null);
  const { data: courses, isLoading: coursesLoading } = useDevotionalCourses(selectedTripId);
  const { createDevotionalCourse, updateDevotionalCourse, deleteDevotionalCourse } =
    useDevotionalCourseMutations(selectedTripId);

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<DevotionalCourse | null>(null);
  const [formData, setFormData] = useState<DevotionalFormData>(emptyForm);
  const [debouncedScripture, setDebouncedScripture] = useState("");

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<DevotionalFormData[]>([]);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedScripture(formData.scripture.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.scripture]);

  const { data: scripturePreview, isLoading: previewLoading, isError: previewError } = useBibleLookup(
    isDialogOpen && debouncedScripture ? debouncedScripture : null
  );

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingCourse(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (course: DevotionalCourse) => {
    setEditingCourse(course);
    setFormData({
      dayNo: course.dayNo,
      title: course.title,
      place: course.place || "",
      scripture: course.scripture || "",
      reflection: course.reflection || "",
      action: course.action || "",
      prayer: course.prayer || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingCourse) {
      await updateDevotionalCourse.mutateAsync({
        id: editingCourse.id,
        ...formData,
      });
    } else {
      await createDevotionalCourse.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteDevotionalCourse.mutateAsync(id);
  };

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    navigate(`/admin/devotionals/${tripId}`);
  };

  const parseCSV = (text: string): DevotionalFormData[] => {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const results: DevotionalFormData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const ch of lines[i]) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          fields.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      fields.push(current.trim());
      const [day, , place, theme, scripture, meditation, action, prayer] = fields;
      const dayNo = parseInt(day);
      if (!dayNo || !theme) continue;
      results.push({
        dayNo,
        title: theme,
        place: place || "",
        scripture: scripture || "",
        reflection: meditation || "",
        action: action || "",
        prayer: prayer || "",
      });
    }
    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setCsvPreview(parsed);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImport = async () => {
    if (!selectedTripId || csvPreview.length === 0) return;
    setIsImporting(true);
    try {
      await apiRequest("POST", `/api/admin/trips/${selectedTripId}/devotional-courses/import`, {
        courses: csvPreview,
        mode: importMode,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-devotional-courses", selectedTripId] });
      toast({ title: `成功匯入 ${csvPreview.length} 筆靈修課程` });
      setIsImportOpen(false);
      setCsvPreview([]);
    } catch (error) {
      toast({ title: "匯入失敗", description: "請確認 CSV 格式是否正確", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedTrip = trips?.find((t) => t.id === selectedTripId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-display mb-2">靈修管理</h2>
            <p className="text-body text-muted-foreground">
              為每個旅程建立靈修課程內容
            </p>
          </div>

          {selectedTripId && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setCsvPreview([]); setIsImportOpen(true); }} data-testid="button-import-devotional">
                <Upload className="w-4 h-4 mr-2" />
                匯入 CSV
              </Button>
              <Button onClick={openCreate} data-testid="button-create-devotional">
                <Plus className="w-4 h-4 mr-2" />
                新增靈修課程
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg shadow-card p-4">
          <Label className="text-body mb-2 block">選擇旅程</Label>
          <Select
            value={selectedTripId || ""}
            onValueChange={handleTripChange}
          >
            <SelectTrigger className="w-full md:w-80" data-testid="select-trip">
              <SelectValue placeholder="選擇一個旅程" />
            </SelectTrigger>
            <SelectContent>
              {trips?.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>
                  {trip.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedTripId ? (
          <div className="bg-card rounded-lg shadow-card p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-body text-muted-foreground">請先選擇一個旅程</p>
          </div>
        ) : coursesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-card rounded-lg shadow-card p-6"
                data-testid={`devotional-card-${course.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {course.dayNo && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          第 {course.dayNo} 天
                        </span>
                      )}
                      <h3 className="text-title font-semibold">{course.title}</h3>
                    </div>

                    {course.place && (
                      <p className="text-body text-muted-foreground mb-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {course.place}
                      </p>
                    )}

                    {course.scripture && (
                      <p className="text-body text-primary mb-2">
                        經文：{course.scripture}
                      </p>
                    )}

                    {course.reflection && (
                      <div className="mb-3">
                        <p className="text-caption text-muted-foreground mb-1">靈修短文</p>
                        <p className="text-body whitespace-pre-wrap line-clamp-3">
                          {course.reflection}
                        </p>
                      </div>
                    )}

                    {course.action && (
                      <p className="text-body text-secondary mb-2">
                        行動操練：{course.action}
                      </p>
                    )}

                    {course.prayer && (
                      <p className="text-body text-muted-foreground italic">
                        禱告：{course.prayer}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(course)}
                      data-testid={`button-edit-${course.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${course.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認刪除</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要刪除「{course.title}」嗎？此操作無法復原。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(course.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-card p-12 text-center">
            <p className="text-body text-muted-foreground mb-4">此旅程尚未有靈修課程</p>
            <Button onClick={openCreate} data-testid="button-create-first-devotional">
              <Plus className="w-4 h-4 mr-2" />
              建立第一個靈修課程
            </Button>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "編輯靈修課程" : "新增靈修課程"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dayNo">對應天數（選填）</Label>
                  <Input
                    id="dayNo"
                    type="number"
                    min="1"
                    placeholder="例如：1"
                    value={formData.dayNo || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dayNo: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    data-testid="input-day-no"
                  />
                </div>
                <div>
                  <Label htmlFor="title">主題 *</Label>
                  <Input
                    id="title"
                    placeholder="靈修主題"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    data-testid="input-title"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="place">地點（選填）</Label>
                <Input
                  id="place"
                  placeholder="例如：伊斯坦堡、以弗所"
                  value={formData.place}
                  onChange={(e) =>
                    setFormData({ ...formData, place: e.target.value })
                  }
                  data-testid="input-place"
                />
              </div>

              <div>
                <Label htmlFor="scripture">經文（書卷+章節或範圍）</Label>
                <Input
                  id="scripture"
                  placeholder="例如：詩篇 23:1-6 或 約翰福音 3:16"
                  value={formData.scripture}
                  onChange={(e) =>
                    setFormData({ ...formData, scripture: e.target.value })
                  }
                  data-testid="input-scripture"
                />
                {debouncedScripture && (
                  <div className="mt-2">
                    {previewLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-caption p-3 bg-muted/50 rounded-lg">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>查詢經文中...</span>
                      </div>
                    ) : previewError ? (
                      <div className="flex items-center gap-2 text-destructive text-caption p-3 bg-destructive/5 rounded-lg">
                        <AlertCircle className="w-3 h-3" />
                        <span>無法找到此經文，請確認格式（例如：詩篇 23:1-6）</span>
                      </div>
                    ) : scripturePreview && scripturePreview.verses.length > 0 ? (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30" data-testid="scripture-preview">
                        <p className="text-caption font-semibold text-amber-700 dark:text-amber-300 mb-2">
                          <BookOpen className="w-3 h-3 inline mr-1" />
                          經文預覽 — {scripturePreview.reference}
                        </p>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {scripturePreview.verses.map((v) => (
                            <p key={v.number} className="text-caption leading-relaxed text-foreground">
                              <span className="text-amber-600 dark:text-amber-400 font-semibold mr-1">{v.number}</span>
                              {v.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : scripturePreview && scripturePreview.verses.length === 0 ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-caption p-3 bg-muted/50 rounded-lg">
                        <AlertCircle className="w-3 h-3" />
                        <span>找不到對應的經文節數</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="reflection">靈修短文（核心內容）</Label>
                <Textarea
                  id="reflection"
                  placeholder="靈修的核心內容與思想..."
                  rows={5}
                  value={formData.reflection}
                  onChange={(e) =>
                    setFormData({ ...formData, reflection: e.target.value })
                  }
                  data-testid="input-reflection"
                />
              </div>

              <div>
                <Label htmlFor="action">行動操練（一句話可做的事）</Label>
                <Input
                  id="action"
                  placeholder="例如：今天找一位朋友分享這段經文的感動"
                  value={formData.action}
                  onChange={(e) =>
                    setFormData({ ...formData, action: e.target.value })
                  }
                  data-testid="input-action"
                />
              </div>

              <div>
                <Label htmlFor="prayer">禱告（簡短結尾）</Label>
                <Textarea
                  id="prayer"
                  placeholder="簡短的禱告文..."
                  rows={3}
                  value={formData.prayer}
                  onChange={(e) =>
                    setFormData({ ...formData, prayer: e.target.value })
                  }
                  data-testid="input-prayer"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !formData.title ||
                  createDevotionalCourse.isPending ||
                  updateDevotionalCourse.isPending
                }
                data-testid="button-save-devotional"
              >
                {(createDevotionalCourse.isPending ||
                  updateDevotionalCourse.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingCourse ? "更新" : "建立"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                匯入靈修課程（CSV）
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 text-caption text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">CSV 欄位格式：</p>
                <p>Day, Date, Place, OneLineTheme, Scripture, OnSiteMeditation, Action, Prayer</p>
                <p>第一行為標題列，系統會自動跳過</p>
              </div>

              <div>
                <Label>選擇 CSV 檔案</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-1"
                  data-testid="input-csv-file"
                />
              </div>

              <div>
                <Label>匯入模式</Label>
                <Select value={importMode} onValueChange={(v) => setImportMode(v as "replace" | "append")}>
                  <SelectTrigger className="w-full mt-1" data-testid="select-import-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">取代現有課程（先清除再匯入）</SelectItem>
                    <SelectItem value="append">附加到現有課程</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-body font-medium">預覽：共 {csvPreview.length} 筆課程</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-caption">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="p-2 text-left w-12">天</th>
                          <th className="p-2 text-left">地點</th>
                          <th className="p-2 text-left">主題</th>
                          <th className="p-2 text-left">經文</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2 font-semibold text-primary">{row.dayNo}</td>
                            <td className="p-2 text-muted-foreground">{row.place || "—"}</td>
                            <td className="p-2">{row.title}</td>
                            <td className="p-2 text-primary">{row.scripture || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleImport}
                disabled={csvPreview.length === 0 || isImporting}
                data-testid="button-confirm-import"
              >
                {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                確認匯入 {csvPreview.length > 0 ? `(${csvPreview.length} 筆)` : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
