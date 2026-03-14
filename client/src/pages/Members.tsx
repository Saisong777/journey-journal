import { useState, useMemo } from "react";
import { Search, Users, Phone, Loader2, ChevronDown } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { MemberCard, MemberData } from "@/components/members/MemberCard";
import { MemberDetailSheet } from "@/components/members/MemberDetailSheet";
import { Input } from "@/components/ui/input";
import { useMembers, useGroups } from "@/hooks/useMembers";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import type { Group } from "@shared/schema";

type FilterType = "all" | "leader" | "guide";

const GROUP_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-terracotta",
  "bg-stone",
];

export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [groupSectionOpen, setGroupSectionOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: membersData, isLoading } = useMembers();
  const { data: groupsData } = useGroups();

  const groups: Group[] = groupsData || [];

  // Transform database members to component format
  const members: MemberData[] = useMemo(() => {
    return (membersData || []).map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.avatarUrl ? transformPhotoUrl(member.avatarUrl) : undefined,
      role: (member.role === "admin" ? "guide" : member.role) as MemberData["role"],
      group: member.group?.name || "未分組",
      phone: member.phone || "",
      email: member.email || undefined,
      birthday: member.birthday || undefined,
      roomNumber: undefined,
      emergencyContact: member.emergencyContactName
        ? `${member.emergencyContactName} ${member.emergencyContactPhone || ""}`
        : undefined,
      notes: member.dietaryRestrictions || member.medicalNotes || undefined,
    }));
  }, [membersData]);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.includes(searchQuery) ||
      member.group.includes(searchQuery) ||
      (member.phone && member.phone.includes(searchQuery));

    const matchesFilter =
      filter === "all" ||
      (filter === "leader" &&
        (member.role === "leader" || member.role === "guide")) ||
      (filter === "guide" && member.role === "guide");

    return matchesSearch && matchesFilter;
  });

  const handleMemberClick = (member: MemberData) => {
    setSelectedMember(member);
    setIsDetailOpen(true);
  };

  // Sort members: leader/guide first, then by birthday (older first)
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    // Group by group name first (to keep groups together)
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    // Within same group: leader/guide first
    const rolePriority: Record<string, number> = { guide: 0, leader: 1, member: 2 };
    const aPriority = rolePriority[a.role] ?? 2;
    const bPriority = rolePriority[b.role] ?? 2;
    if (aPriority !== bPriority) return aPriority - bPriority;
    // Then by birthday ascending (older = earlier date first)
    if (a.birthday && b.birthday) return a.birthday.localeCompare(b.birthday);
    if (a.birthday) return -1;
    if (b.birthday) return 1;
    return 0;
  });

  // Group sorted members (order is preserved from sort)
  const groupedMembers = sortedMembers.reduce(
    (acc, member) => {
      if (!acc[member.group]) {
        acc[member.group] = [];
      }
      acc[member.group].push(member);
      return acc;
    },
    {} as Record<string, MemberData[]>
  );

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  // Find guide for emergency contact
  const guide = members.find((m) => m.role === "guide");

  // Calculate stats
  const uniqueGroups = new Set(members.map((m) => m.group)).size;
  const leadersCount = members.filter(
    (m) => m.role === "leader" || m.role === "guide"
  ).length;

  // Count members per group for group list display
  const memberCountByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of members) {
      counts[m.group] = (counts[m.group] || 0) + 1;
    }
    return counts;
  }, [members]);

  return (
    <PageLayout title="團員管理">
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Stats */}
        <section className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-display text-primary">{members.length}</p>
              <p className="text-caption text-muted-foreground">總人數</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-display text-secondary">{uniqueGroups}</p>
              <p className="text-caption text-muted-foreground">小組數</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-display text-terracotta">{leadersCount}</p>
              <p className="text-caption text-muted-foreground">組長/領隊</p>
            </div>
          </div>
        </section>

        {/* Group Management - Collapsible */}
        {groups.length > 0 && (
          <Collapsible open={groupSectionOpen} onOpenChange={setGroupSectionOpen}>
            <section className="bg-card rounded-lg shadow-card overflow-hidden">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-body font-semibold">小組管理</h3>
                  <span className="text-caption text-muted-foreground">({groups.length} 組)</span>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  groupSectionOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-2">
                  {groups.map((group, index) => (
                    <div
                      key={group.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        GROUP_COLORS[index % GROUP_COLORS.length]
                      )}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium truncate">{group.name}</p>
                      </div>
                      <span className="text-caption text-muted-foreground flex-shrink-0">
                        {memberCountByGroup[group.name] || 0} 人
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </section>
          </Collapsible>
        )}

        {/* Search & Filter */}
        <section className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋團員姓名、組別或電話..."
              className="pl-10 h-12 text-body"
            />
          </div>

          <div className="flex gap-2">
            {[
              { key: "all", label: "全部" },
              { key: "leader", label: "組長/領隊" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as FilterType)}
                className={cn(
                  "px-4 py-2 rounded-full text-caption transition-all touch-target",
                  filter === item.key
                    ? "gradient-warm text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* Member List by Group - Collapsible */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(groupedMembers).length > 0 ? (
            Object.entries(groupedMembers).map(([group, groupMembers]) => (
              <Collapsible
                key={group}
                open={!collapsedGroups.has(group)}
                onOpenChange={() => toggleGroupCollapse(group)}
              >
                <div className="space-y-3">
                  <CollapsibleTrigger className="w-full flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <h3 className="text-body font-semibold">{group}</h3>
                      <span className="text-caption text-muted-foreground">
                        ({groupMembers.length} 人)
                      </span>
                    </div>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      !collapsedGroups.has(group) && "rotate-180"
                    )} />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="space-y-3">
                      {groupMembers.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          onClick={() => handleMemberClick(member)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-body">
                {members.length === 0 ? "尚未有團員資料" : "找不到符合的團員"}
              </p>
            </div>
          )}
        </section>

        {/* Quick Dial */}
        {guide && guide.phone && (
          <section className="bg-terracotta/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-body font-semibold text-terracotta">
                  緊急聯絡
                </p>
                <p className="text-caption text-muted-foreground">
                  領隊{guide.name}：{guide.phone}
                </p>
              </div>
              <a
                href={`tel:${guide.phone}`}
                className="px-4 py-2 bg-terracotta text-white rounded-lg text-caption font-medium"
              >
                撥打
              </a>
            </div>
          </section>
        )}
      </div>

      <MemberDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        member={selectedMember}
      />
    </PageLayout>
  );
}
