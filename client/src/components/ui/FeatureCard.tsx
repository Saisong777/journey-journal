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
  primary: "gradient-warm text-primary-foreground border-white/20",
  secondary: "bg-card/80 backdrop-blur-md hover:bg-muted border border-border",
  olive: "gradient-olive text-secondary-foreground border-white/20",
  terracotta: "bg-terracotta text-primary-foreground border-white/20",
  "warm-light": "bg-amber-50/80 backdrop-blur-sm dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 border border-amber-200/60 dark:border-amber-700/40",
  "olive-light": "bg-emerald-50/80 backdrop-blur-sm dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border border-emerald-200/60 dark:border-emerald-700/40",
};

const iconBgStyles: Record<string, string> = {
  primary: "bg-white/25 shadow-sm",
  secondary: "bg-primary/10",
  olive: "bg-white/25 shadow-sm",
  terracotta: "bg-white/25 shadow-sm",
  "warm-light": "bg-amber-500/15 dark:bg-amber-400/20",
  "olive-light": "bg-emerald-500/15 dark:bg-emerald-400/20",
};

const descStyles: Record<string, string> = {
  primary: "opacity-95 font-medium",
  secondary: "text-muted-foreground",
  olive: "opacity-95 font-medium",
  terracotta: "opacity-95 font-medium",
  "warm-light": "text-amber-700/80 dark:text-amber-300/80",
  "olive-light": "text-emerald-700/80 dark:text-emerald-300/80",
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
        "w-full p-4 rounded-xl transition-all duration-300",
        "flex flex-col items-center text-center gap-2.5",
        "touch-target shadow-card hover:shadow-elevated",
        "active:scale-95 hover:-translate-y-1",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
        iconBgStyles[variant] || "bg-primary/10"
      )}>
        <Icon className="w-6 h-6" strokeWidth={1.5} />
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
