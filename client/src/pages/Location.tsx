import { useState, useEffect, useRef } from "react";
import { Users, MapPin, Search, RefreshCw, AlertTriangle, Navigation } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { MemberLocationCard, MemberLocationData } from "@/components/location/MemberLocationCard";
import { GroupList } from "@/components/location/GroupList";
import { TeamMap } from "@/components/location/TeamMap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocations, useUpdateLocation } from "@/hooks/useLocations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "map" | "list" | "groups";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "剛剛";
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小時前`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} 天前`;
}

export default function Location() {
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);
  const autoLocatedRef = useRef(false);
  
  const { data: locations = [], refetch, isLoading } = useLocations();
  const updateLocation = useUpdateLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (autoLocatedRef.current || !navigator.geolocation) return;
    autoLocatedRef.current = true;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyPosition([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        setMyPosition([31.7683, 35.2137]);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  const membersWithLocation: MemberLocationData[] = locations.map((loc) => ({
    id: loc.id,
    name: loc.profile?.name || "未知成員",
    location: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
    lastUpdate: formatTimeAgo(loc.updatedAt),
    distance: "",
    status: isOnline(loc.updatedAt) ? "online" : "offline",
    group: undefined,
  }));

  function isOnline(updatedAt: string): boolean {
    const date = new Date(updatedAt);
    const now = new Date();
    const diffMins = (now.getTime() - date.getTime()) / 60000;
    return diffMins < 10;
  }

  const filteredMembers = membersWithLocation.filter(
    (member) =>
      member.name.includes(searchQuery) ||
      member.location.includes(searchQuery)
  );

  const onlineCount = membersWithLocation.filter((m) => m.status === "online").length;
  const offlineCount = membersWithLocation.filter((m) => m.status === "offline").length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleShareLocation = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "不支援定位",
        description: "您的瀏覽器不支援定位功能",
        variant: "destructive",
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updateLocation.mutateAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast({
            title: "位置已更新",
            description: "您的位置已成功分享給團隊",
          });
        } catch (error) {
          toast({
            title: "更新失敗",
            description: "無法更新您的位置",
            variant: "destructive",
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        let message = "無法取得您的位置";
        if (error.code === error.PERMISSION_DENIED) {
          message = "請允許存取您的位置";
        }
        toast({
          title: "定位失敗",
          description: message,
          variant: "destructive",
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const mapCenter: [number, number] = myPosition 
    || (locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : [31.7683, 35.2137]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="團員定位" />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        <section className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-body font-semibold">團員狀態</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareLocation}
                disabled={isLocating}
                data-testid="button-share-location"
              >
                <Navigation className={cn("w-4 h-4 mr-1", isLocating && "animate-pulse")} />
                {isLocating ? "定位中..." : "分享位置"}
              </Button>
              <button
                onClick={handleRefresh}
                className={cn(
                  "p-2 rounded-lg hover:bg-muted transition-colors touch-target",
                  isRefreshing && "animate-spin"
                )}
                data-testid="button-refresh-locations"
              >
                <RefreshCw className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-caption">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>在線 {onlineCount} 人</span>
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
              data-testid={`button-view-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-body font-medium">{tab.label}</span>
            </button>
          ))}
        </section>

        {viewMode === "map" && (
          <section className="space-y-4">
            {isLoading && !myPosition ? (
              <div className="w-full h-72 rounded-lg bg-muted flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <TeamMap 
                  locations={locations} 
                  myUserId={user?.id}
                  center={mapCenter}
                  myPosition={myPosition}
                />
                {locations.length === 0 && (
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-caption text-primary">點擊「分享位置」讓團員看到您的位置</p>
                  </div>
                )}
              </>
            )}
            
            {filteredMembers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-body font-semibold">團員位置</h3>
                {filteredMembers.slice(0, 5).map((member) => (
                  <MemberLocationCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </section>
        )}

        {viewMode === "list" && (
          <section className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋團員姓名..."
                className="pl-10 h-12 text-body"
                data-testid="input-search-members"
              />
            </div>

            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <MemberLocationCard key={member.id} member={member} />
              ))}

              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-body">
                    {locations.length === 0 ? "尚無團員位置資料" : "找不到符合的團員"}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

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
