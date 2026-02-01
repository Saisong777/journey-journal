import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (error) {
        toast({
          title: "Google 登入失敗",
          description: error.message,
          variant: "destructive",
        });
      } else if (!redirected) {
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
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast({
          title: "登入失敗",
          description: error.message === "Invalid login credentials" 
            ? "電子郵件或密碼錯誤" 
            : error.message,
          variant: "destructive",
        });
      } else {
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

    if (signupPassword.length < 6) {
      toast({
        title: "密碼太短",
        description: "密碼至少需要 6 個字元",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "註冊失敗",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "註冊成功！",
          description: "請查收電子郵件以驗證您的帳號",
        });
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center">
            <span className="text-3xl">✝️</span>
          </div>
          <h1 className="text-display">朝聖之旅</h1>
          <p className="text-body text-muted-foreground">
            與團員一同記錄屬靈旅程
          </p>
        </div>

        <Card>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登入</TabsTrigger>
              <TabsTrigger value="signup">註冊</TabsTrigger>
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
                  {/* Google Login Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 gap-3"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || isLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    使用 Google 帳號登入
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        或使用電子郵件
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-email">電子郵件</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full h-12" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登入中...
                      </>
                    ) : (
                      "登入"
                    )}
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
                  {/* Google Signup Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 gap-3"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || isLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    使用 Google 帳號註冊
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        或使用電子郵件
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">姓名</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="您的姓名"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">電子郵件</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="至少 6 個字元"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">確認密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="再次輸入密碼"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full h-12" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        註冊中...
                      </>
                    ) : (
                      "註冊"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-caption text-muted-foreground">
          註冊即表示您同意我們的服務條款和隱私政策
        </p>
      </div>
    </div>
  );
}
