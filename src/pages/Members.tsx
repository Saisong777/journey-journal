import { useState } from "react";
import { Search, Users, Filter, Phone } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { MemberCard, MemberData } from "@/components/members/MemberCard";
import { MemberDetailSheet } from "@/components/members/MemberDetailSheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Demo data
const demoMembers: MemberData[] = [
  {
    id: "1",
    name: "陳牧師",
    role: "guide",
    group: "領隊團隊",
    phone: "0912-345-678",
    email: "pastor.chen@example.com",
    roomNumber: "101",
    notes: "團隊總召集人，負責靈修帶領",
  },
  {
    id: "2",
    name: "王大明",
    role: "leader",
    group: "第一組",
    phone: "0923-456-789",
    email: "wang.dm@example.com",
    roomNumber: "201",
    emergencyContact: "王太太 0933-111-222",
  },
  {
    id: "3",
    name: "李小華",
    role: "leader",
    group: "第二組",
    phone: "0934-567-890",
    roomNumber: "202",
    emergencyContact: "李先生 0944-222-333",
  },
  {
    id: "4",
    name: "張美玲",
    role: "leader",
    group: "第三組",
    phone: "0945-678-901",
    email: "zhang.ml@example.com",
    roomNumber: "301",
  },
  {
    id: "5",
    name: "陳志偉",
    role: "leader",
    group: "第四組",
    phone: "0956-789-012",
    roomNumber: "302",
  },
  {
    id: "6",
    name: "林雅婷",
    role: "member",
    group: "第一組",
    phone: "0967-890-123",
    roomNumber: "203",
    notes: "素食者",
  },
  {
    id: "7",
    name: "黃建國",
    role: "member",
    group: "第一組",
    phone: "0978-901-234",
    roomNumber: "204",
    emergencyContact: "黃太太 0988-333-444",
  },
  {
    id: "8",
    name: "吳淑芬",
    role: "member",
    group: "第二組",
    phone: "0989-012-345",
    roomNumber: "205",
  },
  {
    id: "9",
    name: "劉明德",
    role: "member",
    group: "第二組",
    phone: "0910-123-456",
    roomNumber: "206",
    notes: "需要輪椅協助",
  },
  {
    id: "10",
    name: "許雅琪",
    role: "member",
    group: "第三組",
    phone: "0921-234-567",
    roomNumber: "303",
  },
];

type FilterType = "all" | "leader" | "guide";

export default function Members() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredMembers = demoMembers.filter((member) => {
    const matchesSearch =
      member.name.includes(searchQuery) ||
      member.group.includes(searchQuery) ||
      member.phone.includes(searchQuery);
    
    const matchesFilter =
      filter === "all" ||
      (filter === "leader" && (member.role === "leader" || member.role === "guide")) ||
      (filter === "guide" && member.role === "guide");

    return matchesSearch && matchesFilter;
  });

  const handleMemberClick = (member: MemberData) => {
    setSelectedMember(member);
    setIsDetailOpen(true);
  };

  // Group members by their group
  const groupedMembers = filteredMembers.reduce((acc, member) => {
    if (!acc[member.group]) {
      acc[member.group] = [];
    }
    acc[member.group].push(member);
    return acc;
  }, {} as Record<string, MemberData[]>);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="團員管理" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Stats */}
        <section className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-display text-primary">{demoMembers.length}</p>
              <p className="text-caption text-muted-foreground">總人數</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-display text-secondary">4</p>
              <p className="text-caption text-muted-foreground">小組數</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <p className="text-display text-terracotta">5</p>
              <p className="text-caption text-muted-foreground">組長/領隊</p>
            </div>
          </div>
        </section>

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

        {/* Member List by Group */}
        <section className="space-y-6">
          {Object.entries(groupedMembers).map(([group, members]) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-body font-semibold">{group}</h3>
                <span className="text-caption text-muted-foreground">
                  ({members.length} 人)
                </span>
              </div>
              
              <div className="space-y-3">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onClick={() => handleMemberClick(member)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-body">找不到符合的團員</p>
            </div>
          )}
        </section>

        {/* Quick Dial */}
        <section className="bg-terracotta/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-body font-semibold text-terracotta">緊急聯絡</p>
              <p className="text-caption text-muted-foreground">
                領隊陳牧師：0912-345-678
              </p>
            </div>
            <a
              href="tel:0912-345-678"
              className="px-4 py-2 bg-terracotta text-white rounded-lg text-caption font-medium"
            >
              撥打
            </a>
          </div>
        </section>
      </main>

      <MemberDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        member={selectedMember}
      />

      <BottomNav />
    </div>
  );
}
