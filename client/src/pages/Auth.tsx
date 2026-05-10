import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { setAuthToken } from "@/lib/queryClient";
import { Loader2, Mail, Lock, User, ArrowLeft, MapPin } from "lucide-react";
import mountOlives from "@/assets/attractions/mount-olives.jpg";

type AuthView = "main" | "forgot-password";

const authInputClass =
  "h-12 rounded-sm border-stone-300 bg-white pl-10 text-stone-950 caret-amber-700 placeholder:text-stone-500 focus-visible:ring-amber-600 focus-visible:ring-offset-0";
const authIconClass = "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500";
const authOutlineButtonClass =
  "h-12 w-full rounded-sm border-stone-300 bg-white text-stone-900 hover:bg-stone-50 hover:text-stone-950";

function AuthShell({
  children,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-950 text-white">
      <img
        src={mountOlives}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.42)_0%,rgba(17,24,39,0.72)_48%,rgba(12,10,9,0.96)_100%)]" />

      <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-end gap-8 px-5 pb-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] sm:px-8 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center lg:gap-12 lg:px-10">
        <section className="hidden max-w-2xl space-y-5 lg:block">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon-192.png"
              alt="與神同行"
              className="h-11 w-11 rounded-sm border border-white/20 shadow-soft"
            />
            <div>
              <p className="text-base font-semibold leading-none">與神同行</p>
              <p className="mt-1 text-xs text-white/70">Trip Companion</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/12 px-3 py-2 text-sm text-white/90 backdrop-blur-md">
            <MapPin className="h-4 w-4" />
            {eyebrow}
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold leading-tight text-white">{title}</h1>
            <p className="max-w-xl text-xl leading-relaxed text-white/82">{description}</p>
          </div>
        </section>

        <section className="w-full animate-fade-in">
          <div className="mb-5 flex items-center gap-2.5 lg:hidden">
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
          {children}
        </section>
      </main>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<AuthView>("main");

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "登入失敗",
          description: data.error === "Invalid credentials"
            ? "電子郵件或密碼錯誤"
            : (data.error || "電子郵件或密碼錯誤"),
          variant: "destructive",
        });
      } else {
        if (data.token) {
          setAuthToken(data.token);
        }
        setUser(data.user);
        toast({
          title: "登入成功",
          description: "歡迎回來！",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "發生錯誤",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "密碼不一致",
        description: "請確認兩次輸入的密碼相同",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 8) {
      toast({
        title: "密碼太短",
        description: "密碼至少需要 8 個字元",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          name: signupName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "註冊失敗",
          description: data.error,
          variant: "destructive",
        });
      } else {
        if (data.token) {
          setAuthToken(data.token);
        }
        setUser(data.user);
        toast({
          title: "註冊成功！",
          description: "歡迎加入！",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "發生錯誤",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast({
        title: "請輸入電子郵件",
        description: "我們需要您的電子郵件來發送重設連結",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "發送失敗");
      }

      setResetSent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "請稍後再試";
      toast({
        title: "發送失敗",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (view === "forgot-password") {
    return (
      <AuthShell
        eyebrow="回到旅程前，先找回帳號"
        title="重新取得同行的入口"
        description="輸入電子郵件，我們會寄出重設連結，讓你回到每日行程與靈修記錄。"
      >
        <div className="mx-auto w-full max-w-md space-y-4">
          <div className="space-y-1.5 text-white lg:hidden">
            <p className="text-sm text-white/72">回到旅程前，先找回帳號</p>
            <h1 className="text-2xl font-bold">忘記密碼</h1>
            <p className="text-sm leading-relaxed text-white/78">輸入您的電子郵件，我們將發送重設連結。</p>
          </div>

          <Card className="rounded-sm border-white/18 bg-white text-stone-900 shadow-elevated">
            {resetSent ? (
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">郵件已發送</h3>
                <p className="text-muted-foreground">
                  請查收 <span className="font-medium text-foreground">{resetEmail}</span> 的收件匣
                </p>
                <Button
                  variant="outline"
                  className={authOutlineButtonClass}
                  onClick={() => {
                    setView("main");
                    setResetSent(false);
                    setResetEmail("");
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回登入
                </Button>
              </CardContent>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <CardHeader>
                  <CardTitle>重設密碼</CardTitle>
                  <CardDescription>
                    我們會發送重設連結到您的電子郵件
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">電子郵件</Label>
                    <div className="relative">
                      <Mail className={authIconClass} />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className={authInputClass}
                        required
                        data-testid="input-reset-email"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="h-12 w-full rounded-sm" disabled={isLoading} data-testid="button-reset-submit">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        發送中...
                      </>
                    ) : (
                      "發送重設連結"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full rounded-sm"
                    onClick={() => setView("main")}
                    data-testid="button-back-login"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回登入
                  </Button>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="登入後接續你的旅程"
      title="把每天的路程，收進同一個安靜的地方"
      description="行程、經文、照片、同行者與提醒都在這裡，讓旅途中的每一天更容易被記住。"
    >
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="space-y-1.5 text-white lg:hidden">
          <p className="text-sm text-white/72">登入後接續你的旅程</p>
          <h1 className="text-2xl font-bold">一起同行</h1>
          <p className="text-sm leading-relaxed text-white/78">
            行程、經文、照片與同行者都在這裡。
          </p>
        </div>

        <Card className="rounded-sm border-white/18 bg-white text-stone-900 shadow-elevated">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-sm bg-stone-100">
              <TabsTrigger value="login" data-testid="tab-login">登入</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">註冊</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>歡迎回來</CardTitle>
                  <CardDescription>
                    請輸入您的帳號資訊登入
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">電子郵件</Label>
                    <div className="relative">
                      <Mail className={authIconClass} />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className={authInputClass}
                        required
                        data-testid="input-login-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">密碼</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 h-auto text-sm text-primary"
                        onClick={() => setView("forgot-password")}
                        data-testid="link-forgot-password"
                      >
                        忘記密碼？
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className={authIconClass} />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="輸入密碼或臨時密碼"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={authInputClass}
                        required
                        data-testid="input-login-password"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground" data-testid="text-temp-password-hint">
                      管理者匯入的團員請使用收到的 4 碼臨時密碼登入
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="h-12 w-full rounded-sm" disabled={isLoading} data-testid="button-login">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登入中...
                      </>
                    ) : (
                      "登入"
                    )}
                  </Button>

                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">或使用以下方式</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className={authOutlineButtonClass}
                    onClick={() => window.location.href = "/api/login"}
                    data-testid="button-google-login"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    使用 Google 帳號登入
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardHeader>
                  <CardTitle>建立帳號</CardTitle>
                  <CardDescription>
                    請填寫以下資訊完成註冊
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">姓名</Label>
                    <div className="relative">
                      <User className={authIconClass} />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="您的姓名"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className={authInputClass}
                        required
                        data-testid="input-signup-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">電子郵件</Label>
                    <div className="relative">
                      <Mail className={authIconClass} />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className={authInputClass}
                        required
                        data-testid="input-signup-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">密碼</Label>
                    <div className="relative">
                      <Lock className={authIconClass} />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="至少 8 個字元"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className={authInputClass}
                        required
                        data-testid="input-signup-password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">確認密碼</Label>
                    <div className="relative">
                      <Lock className={authIconClass} />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="再次輸入密碼"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className={authInputClass}
                        required
                        data-testid="input-signup-confirm-password"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="h-12 w-full rounded-sm" disabled={isLoading} data-testid="button-signup">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        註冊中...
                      </>
                    ) : (
                      "註冊"
                    )}
                  </Button>

                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">或使用以下方式</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className={authOutlineButtonClass}
                    onClick={() => window.location.href = "/api/login"}
                    data-testid="button-google-signup"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    使用 Google 帳號註冊
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs leading-relaxed text-white/68">
          註冊即表示您同意我們的服務條款和隱私政策
        </p>
      </div>
    </AuthShell>
  );
}
