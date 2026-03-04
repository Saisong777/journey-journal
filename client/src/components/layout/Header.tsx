import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({
  title = "朝聖之旅",
  className,
}: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border transform-gpu",
      className
    )}>
      <div className="flex items-center justify-center px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-title text-foreground font-semibold">{title}</h1>
      </div>
    </header>
  );
}
