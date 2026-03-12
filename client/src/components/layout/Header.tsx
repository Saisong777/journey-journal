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
      "bg-card border-b border-border flex-shrink-0 transform-gpu",
      className
    )}>
      <div className="flex items-center px-4 py-3 max-w-lg mx-auto relative">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 p-1 -ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <h1 className="text-title text-foreground font-semibold flex-1 text-center">{title}</h1>
      </div>
    </header>
  );
}
