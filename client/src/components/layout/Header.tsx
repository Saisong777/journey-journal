import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  className?: string;
  showBack?: boolean;
}

export function Header({
  title = "平安同行",
  className,
  showBack = false,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn(
      "flex-shrink-0 border-b border-border bg-card/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur transform-gpu",
      className
    )}>
      <div className="relative mx-auto flex min-h-14 max-w-lg items-center px-4 py-2.5">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 -ml-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-1 active:bg-muted"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <h1 className="flex-1 truncate px-12 text-center text-title font-semibold text-foreground">{title}</h1>
      </div>
    </header>
  );
}
