import { Users, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Group } from "@shared/schema";

const GROUP_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-terracotta",
  "bg-stone",
];

interface GroupListProps {
  onSelectGroup?: (groupId: string) => void;
}

export function GroupList({ onSelectGroup }: GroupListProps) {
  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="empty-groups">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-body">尚未建立分組</p>
        <p className="text-caption mt-1">管理員可在後台建立小組</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="group-list">
      {groups.map((group, index) => (
        <button
          key={group.id}
          onClick={() => onSelectGroup?.(group.id)}
          data-testid={`group-card-${group.id}`}
          className={cn(
            "w-full bg-card rounded-lg shadow-soft p-4",
            "flex items-center gap-4 text-left",
            "transition-all hover:shadow-card active:scale-[0.99]",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
        >
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", GROUP_COLORS[index % GROUP_COLORS.length])}>
            <Users className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-body font-semibold">{group.name}</h3>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
