import { createContext, useContext, useMemo } from "react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const OfflineSyncContext = createContext<{ pendingCount: number }>({ pendingCount: 0 });

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { pendingCount } = useOfflineSync();
  const value = useMemo(() => ({ pendingCount }), [pendingCount]);
  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSyncStatus() {
  return useContext(OfflineSyncContext);
}
