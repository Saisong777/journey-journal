import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Utensils, Clock, Home, Bus, Users, Coffee, Pencil, Trash2, Plus, RefreshCw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  type ScheduleItem,
  useCreateScheduleItem,
  useUpdateScheduleItem,
  useDeleteScheduleItem,
  useSeedScheduleItems,
} from "@/hooks/useScheduleItems";

const TYPE_OPTIONS = [
  { value: "meal", label: "餐食", icon: Utensils },
  { value: "activity", label: "景點/活動", icon: Clock },
  { value: "boarding", label: "上車", icon: Bus },
  { value: "gathering", label: "集合", icon: Users },
  { value: "accommodation", label: "住宿", icon: Home },
  { value: "free_time", label: "自由時間", icon: Coffee },
  { value: "custom", label: "自訂", icon: Clock },
] as const;

function getTypeIcon(type: ScheduleItem["type"]) {
  const opt = TYPE_OPTIONS.find(o => o.value === type);
  return opt ? opt.icon : Clock;
}

interface EditingItem {
  id: string | null;
  time: string;
  type: ScheduleItem["type"];
  title: string;
  location: string;
  notes: string;
}

interface ScheduleManagerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayNo: number;
  items: ScheduleItem[];
  hasItems: boolean;
}

export function ScheduleManagerSheet({ open, onOpenChange, dayNo, items, hasItems }: ScheduleManagerSheetProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditingItem | null>(null);

  const createItem = useCreateScheduleItem();
  const updateItem = useUpdateScheduleItem();
  const deleteItem = useDeleteScheduleItem();
  const seedItems = useSeedScheduleItems();

  function startNew() {
    setEditing({ id: null, time: "09:00", type: "activity", title: "", location: "", notes: "" });
  }

  function startEdit(item: ScheduleItem) {
    setEditing({
      id: item.id,
      time: item.time,
      type: item.type,
      title: item.title,
      location: item.location ?? "",
      notes: item.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast({ title: "請輸入項目名稱", variant: "destructive" });
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(editing.time)) {
      toast({ title: "時間格式需為 HH:MM", variant: "destructive" });
      return;
    }

    try {
      if (editing.id === null) {
        await createItem.mutateAsync({
          dayNo,
          time: editing.time,
          type: editing.type,
          title: editing.title.trim(),
          location: editing.location.trim() || undefined,
          notes: editing.notes.trim() || undefined,
          seq: 0,
        });
        toast({ title: "已新增行程項目" });
      } else {
        await updateItem.mutateAsync({
          id: editing.id,
          dayNo,
          time: editing.time,
          type: editing.type,
          title: editing.title.trim(),
          location: editing.location.trim() || null,
          notes: editing.notes.trim() || null,
        });
        toast({ title: "已更新行程項目" });
      }
      setEditing(null);
    } catch {
      toast({ title: "儲存失敗，請重試", variant: "destructive" });
    }
  }

  async function handleDelete(item: ScheduleItem) {
    try {
      await deleteItem.mutateAsync({ id: item.id, dayNo });
      toast({ title: "已刪除項目" });
    } catch {
      toast({ title: "刪除失敗", variant: "destructive" });
    }
  }

  async function handleSeed() {
    try {
      await seedItems.mutateAsync(dayNo);
      toast({ title: "已從行程資料匯入" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "匯入失敗";
      if (msg.includes("already exist")) {
        toast({ title: "此天已有行程項目，無需重新匯入" });
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    }
  }

  // Always sort by time
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  const isBusy = createItem.isPending || updateItem.isPending || deleteItem.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="flex-shrink-0 pb-3 border-b border-border">
          <SheetTitle className="text-center">管理行程安排</SheetTitle>
          <p className="text-caption text-muted-foreground text-center">第 {dayNo} 天 · 依時間自動排序</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {/* Seed button when no items */}
          {!hasItems && (
            <div className="text-center py-6 space-y-3">
              <p className="text-body text-muted-foreground">尚未設定行程項目</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeed}
                disabled={seedItems.isPending}
                className="gap-1.5"
              >
                <RefreshCw className={cn("w-4 h-4", seedItems.isPending && "animate-spin")} />
                從行程資料匯入預設項目
              </Button>
            </div>
          )}

          {/* Existing items sorted by time */}
          {sorted.map((item) => {
            const Icon = getTypeIcon(item.type);
            const isEditing = editing?.id === item.id;

            if (isEditing && editing) {
              return (
                <EditForm
                  key={item.id}
                  editing={editing}
                  onChange={setEditing}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  isBusy={isBusy}
                />
              );
            }

            return (
              <div key={item.id} className="flex items-center gap-3 bg-card rounded-lg px-3 py-2.5 border border-border/50">
                <div className="text-center min-w-[46px]">
                  <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-0.5" />
                  <span className="text-caption font-mono text-muted-foreground">{item.time}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-foreground truncate">{item.title}</p>
                  {item.location && (
                    <p className="text-caption text-muted-foreground truncate">{item.location}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => startEdit(item)}
                    disabled={isBusy}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => handleDelete(item)}
                    disabled={isBusy}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* New item form */}
          {editing?.id === null && (
            <EditForm
              editing={editing}
              onChange={setEditing}
              onSave={saveEdit}
              onCancel={cancelEdit}
              isBusy={isBusy}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-3 border-t border-border flex gap-2">
          {hasItems && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seedItems.isPending || isBusy}
              className="gap-1.5 text-muted-foreground"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", seedItems.isPending && "animate-spin")} />
              重新匯入
            </Button>
          )}
          <Button
            className="flex-1 gap-1.5"
            onClick={startNew}
            disabled={editing !== null || isBusy}
          >
            <Plus className="w-4 h-4" />
            新增項目
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface EditFormProps {
  editing: EditingItem;
  onChange: (v: EditingItem) => void;
  onSave: () => void;
  onCancel: () => void;
  isBusy: boolean;
}

function EditForm({ editing, onChange, onSave, onCancel, isBusy }: EditFormProps) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2.5">
      <div className="flex gap-2 items-center">
        <Input
          value={editing.time}
          onChange={e => onChange({ ...editing, time: e.target.value })}
          placeholder="09:00"
          className="w-20 font-mono text-center text-sm h-9 flex-shrink-0"
          maxLength={5}
        />
        <div className="text-caption text-muted-foreground flex-shrink-0">類型</div>
      </div>

      {/* Type picker — horizontal scroll buttons, no Radix dropdown */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TYPE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const active = editing.type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...editing, type: opt.value as ScheduleItem["type"] })}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-caption whitespace-nowrap flex-shrink-0 border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              <Icon className="w-3 h-3" />
              {opt.label}
            </button>
          );
        })}
      </div>

      <Input
        value={editing.title}
        onChange={e => onChange({ ...editing, title: e.target.value })}
        placeholder="項目名稱（必填）"
        className="h-9 text-sm"
      />

      <Input
        value={editing.location}
        onChange={e => onChange({ ...editing, location: e.target.value })}
        placeholder="地點（選填）"
        className="h-9 text-sm"
      />

      <Input
        value={editing.notes}
        onChange={e => onChange({ ...editing, notes: e.target.value })}
        placeholder="備註（選填）"
        className="h-9 text-sm"
      />

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isBusy} className="flex-1 gap-1">
          <X className="w-3.5 h-3.5" />
          取消
        </Button>
        <Button size="sm" onClick={onSave} disabled={isBusy} className="flex-1 gap-1">
          <Check className="w-3.5 h-3.5" />
          儲存
        </Button>
      </div>
    </div>
  );
}
