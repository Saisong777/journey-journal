import { useEffect, useState } from "react";
import { setAuthToken } from "@/lib/queryClient";

export default function AuthCallbackSuccess() {
  const [closing, setClosing] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("authToken");
    if (token) {
      setAuthToken(token);
    }

    setTimeout(() => {
      window.close();
      setClosing(false);
    }, 500);
  }, []);

  if (closing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50" data-testid="callback-success">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="text-xl font-semibold text-amber-900 mb-2">登入成功</h1>
          <p className="text-amber-700">正在關閉此分頁...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50" data-testid="callback-success">
      <div className="text-center p-8">
        <div className="text-4xl mb-4">✓</div>
        <h1 className="text-xl font-semibold text-amber-900 mb-2">登入成功</h1>
        <p className="text-amber-700">請關閉此分頁，返回編輯器即可使用</p>
      </div>
    </div>
  );
}
