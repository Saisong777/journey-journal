import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookOpen, CalendarDays, Loader2, MapPin, Users } from "lucide-react";
import mountOlives from "@/assets/attractions/mount-olives.jpg";

const journeySignals = [
  { icon: CalendarDays, label: "第 1 天", value: "耶路撒冷行程" },
  { icon: BookOpen, label: "今日靈修", value: "詩篇 121" },
  { icon: Users, label: "同行者", value: "平安同行" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-950 text-white" data-testid="landing-page">
      <img
        src={mountOlives}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.35)_0%,rgba(17,24,39,0.72)_58%,rgba(12,10,9,0.96)_100%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pb-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon-192.png"
              alt="與神同行"
              className="h-10 w-10 rounded-sm border border-white/20 shadow-soft"
            />
            <div>
              <p className="text-sm font-semibold leading-none">與神同行</p>
              <p className="mt-1 text-xs text-white/70">Trip Companion</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-10 rounded-sm bg-white/92 px-4 text-stone-900 hover:bg-white"
            onClick={() => navigate("/auth")}
            data-testid="button-go-to-login-top"
          >
            登入
          </Button>
        </div>

        <section className="flex flex-1 flex-col justify-end gap-7 py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-12">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/12 px-3 py-2 text-sm text-white/90 backdrop-blur-md">
              <MapPin className="h-4 w-4" />
              旅行中的每日同行
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                與神同行
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-white/84 sm:text-xl">
                讓行程、經文、記錄與同行者，在每一天的路上安靜合在一起。
              </p>
            </div>
          </div>

          <div className="rounded-sm border border-white/18 bg-white/14 p-3 shadow-elevated backdrop-blur-xl">
            <div className="rounded-sm bg-white p-4 text-stone-900 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-stone-500">今日旅程</p>
                  <p className="mt-1 text-lg font-semibold leading-snug">橄欖山到聖城</p>
                </div>
                <span className="rounded-sm bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">D1</span>
              </div>

              <div className="mt-4 space-y-2.5">
                {journeySignals.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 rounded-sm border border-stone-200 bg-stone-50 px-3 py-2.5">
                    <Icon className="h-5 w-5 flex-shrink-0 text-secondary" />
                    <div className="min-w-0">
                      <p className="text-xs text-stone-500">{label}</p>
                      <p className="truncate text-sm font-medium text-stone-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="mt-4 h-12 w-full rounded-sm text-base shadow-soft"
                onClick={() => navigate("/auth")}
                data-testid="button-go-to-login"
              >
                進入旅程
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
