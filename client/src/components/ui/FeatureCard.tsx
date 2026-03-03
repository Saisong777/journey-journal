import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "primary" | "secondary" | "olive" | "terracotta" | "warm-light" | "olive-light";
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  primary: "gradient-warm text-primary-foreground",
  secondary: "bg-card hover:bg-muted border border-border",
  olive: "gradient-olive text-secondary-foreground",
  terracotta: "bg-terracotta text-primary-foreground",
  "warm-light": "bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 border border-amber-200/60 dark:border-amber-700/40",
  "olive-light": "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border border-emerald-200/60 dark:border-emerald-700/40",
};

const iconBgStyles: Record<string, string> = {
  primary: "bg-white/20",
  secondary: "bg-primary/10",
  olive: "bg-white/20",
  terracotta: "bg-white/20",
  "warm-light": "bg-amber-500/15 dark:bg-amber-400/20",
  "olive-light": "bg-emerald-500/15 dark:bg-emerald-400/20",
};

const descStyles: Record<string, string> = {
  primary: "opacity-90",
  secondary: "text-muted-foreground",
  olive: "opacity-90",
  terracotta: "opacity-90",
  "warm-light": "text-amber-700/70 dark:text-amber-300/70",
  "olive-light": "text-emerald-700/70 dark:text-emerald-300/70",
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  variant = "secondary",
  onClick,
  className,
}: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg transition-all duration-300",
        "flex flex-col items-center text-center gap-2",
        "touch-target shadow-card hover:shadow-elevated",
        "active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        iconBgStyles[variant] || "bg-primary/10"
      )}>
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className={cn(
          "text-xs",
          descStyles[variant] || "text-muted-foreground"
        )}>
          {description}
        </p>
      </div>
    </button>
  );
}
