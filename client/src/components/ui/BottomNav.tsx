import { Home, Compass, MapPin, Users, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe pb-4 px-4 pointer-events-none">
      <nav
        className="bg-card border border-border/50 shadow-sm rounded-full flex-shrink-0 pointer-events-auto flex items-center p-1.5"
      >
        <div className="flex items-center justify-between w-full gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.label}
                data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center h-14 min-w-[3.5rem] px-2 rounded-full transition-colors",
                  "focus:outline-none touch-target tap-highlight-transparent",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-activeStyle"
                    className="absolute inset-0 bg-primary rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <item.icon
                  className={cn("w-6 h-6 relative z-10", isActive && "stroke-[2.5]")}
                  strokeWidth={1.5}
                />
                <span className="text-[10px] font-medium mt-1 relative z-10 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
