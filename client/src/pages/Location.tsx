import { useState } from "react";
import { Users, MapPin, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { MemberLocationCard, MemberLocationData } from "@/components/location/MemberLocationCard";
import { GroupList } from "@/components/location/GroupList";
import { MapPlaceholder } from "@/components/location/MapPlaceholder";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Demo data
const demoMembers: MemberLocationData[] = [
  {
    id: "1",
    name: "王大明",
    location: "聖墓教堂附近",
    lastUpdate: "剛剛",
    distance: "50m",
    status: "online",
    group: "第一組",
  },
  {
    id: "2",
    name: "李小華",
    location: "哭牆廣場",
    lastUpdate: "2分鐘前",
    distance: "120m",
    status: "moving",
    group: "第二組",
  },
  {
    id: "3",
    name: "張美玲",
    location: "大馬士革門",
    lastUpdate: "5分鐘前",
    distance: "300m",
    status: "online",
    group: "第一組",
  },
  {
    id: "4",
    name: "陳志偉",
    location: "橄欖山觀景台",
    lastUpdate: "10分鐘前",
    distance: "1.2km",
    status: "offline",
    group: "第三組",
  },
  {
    id: "5",
    name: "林雅婷",
    location: "聖殿山入口",
    lastUpdate: "剛剛",
    distance: "80m",
    status: "online",
    group: "第二組",
  },
];

type ViewMode = "map" | "list" | "groups";

export default function Location() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredMembers = demoMembers.filter(
    (member) =>
      member.name.includes(searchQuery) ||
      member.location.includes(searchQuery) ||
      member.group?.includes(searchQuery)
  );

  const onlineCount = demoMembers.filter((m) => m.status === "online").length;
  const offlineCount = demoMembers.filter((m) => m.status === "offline").length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="團員定位" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Status Bar */}
        <section className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-body font-semibold">團員狀態</h2>
            <button
              onClick={handleRefresh}
              className={cn(
                "p-2 rounded-lg hover:bg-muted transition-colors touch-target",
                isRefreshing && "animate-spin"
              )}
            >
              <RefreshCw className="w-5 h-5 text-primary" />
            </button>
          </div>
          <div className="flex items-center gap-6 text-caption">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>在線 {onlineCount} 人</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-terracotta" />
              <span>移動中 {demoMembers.filter((m) => m.status === "moving").length} 人</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-stone" />
              <span>離線 {offlineCount} 人</span>
            </div>
          </div>

          {offlineCount > 0 && (
            <div className="mt-3 p-3 bg-terracotta/10 rounded-lg flex items-center gap-2 text-terracotta">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-caption">{offlineCount} 位團員暫時離線，請留意</span>
            </div>
          )}
        </section>

        {/* View Toggle */}
        <section className="flex gap-2">
          {[
            { key: "map", label: "地圖", icon: MapPin },
            { key: "list", label: "列表", icon: Users },
            { key: "groups", label: "分組", icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as ViewMode)}
              className={cn(
                "flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all touch-target",
                viewMode === tab.key
                  ? "gradient-warm text-primary-foreground shadow-card"
                  : "bg-card text-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-body font-medium">{tab.label}</span>
            </button>
          ))}
        </section>

        {/* Map View */}
        {viewMode === "map" && (
          <section className="space-y-4">
            <MapPlaceholder memberCount={onlineCount} />
            
            <div className="space-y-3">
              <h3 className="text-body font-semibold">附近團員</h3>
              {filteredMembers.slice(0, 3).map((member) => (
                <MemberLocationCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <section className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋團員姓名或位置..."
                className="pl-10 h-12 text-body"
              />
            </div>

            {/* Member List */}
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <MemberLocationCard key={member.id} member={member} />
              ))}

              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-body">找不到符合的團員</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Groups View */}
        {viewMode === "groups" && (
          <section className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="text-body font-semibold text-primary mb-1">小組分享系統</h3>
              <p className="text-caption text-muted-foreground">
                點擊小組可查看該組成員位置，方便分組行動時互相聯繫
              </p>
            </div>
            <GroupList />
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
