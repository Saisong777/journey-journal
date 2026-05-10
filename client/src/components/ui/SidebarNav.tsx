import { Home, BookOpen, Map, Users, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
    icon: typeof Home;
    label: string;
    path: string;
}

const navItems: NavItem[] = [
    { icon: Home, label: "今日", path: "/" },
    { icon: BookOpen, label: "記錄", path: "/daily-journey" },
    { icon: Map, label: "地圖", path: "/location" },
    { icon: Users, label: "通訊錄", path: "/members" },
    { icon: Menu, label: "更多", path: "/settings" },
];

export function SidebarNav() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/80 backdrop-blur-md shadow-elevated z-10">
            <div className="p-6">
                <h1 className="text-title font-semibold text-primary">平安同行</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            data-testid={`sidebar-nav-${item.path.replace('/', '') || 'home'}`}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-primary",
                                "hover:-translate-y-0.5 hover:shadow-sm active:scale-95",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <item.icon
                                className={cn("w-5 h-5", isActive && "stroke-[2.5]")}
                                strokeWidth={2}
                            />
                            <span className="font-medium text-body">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-border/50 text-center">
                <p className="text-caption text-muted-foreground">與神同行的旅程</p>
            </div>
        </aside>
    );
}
