import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getAuthToken } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Ticket, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyTrip() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: tripStatus, isLoading: tripStatusLoading } = useQuery({
    queryKey: ["trip-status", user?.id],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/check-trip-status", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to check trip status");
      return response.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (tripStatus && !tripStatus.needsVerification) {
      navigate("/");
    }
  }, [tripStatus, navigate]);

  if (tripStatusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
      </div>
    );
  }

  const verifyMutation = useMutation({
    mutationFn: async (invitationCode: string) => {
      const response = await apiRequest("POST", "/api/verify-invitation", { code: invitationCode });
      return response.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["trip-status"] });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    },
    onError: async (err: any) => {
      try {
        const errorData = await err.response?.json?.();
        setError(errorData?.error || "驗證失敗，請稍後再試");
      } catch {
        setError("驗證失敗，請稍後再試");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("請輸入驗證碼");
      return;
    }
    setError(null);
    verifyMutation.mutate(code.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Ticket className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">加入旅程</CardTitle>
          <CardDescription>
            請輸入您收到的邀請碼以加入旅程
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                成功加入旅程！
              </h3>
              <p className="text-gray-600">正在導向首頁...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="請輸入邀請碼"
                  className="text-center text-2xl font-mono tracking-widest h-14"
                  maxLength={10}
                  autoFocus
                  data-testid="input-invitation-code"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-lg"
                disabled={verifyMutation.isPending}
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    驗證中...
                  </>
                ) : (
                  "驗證並加入"
                )}
              </Button>

              <p className="text-center text-sm text-gray-500 mt-4">
                邀請碼由您的旅程領隊提供
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
