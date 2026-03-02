import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Heart,
  Shirt,
  Smartphone,
  Droplets,
  Package,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistCategory {
  key: string;
  label: string;
  icon: typeof FileText;
  color: string;
  items: string[];
}

const CHECKLIST_DATA: ChecklistCategory[] = [
  {
    key: "documents",
    label: "重要證件",
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
    items: ["護照", "簽證", "身分證", "機票預訂單", "酒店預定單", "信用卡", "錢包"],
  },
  {
    key: "medical",
    label: "醫療/保健",
    icon: Heart,
    color: "text-red-500 bg-red-50",
    items: ["感冒藥", "消炎藥", "胃腸藥", "止痛藥", "創口貼", "其他個人藥品", "防曬霜", "潤唇膏", "暈車藥/暈船藥"],
  },
  {
    key: "clothing",
    label: "衣物",
    icon: Shirt,
    color: "text-purple-600 bg-purple-50",
    items: ["游泳用品", "衣服", "褲子/裙子", "內衣褲", "拖鞋", "襪子"],
  },
  {
    key: "electronics",
    label: "電子設備",
    icon: Smartphone,
    color: "text-green-600 bg-green-50",
    items: ["手機", "手機充電器", "電腦", "電腦充電線", "IPAD", "IPAD充電線", "轉換插頭", "備用電源", "延長線/拖線板"],
  },
  {
    key: "toiletries",
    label: "洗漱用品",
    icon: Droplets,
    color: "text-cyan-600 bg-cyan-50",
    items: ["牙線/漱口水", "卸妝用品", "牙膏牙刷", "剃鬚刀", "其他個人用品"],
  },
  {
    key: "other",
    label: "其他",
    icon: Package,
    color: "text-amber-600 bg-amber-50",
    items: ["雨傘", "指甲刀", "彩妝用品", "帽子", "圍巾/絲巾", "手套", "防風外套"],
  },
];

const STORAGE_KEY = "trip-checklist-state";

export function TripChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));
  }, [checkedItems]);

  const totalItems = useMemo(
    () => CHECKLIST_DATA.reduce((sum, cat) => sum + cat.items.length, 0),
    []
  );

  const checkedCount = useMemo(
    () => Object.values(checkedItems).filter(Boolean).length,
    [checkedItems]
  );

  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const toggleItem = (categoryKey: string, item: string) => {
    const key = `${categoryKey}:${item}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  const getCategoryProgress = (category: ChecklistCategory) => {
    const checked = category.items.filter(
      (item) => checkedItems[`${category.key}:${item}`]
    ).length;
    return { checked, total: category.items.length };
  };

  const clearAll = () => {
    setCheckedItems({});
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-title font-semibold">行前準備進度</h3>
            <p className="text-caption text-muted-foreground">
              {checkedCount}/{totalItems} 已完成
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary" data-testid="text-checklist-progress">
              {progressPercent}%
            </span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
        {checkedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1 h-8"
            onClick={clearAll}
            data-testid="button-clear-checklist"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            清除全部
          </Button>
        )}
      </div>

      {CHECKLIST_DATA.map((category) => {
        const { checked, total } = getCategoryProgress(category);
        const isCollapsed = collapsedCategories[category.key];
        const allDone = checked === total;
        const Icon = category.icon;
        const colorParts = category.color.split(" ");

        return (
          <div
            key={category.key}
            className="bg-card rounded-lg shadow-card overflow-hidden"
            data-testid={`section-checklist-${category.key}`}
          >
            <button
              className="w-full flex items-center gap-3 p-4 text-left"
              onClick={() => toggleCategory(category.key)}
              data-testid={`button-toggle-${category.key}`}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colorParts[1])}>
                <Icon className={cn("w-5 h-5", colorParts[0])} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-body font-semibold">{category.label}</h4>
                <p className={cn("text-caption", allDone ? "text-green-600" : "text-muted-foreground")}>
                  {checked}/{total} {allDone ? "✓ 已完成" : ""}
                </p>
              </div>
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {!isCollapsed && (
              <div className="px-4 pb-3 space-y-1">
                {category.items.map((item) => {
                  const itemKey = `${category.key}:${item}`;
                  const isChecked = checkedItems[itemKey] || false;
                  return (
                    <label
                      key={item}
                      className={cn(
                        "flex items-center gap-3 py-2.5 px-3 rounded-md cursor-pointer transition-colors",
                        isChecked
                          ? "bg-green-50 dark:bg-green-950/20"
                          : "hover:bg-muted/50"
                      )}
                      data-testid={`item-${category.key}-${item}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(category.key, item)}
                      />
                      <span
                        className={cn(
                          "text-body transition-all",
                          isChecked && "line-through text-muted-foreground"
                        )}
                      >
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
