import { Home, BookOpen, Map, Users, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  matches?: string[];
}

const navItems: NavItem[] = [
  { icon: Home, label: "今日", path: "/" },
  { icon: BookOpen, label: "記錄", path: "/daily-journey" },
  { icon: Map, label: "地圖", path: "/location" },
  { icon: Users, label: "通訊錄", path: "/members" },
  {
    icon: Menu,
    label: "更多",
    path: "/settings",
    matches: ["/settings", "/roll-call", "/summary", "/tools", "/attractions", "/help", "/bible-library", "/about", "/privacy"],
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_24px_-18px_hsl(var(--foreground)/0.55)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-lg items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = item.path === "/"
            ? location.pathname === "/"
            : location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`) ||
              item.matches?.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

          return (
            <button
              key={item.label}
              type="button"
              data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "tap-highlight-transparent relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-colors",
                "touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-1.5 h-1 w-7 rounded-full bg-primary/80" />
              )}
              <item.icon
                className={cn("mt-1 h-5 w-5", isActive && "stroke-[2.5]")}
                strokeWidth={1.5}
              />
              <span className={cn(
                "w-full truncate text-center text-[11px] leading-tight",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
