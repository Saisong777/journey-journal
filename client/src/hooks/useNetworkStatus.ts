import { useState, useEffect, useCallback, useRef } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnlineRef = useRef(isOnline);

  isOnlineRef.current = isOnline;

  const markOnline = useCallback(() => {
    if (!isOnlineRef.current) {
      setWasOffline(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setWasOffline(false), 3000);
    }
    setIsOnline(true);
  }, []);

  const markOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const handleBrowserOnline = async () => {
      const reachable = await checkConnectivity();
      if (reachable) {
        markOnline();
      }
    };

    const handleBrowserOffline = () => {
      markOffline();
    };

    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);

    const interval = setInterval(async () => {
      const reachable = await checkConnectivity();
      if (reachable) {
        if (!isOnlineRef.current) markOnline();
      } else {
        markOffline();
      }
    }, 10000);

    return () => {
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [checkConnectivity, markOnline, markOffline]);

  return { isOnline, wasOffline };
}
