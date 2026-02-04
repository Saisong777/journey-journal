import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "primary" | "secondary" | "olive" | "terracotta";
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  primary: "gradient-warm text-primary-foreground",
  secondary: "bg-card hover:bg-muted border border-border",
  olive: "gradient-olive text-secondary-foreground",
  terracotta: "bg-terracotta text-primary-foreground",
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
        variant === "secondary" ? "bg-primary/10" : "bg-white/20"
      )}>
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className={cn(
          "text-xs",
          variant === "secondary" ? "text-muted-foreground" : "opacity-90"
        )}>
          {description}
        </p>
      </div>
    </button>
  );
}
