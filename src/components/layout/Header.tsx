import { Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  showMenu?: boolean;
  showNotification?: boolean;
}

export function Header({
  title = "朝聖之旅",
  showMenu = true,
  showNotification = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        {showMenu ? (
          <button className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors touch-target">
            <Menu className="w-6 h-6 text-foreground" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <h1 className="text-title text-foreground">{title}</h1>

        {showNotification ? (
          <button className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors touch-target relative">
            <Bell className="w-6 h-6 text-foreground" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-terracotta rounded-full" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>
    </header>
  );
}
