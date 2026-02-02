import { Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  leaderName: string;
}

const groups: Group[] = [
  { id: "1", name: "第一組", color: "bg-primary", memberCount: 7, leaderName: "王大明" },
  { id: "2", name: "第二組", color: "bg-secondary", memberCount: 7, leaderName: "李小華" },
  { id: "3", name: "第三組", color: "bg-terracotta", memberCount: 7, leaderName: "張美玲" },
  { id: "4", name: "第四組", color: "bg-stone", memberCount: 7, leaderName: "陳志偉" },
];

interface GroupListProps {
  onSelectGroup?: (groupId: string) => void;
}

export function GroupList({ onSelectGroup }: GroupListProps) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onSelectGroup?.(group.id)}
          className={cn(
            "w-full bg-card rounded-lg shadow-soft p-4",
            "flex items-center gap-4 text-left",
            "transition-all hover:shadow-card active:scale-[0.99]",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          )}
        >
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", group.color)}>
            <Users className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-body font-semibold">{group.name}</h3>
            <p className="text-caption text-muted-foreground">
              組長：{group.leaderName} · {group.memberCount} 人
            </p>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
