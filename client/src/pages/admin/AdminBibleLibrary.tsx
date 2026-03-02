import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Library, Globe, Map, Loader2 } from "lucide-react";

export default function AdminBibleLibrary() {
  const { toast } = useToast();

  const { data: globalSetting, isLoading: globalLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/admin/app-settings/bible-library"],
  });

  const { data: tripsList, isLoading: tripsLoading } = useQuery<{ id: string; title: string; bibleLibraryEnabled: boolean }[]>({
    queryKey: ["/api/admin/trips-bible-library"],
  });

  const { data: adminInfo } = useQuery<{ isSuperAdmin: boolean }>({
    queryKey: ["/api/is-admin"],
  });

  const toggleGlobal = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("PATCH", "/api/admin/app-settings/bible-library", { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app-settings/bible-library"] });
      toast({ title: "已更新全域設定" });
    },
  });

  const toggleTrip = useMutation({
    mutationFn: async ({ tripId, enabled }: { tripId: string; enabled: boolean }) => {
      await apiRequest("PATCH", `/api/admin/trips/${tripId}/bible-library`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trips-bible-library"] });
      toast({ title: "已更新旅程設定" });
    },
  });

  const isSuperAdmin = adminInfo?.isSuperAdmin ?? false;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold" data-testid="text-page-title">聖經資料館管理</h2>
        </div>

        <section className="bg-card rounded-lg border border-border p-6 space-y-4" data-testid="section-global-toggle">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">全域開關</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            啟用後，管理員可為各旅程獨立開啟聖經資料館功能。關閉將隱藏所有旅程的聖經資料館。
          </p>
          {globalLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-body font-medium">
                {globalSetting?.enabled ? "已啟用" : "已停用"}
              </span>
              <Switch
                checked={globalSetting?.enabled ?? false}
                onCheckedChange={(checked) => toggleGlobal.mutate(checked)}
                disabled={!isSuperAdmin || toggleGlobal.isPending}
                data-testid="switch-global-toggle"
              />
            </div>
          )}
          {!isSuperAdmin && (
            <p className="text-xs text-muted-foreground">僅總管理員可修改全域開關</p>
          )}
        </section>

        <section className="bg-card rounded-lg border border-border p-6 space-y-4" data-testid="section-trip-toggles">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">各旅程設定</h3>
          </div>
          {tripsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : tripsList && tripsList.length > 0 ? (
            <div className="space-y-3">
              {tripsList.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  data-testid={`trip-bible-library-${trip.id}`}
                >
                  <span className="text-body font-medium">{trip.title}</span>
                  <Switch
                    checked={trip.bibleLibraryEnabled}
                    onCheckedChange={(checked) => toggleTrip.mutate({ tripId: trip.id, enabled: checked })}
                    disabled={!(globalSetting?.enabled) || toggleTrip.isPending}
                    data-testid={`switch-trip-${trip.id}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">尚無旅程</p>
          )}
          {!globalSetting?.enabled && (
            <p className="text-xs text-amber-600">請先啟用全域開關才能設定各旅程</p>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
