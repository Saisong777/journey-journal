import { Home, Compass, Map, Users, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "首頁", path: "/" },
  { icon: Map, label: "地圖", path: "/location" },
  { icon: Compass, label: "旅程", path: "/daily-journey" },
  { icon: Users, label: "團員", path: "/members" },
  { icon: Settings, label: "設定", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.label}
              data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center h-14 flex-1 transition-colors",
                "focus:outline-none touch-target tap-highlight-transparent",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("w-5 h-5", isActive && "stroke-[2.5]")}
                strokeWidth={1.5}
              />
              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight",
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
