import { useState, useEffect, useCallback, useRef } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setWasOffline(false), 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  const checkConnectivity = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setIsOnline((prev) => {
        if (!prev) {
          setWasOffline(true);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setWasOffline(false), 3000);
        }
        return true;
      });
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    checkIntervalRef.current = setInterval(checkConnectivity, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleOnline, handleOffline, checkConnectivity]);

  return { isOnline, wasOffline };
}
