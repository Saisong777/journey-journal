import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useAllTrips,
  useDevotionalCourses,
  useDevotionalCourseMutations,
  type DevotionalCourse,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";

interface DevotionalFormData {
  dayNo: number | null;
  title: string;
  scripture: string;
  reflection: string;
  action: string;
  prayer: string;
}

const emptyForm: DevotionalFormData = {
  dayNo: null,
  title: "",
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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<DevotionalCourse | null>(null);
  const [formData, setFormData] = useState<DevotionalFormData>(emptyForm);

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
            <Button onClick={openCreate} data-testid="button-create-devotional">
              <Plus className="w-4 h-4 mr-2" />
              新增靈修課程
            </Button>
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
      </div>
    </AdminLayout>
  );
}
