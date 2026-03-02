import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900 px-6" data-testid="landing-page">
      <div className="flex flex-col items-center text-center max-w-md space-y-10 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <span className="text-4xl font-bold text-primary-foreground">T</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground tracking-wide">朝聖之旅</h1>
          <p className="text-sm text-muted-foreground">Trip Companion</p>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-medium text-foreground leading-relaxed">
            享受一段與神同行的旅程！
          </p>
          <p className="text-base text-muted-foreground italic">
            Enjoy the journey of walking with God!
          </p>
        </div>

        <div className="w-16 border-t-2 border-primary/30" />

        <Button
          size="lg"
          className="w-full max-w-xs text-lg py-6 rounded-xl shadow-md"
          onClick={() => navigate("/auth")}
          data-testid="button-go-to-login"
        >
          登入
        </Button>
      </div>
    </div>
  );
}
