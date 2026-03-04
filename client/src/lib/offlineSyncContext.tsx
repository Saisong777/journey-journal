import { createContext, useContext } from "react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const OfflineSyncContext = createContext<{ pendingCount: number }>({ pendingCount: 0 });

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const { pendingCount } = useOfflineSync();
  return (
    <OfflineSyncContext.Provider value={{ pendingCount }}>
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSyncStatus() {
  return useContext(OfflineSyncContext);
}
