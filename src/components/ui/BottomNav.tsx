import { Home, BookOpen, MapPin, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const navItems: NavItem[] = [
  { icon: Home, label: "首頁", active: true },
  { icon: BookOpen, label: "日誌" },
  { icon: MapPin, label: "定位" },
  { icon: Users, label: "團員" },
  { icon: Settings, label: "設定" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all",
              "touch-target focus:outline-none focus:ring-2 focus:ring-primary",
              item.active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon
              className={cn("w-6 h-6", item.active && "stroke-[2.5]")}
              strokeWidth={1.5}
            />
            <span className="text-caption font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  );
}
