import { useState } from "react";
import { Users, MapPin, RefreshCw, AlertTriangle, Navigation, Compass, ChevronDown, ArrowLeft, CheckCircle2, Clock3, MapPinned, ShieldCheck, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { MemberLocationCard, MemberLocationData } from "@/components/location/MemberLocationCard";
import { GroupList } from "@/components/location/GroupList";
import { TeamMap } from "@/components/location/TeamMap";
import { AttractionsMap, parseGps } from "@/components/attractions/AttractionsMap";
import { AttractionDetailSheet, type AttractionDB } from "@/components/attractions/AttractionDetailSheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClearMyLocation, useLocations, useUpdateLocation } from "@/hooks/useLocations";
import { useMembers } from "@/hooks/useMembers";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";

type ViewMode = "map" | "groups" | "attractions";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);

  const { data: locations = [], refetch, isLoading } = useLocations();
  const { data: allMembers = [] } = useMembers();
  const updateLocation = useUpdateLocation();
  const clearMyLocation = useClearMyLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [focusAttractionId, setFocusAttractionId] = useState<string | null>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<AttractionDB | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  type ScheduleLocationItem = AttractionDB & { scheduledDayNo: number };
  const { data: attractionsData = [] } = useQuery<ScheduleLocationItem[]>({
    queryKey: ["/api/schedule-locations"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/schedule-locations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  const attractionsWithGps = attractionsData.filter((a) => parseGps(a.gps) !== null);

  // Build a map of userId -> location data
  const locationByUserId = new Map(locations.map((loc) => [loc.userId, loc]));

  // Merge both sources: members + location-only users (who shared location but may not be in allMembers)
  const memberUserIds = new Set(allMembers.map((m) => m.userId));
  const membersWithLocation: MemberLocationData[] = [
    // All members from the group roster
    ...allMembers.map((member) => {
      const loc = locationByUserId.get(member.userId);
      return {
        id: member.userId,
        name: member.name || "未知成員",
        avatar: member.avatarUrl ? transformPhotoUrl(member.avatarUrl) : undefined,
        location: loc ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : "未分享位置",
        lastUpdate: loc ? formatTimeAgo(loc.updatedAt) : "—",
        distance: "",
        status: loc ? (isOnline(loc.updatedAt) ? "online" as const : "offline" as const) : "offline" as const,
        group: member.group?.name,
        groupId: member.groupId || undefined,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
      };
    }),
    // Users who shared location but aren't in the member roster (e.g. no group assigned)
    ...locations
      .filter((loc) => !memberUserIds.has(loc.userId))
      .map((loc) => ({
        id: loc.userId,
        name: loc.profile?.name || "未知成員",
        avatar: loc.profile?.avatarUrl ? transformPhotoUrl(loc.profile.avatarUrl) : undefined,
        location: `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
        lastUpdate: formatTimeAgo(loc.updatedAt),
        distance: "",
        status: isOnline(loc.updatedAt) ? "online" as const : "offline" as const,
        group: undefined,
        groupId: undefined,
        latitude: loc.latitude,
        longitude: loc.longitude,
      })),
  ];

  function isOnline(updatedAt: string): boolean {
    const date = new Date(updatedAt);
    const now = new Date();
    const diffMins = (now.getTime() - date.getTime()) / 60000;
    return diffMins < 10;
  }

  const mySharedLocation = user?.id ? locationByUserId.get(user.id) : undefined;
  const hasSharedLocation = Boolean(mySharedLocation);
  const myLocationIsFresh = mySharedLocation ? isOnline(mySharedLocation.updatedAt) : false;
  const sharedCount = membersWithLocation.filter((m) => m.latitude && m.longitude).length;
  const membersWithSharedLocation = membersWithLocation.filter((m) => m.latitude != null && m.longitude != null);
  const onlineCount = membersWithSharedLocation.filter((m) => m.status === "online").length;
  const staleLocationCount = membersWithSharedLocation.filter((m) => m.status === "offline").length;
  const notSharingCount = Math.max(membersWithLocation.length - sharedCount, 0);
  const recentlyUpdatedMembers = [...membersWithSharedLocation]
    .sort((a, b) => {
      const aUpdatedAt = locationByUserId.get(a.id)?.updatedAt;
      const bUpdatedAt = locationByUserId.get(b.id)?.updatedAt;
      const aTime = aUpdatedAt ? new Date(aUpdatedAt).getTime() : 0;
      const bTime = bUpdatedAt ? new Date(bUpdatedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6);

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
          await refetch();
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

  const handleStopSharing = async () => {
    if (!window.confirm("要停止分享你目前的位置嗎？團隊地圖會移除你的定位。")) return;

    try {
      await clearMyLocation.mutateAsync();
      setMyPosition(null);
      await refetch();
      toast({
        title: "已停止分享位置",
        description: "團隊地圖不會再顯示你的目前定位",
      });
    } catch (error) {
      console.error("Clear location failed:", error);
      toast({
        title: "停止分享失敗",
        description: "目前無法清除位置，請稍後再試",
        variant: "destructive",
      });
    }
  };

  const mapCenter: [number, number] | null = myPosition
    || (mySharedLocation ? [mySharedLocation.latitude, mySharedLocation.longitude] : null)
    || (locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : null);

  return (
    <PageLayout title="地圖">
      <div className="container mx-auto max-w-5xl space-y-5 overflow-x-hidden px-4 pb-24 pt-4 animate-fade-in md:space-y-8 md:px-8 md:pb-8 md:pt-6">
        <section className="overflow-hidden rounded-lg border border-primary/10 bg-[linear-gradient(135deg,hsl(var(--primary)/0.12)_0%,hsl(var(--background))_52%,hsl(var(--secondary)/0.12)_100%)] p-5 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-caption text-muted-foreground">Map</p>
                <h2 className="text-2xl font-bold text-foreground">集合地圖</h2>
                <p className="mt-1 text-body text-muted-foreground">集合時先分享位置；找人看團員，找地點看景點。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-caption font-medium text-foreground shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  僅本團可見
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-caption font-medium text-foreground shadow-sm">
                  <Trash2 className="h-3.5 w-3.5 text-primary" />
                  可隨時停止分享
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-caption font-medium text-foreground shadow-sm">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {sharedCount} 位已分享
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-caption font-medium text-foreground shadow-sm">
                  <MapPinned className="h-3.5 w-3.5 text-primary" />
                  {attractionsWithGps.length} 個景點
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/90 p-4 shadow-soft lg:min-w-[280px]">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                    hasSharedLocation ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {hasSharedLocation ? <CheckCircle2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold">
                    {hasSharedLocation ? "我的位置已分享" : "尚未分享我的位置"}
                  </p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    {hasSharedLocation
                      ? `${myLocationIsFresh ? "剛更新" : "可能需要更新"} · ${formatTimeAgo(mySharedLocation!.updatedAt)}`
                      : "按下按鈕後，團隊才會看到你的位置"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleShareLocation}
                disabled={isLocating}
                className="mt-4 min-h-[48px] w-full rounded-md gradient-warm border-none shadow-sm transition-all hover:shadow-card"
                data-testid="button-share-location"
              >
                <Navigation className={cn("w-4 h-4 mr-1.5", isLocating && "animate-pulse")} />
                {isLocating ? "定位中..." : hasSharedLocation ? "更新我的位置" : "分享我的位置"}
              </Button>
              {hasSharedLocation && (
                <Button
                  variant="outline"
                  onClick={handleStopSharing}
                  disabled={clearMyLocation.isPending}
                  className="mt-2 min-h-[48px] w-full rounded-md"
                  data-testid="button-stop-sharing-location"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  {clearMyLocation.isPending ? "正在停止分享..." : "停止分享我的位置"}
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              title: "集合時",
              detail: "先分享我的位置，再看團員",
              icon: Navigation,
              action: () => {
                handleShareLocation();
              },
              tone: "primary",
            },
            {
              title: "找小組",
              detail: "看同組成員目前在哪裡",
              icon: Users,
              action: () => setViewMode("groups"),
              tone: "muted",
            },
            {
              title: "看景點",
              detail: "用地圖查看今日附近景點",
              icon: Compass,
              action: () => setViewMode("attractions"),
              tone: "muted",
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className={cn(
                "flex min-h-[92px] items-center gap-3 rounded-lg border p-4 text-left shadow-card transition-all hover:shadow-elevated",
                item.tone === "primary"
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full",
                  item.tone === "primary" ? "bg-white/18 text-white" : "bg-primary/10 text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-body font-semibold">{item.title}</p>
                <p className={cn("mt-1 text-caption", item.tone === "primary" ? "text-white/80" : "text-muted-foreground")}>{item.detail}</p>
              </div>
            </button>
          ))}
        </section>

        <section className="bg-card/80 backdrop-blur-md rounded-lg shadow-card p-5 border border-white/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-title font-semibold">團隊定位狀態</h2>
              <p className="text-caption text-muted-foreground mt-1">已分享 {sharedCount} 位，10 分鐘內更新 {onlineCount} 位</p>
            </div>
            <div className="flex items-center gap-3">
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

          <div className="mt-4 flex flex-wrap items-center gap-4 text-body font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm ring-4 ring-green-500/20" />
              <span>在線 {onlineCount} 人</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-3.5 h-3.5 rounded-full bg-stone" />
              <span>位置過期 {staleLocationCount} 人</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>尚未分享 {notSharingCount} 人</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              <span>{isLoading ? "更新中" : "每 60 秒自動更新"}</span>
            </div>
          </div>

          {staleLocationCount > 0 && (
            <div className="mt-4 p-4 bg-terracotta/10 rounded-lg flex items-center gap-3 text-terracotta border border-terracotta/20">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-body-lg font-medium">{staleLocationCount} 位團員的位置超過 10 分鐘未更新，需要集合時可改用通訊錄聯絡。</span>
            </div>
          )}

          {sharedCount === 0 && membersWithLocation.length > 0 && (
            <div className="mt-4 rounded-lg border border-primary/15 bg-primary/10 p-4 text-primary">
              <p className="text-body font-medium">目前還沒有人分享位置。集合時，請先按「分享我的位置」。</p>
            </div>
          )}
        </section>

        <section className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-1 shadow-card">
          {[
            { key: "map", label: "團員位置", icon: MapPin, hint: "集合找人" },
            { key: "groups", label: "小組", icon: Users, hint: "同組成員" },
            { key: "attractions", label: "景點", icon: Compass, hint: "附近地點" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as ViewMode)}
              className={cn(
                "min-h-[64px] rounded-md flex flex-col items-center justify-center gap-1 transition-all touch-target",
                viewMode === tab.key
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted"
              )}
              data-testid={`button-view-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-semibold">{tab.label}</span>
              <span className={cn("hidden text-[11px] sm:block", viewMode === tab.key ? "text-primary-foreground/75" : "text-muted-foreground")}>{tab.hint}</span>
            </button>
          ))}
        </section>

        {viewMode === "map" && (
          <section className="space-y-4">
            {mapCenter ? (
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
            ) : (
              <div className="w-full rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-card">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-title font-semibold">還沒有可顯示的位置</p>
                <p className="mt-2 text-body text-muted-foreground">按下「分享我的位置」，地圖就會以你的所在位置開始。</p>
                <Button className="mt-5" onClick={handleShareLocation} disabled={isLocating}>
                  <Navigation className={cn("mr-2 h-4 w-4", isLocating && "animate-pulse")} />
                  {isLocating ? "定位中..." : "分享我的位置"}
                </Button>
              </div>
            )}

            {recentlyUpdatedMembers.length > 0 && (
              <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-body font-semibold">最近有位置的團員</h3>
                    <p className="text-caption text-muted-foreground">只放最近更新的幾位；要找電話請用通訊錄。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode("groups")}
                    className="inline-flex min-h-[44px] items-center text-caption font-semibold text-primary hover:underline"
                  >
                    看小組
                  </button>
                </div>
                <div className="space-y-3">
                  {recentlyUpdatedMembers.map((member) => (
                    <MemberLocationCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {viewMode === "attractions" && (
          <section className="space-y-4">
            <AttractionsMap
              attractions={attractionsWithGps}
              focusId={focusAttractionId}
              heightClass="h-72"
              onMarkerClick={(id) => {
                const a = attractionsWithGps.find((x) => x.id === id);
                if (a) { setSelectedAttraction(a); setSheetOpen(true); }
              }}
            />

            <div className="space-y-2">
              {(() => {
                const days = [...new Set(attractionsWithGps.map((a) => (a as any).scheduledDayNo ?? a.dayNo))].sort((a, b) => a - b);
                return days.map((dayNo) => {
                  const dayAttractions = attractionsWithGps.filter((a) => ((a as any).scheduledDayNo ?? a.dayNo) === dayNo);
                  const isExpanded = expandedDays.has(dayNo);
                  return (
                    <div key={dayNo} className="rounded-xl border border-border overflow-hidden">
                      <button
                        className="flex min-h-[56px] w-full items-center justify-between bg-card px-4 py-3 transition-colors hover:bg-muted"
                        onClick={() => {
                          setExpandedDays((prev) => {
                            const next = new Set(prev);
                            if (next.has(dayNo)) next.delete(dayNo);
                            else next.add(dayNo);
                            return next;
                          });
                        }}
                      >
                        <span className="text-body font-semibold">第{dayNo}天</span>
                        <div className="flex items-center gap-2">
                          <span className="text-caption text-muted-foreground">{dayAttractions.length} 個景點</span>
                          <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )} />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="divide-y divide-border">
                          {dayAttractions.map((a) => (
                            <div
                              key={a.id}
                              className={cn(
                                "px-4 py-2.5 flex items-center justify-between gap-2 transition-colors",
                                focusAttractionId === a.id
                                  ? "bg-amber-50 dark:bg-amber-900/20"
                                  : "bg-card"
                              )}
                            >
                              <button
                                className="min-h-[48px] min-w-0 flex-1 text-left"
                                onClick={() => setFocusAttractionId(a.id)}
                              >
                                <p className="text-body font-medium truncate">{a.nameZh}</p>
                                {a.nameEn && <p className="text-caption text-muted-foreground truncate">{a.nameEn}</p>}
                              </button>
                              <button
                                className="text-xs text-amber-700 dark:text-amber-400 font-medium hover:underline flex-shrink-0 min-h-[44px] flex items-center"
                                onClick={() => { setSelectedAttraction(a); setSheetOpen(true); }}
                              >
                                查看詳情
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {attractionsWithGps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Compass className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-body">尚無景點座標資料</p>
              </div>
            )}
          </section>
        )}

        {viewMode === "groups" && (
          <section className="space-y-4">
            {selectedGroupId ? (() => {
              const groupMembers = membersWithLocation.filter((m) => m.groupId === selectedGroupId);
              const groupName = groupMembers[0]?.group || "小組";
              return (
                <>
                  <button
                    onClick={() => setSelectedGroupId(null)}
                    className="flex min-h-[44px] items-center gap-2 text-body font-medium text-primary hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    返回分組列表
                  </button>
                  <h3 className="text-title font-semibold">{groupName} ({groupMembers.length} 人)</h3>
                  {groupMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-body">此小組尚無成員</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupMembers.map((member) => (
                        <MemberLocationCard key={member.id} member={member} />
                      ))}
                    </div>
                  )}
                </>
              );
            })() : (
              <>
                <div className="bg-primary/10 rounded-lg p-4">
                  <h3 className="text-body font-semibold text-primary mb-1">小組分享系統</h3>
                  <p className="text-caption text-muted-foreground">
                    點擊小組可查看該組成員位置，方便分組行動時互相聯繫
                  </p>
                </div>
                <GroupList onSelectGroup={(groupId) => setSelectedGroupId(groupId)} />
              </>
            )}
          </section>
        )}
      </div>

      <AttractionDetailSheet
        attraction={selectedAttraction}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </PageLayout>
  );
}
