import { Home, Compass, MapPin, Users, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "首頁", path: "/" },
  { icon: Compass, label: "旅程", path: "/daily-journey" },
  { icon: MapPin, label: "定位", path: "/location" },
  { icon: Users, label: "團員", path: "/members" },
  { icon: Settings, label: "設定", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated z-50 transform-gpu" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all",
                "touch-target focus:outline-none focus:ring-2 focus:ring-primary",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("w-6 h-6", isActive && "stroke-[2.5]")}
                strokeWidth={1.5}
              />
              <span className="text-caption font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
