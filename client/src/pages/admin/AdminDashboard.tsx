import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAllTrips, useAllProfiles, useAllGroups } from "@/hooks/useAdmin";
import { Map, Users, Layers, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function AdminDashboard() {
  const { data: trips } = useAllTrips();
  const { data: profiles } = useAllProfiles();
  const { data: groups } = useAllGroups();

  const stats = [
    { label: "旅程數", value: trips?.length || 0, icon: Map, color: "bg-primary" },
    { label: "會員數", value: profiles?.length || 0, icon: Users, color: "bg-secondary" },
    { label: "小組數", value: groups?.length || 0, icon: Layers, color: "bg-terracotta" },
  ];

  // Get upcoming trips
  const upcomingTrips = trips
    ?.filter((t) => new Date(t.startDate) > new Date())
    .slice(0, 3);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-display mb-2">管理總覽</h2>
          <p className="text-body text-muted-foreground">
            查看系統狀態和快速存取管理功能
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-lg shadow-card p-6 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-display">{stat.value}</p>
                <p className="text-caption text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Trips */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title font-semibold">即將到來的旅程</h3>
              <Link
                to="/admin/trips"
                className="text-caption text-primary hover:underline"
              >
                查看全部
              </Link>
            </div>

            {upcomingTrips?.length ? (
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium truncate">{trip.title}</p>
                      <p className="text-caption text-muted-foreground">
                        {format(new Date(trip.startDate), "MM/dd", { locale: zhTW })} -{" "}
                        {format(new Date(trip.endDate), "MM/dd", { locale: zhTW })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body text-muted-foreground text-center py-4">
                目前沒有即將到來的旅程
              </p>
            )}
          </div>

          {/* Recent Members */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title font-semibold">最新會員</h3>
              <Link
                to="/admin/members"
                className="text-caption text-primary hover:underline"
              >
                查看全部
              </Link>
            </div>

            {profiles?.length ? (
              <div className="space-y-3">
                {profiles.slice(0, 4).map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-body text-secondary">
                          {profile.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium truncate">{profile.name}</p>
                      <p className="text-caption text-muted-foreground truncate">
                        {profile.email || "無電子郵件"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body text-muted-foreground text-center py-4">
                目前沒有會員資料
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
