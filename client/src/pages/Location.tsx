import { useState, useEffect, useRef } from "react";
import { Users, MapPin, Search, RefreshCw, AlertTriangle, Navigation } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
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

  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  useEffect(() => {
    if (autoLocatedRef.current) return;
    autoLocatedRef.current = true;

    if (!navigator.geolocation) {
      setLocationError("您的瀏覽器不支援定位功能");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyPosition([position.coords.latitude, position.coords.longitude]);
        setIsGettingLocation(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("請允許存取您的位置以使用地圖功能");
        } else {
          setLocationError("無法取得您的位置，請確認定位功能已開啟");
        }
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 } // M2: Default low accuracy
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
    latitude: loc.latitude,
    longitude: loc.longitude,
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
        description: "您的瀏覽器不支援定位功能，請使用新分頁開啟此頁面",
        variant: "destructive",
      });
      setIsLocating(false);
      return;
    }

    let didRespond = false;
    const fallbackTimer = setTimeout(() => {
      if (!didRespond) {
        didRespond = true;
        setIsLocating(false);
        toast({
          title: "定位逾時",
          description: "無法取得定位，請在新分頁中開啟此頁面再試一次",
          variant: "destructive",
        });
      }
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (didRespond) return;
        didRespond = true;
        clearTimeout(fallbackTimer);
        try {
          await updateLocation.mutateAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setMyPosition([position.coords.latitude, position.coords.longitude]);
          toast({
            title: "位置已更新",
            description: "您的位置已成功分享給團隊",
          });
        } catch (error) {
          console.error("Location update failed:", error);
          toast({
            title: "更新失敗",
            description: "無法更新您的位置，請稍後再試",
            variant: "destructive",
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        if (didRespond) return;
        didRespond = true;
        clearTimeout(fallbackTimer);
        console.error("Geolocation error:", error.code, error.message);
        let message = "無法取得您的位置";
        if (error.code === error.PERMISSION_DENIED) {
          message = "定位權限被拒絕，請在瀏覽器設定中允許定位，或在新分頁中開啟此頁面";
        } else if (error.code === error.TIMEOUT) {
          message = "定位逾時，請確認定位功能已開啟後再試一次";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "目前無法取得定位資訊，請稍後再試";
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

  const mapCenter: [number, number] | null = myPosition
    || (locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : null);

  return (
    <PageLayout title="團員定位">
      <div className="px-4 md:px-8 py-6 pb-32 container max-w-5xl mx-auto space-y-8 animate-fade-in overflow-x-hidden">
        <section className="bg-card/80 backdrop-blur-md rounded-xl shadow-card p-5 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title font-semibold">團員狀態</h2>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={handleShareLocation}
                disabled={isLocating}
                className="rounded-full px-4 gradient-warm border-none shadow-sm hover:translate-y-px hover:shadow-card transition-all"
                data-testid="button-share-location"
              >
                <Navigation className={cn("w-4 h-4 mr-1.5", isLocating && "animate-pulse")} />
                {isLocating ? "定位中..." : "分享位置"}
              </Button>
              <button
                onClick={handleRefresh}
                className={cn(
                  "p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors touch-target",
                  isRefreshing && "animate-spin"
                )}
                data-testid="button-refresh-locations"
              >
                <RefreshCw className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-body font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm ring-4 ring-green-500/20" />
              <span>在線 {onlineCount} 人</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-3.5 h-3.5 rounded-full bg-stone" />
              <span>離線 {offlineCount} 人</span>
            </div>
          </div>

          {offlineCount > 0 && (
            <div className="mt-4 p-4 bg-terracotta/10 rounded-xl flex items-center gap-3 text-terracotta border border-terracotta/20">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-body-lg font-medium">{offlineCount} 位團員暫時離線，請留意</span>
            </div>
          )}
        </section>

        <section className="flex gap-3">
          {[
            { key: "map", label: "地圖", icon: MapPin },
            { key: "list", label: "列表", icon: Users },
            { key: "groups", label: "分組", icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as ViewMode)}
              className={cn(
                "flex-1 py-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 transition-all touch-target",
                viewMode === tab.key
                  ? "gradient-warm text-primary-foreground shadow-elevated transform scale-[1.02]"
                  : "bg-card/80 backdrop-blur-md text-muted-foreground hover:bg-muted border border-white/10 hover:shadow-card hover:-translate-y-1"
              )}
              data-testid={`button-view-${tab.key}`}
            >
              <tab.icon className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="text-body font-semibold">{tab.label}</span>
            </button>
          ))}
        </section>

        {viewMode === "map" && (
          <section className="space-y-4">
            {isGettingLocation ? (
              <div className="w-full h-72 rounded-lg bg-muted flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-caption text-muted-foreground">正在取得您的位置...</p>
              </div>
            ) : locationError && !mapCenter ? (
              <div className="w-full h-72 rounded-lg bg-muted flex flex-col items-center justify-center text-center p-6">
                <MapPin className="w-12 h-12 text-destructive mb-3" />
                <p className="text-body font-medium text-destructive mb-2">定位失敗</p>
                <p className="text-caption text-muted-foreground mb-4">{locationError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  data-testid="button-retry-location"
                >
                  重新嘗試
                </Button>
              </div>
            ) : mapCenter ? (
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
            ) : null}

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
      </div>
    </PageLayout>
  );
}
