'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Revalidate on focus (when user comes back to tab)
        revalidateOnFocus: false,
        // Revalidate on reconnect
        revalidateOnReconnect: true,
        // Dedupe requests within 30 seconds
        dedupingInterval: 30000,
        // Retry on error
        errorRetryCount: 3,
        // Error retry interval
        errorRetryInterval: 5000,
        // Keep data fresh for 30 seconds
        refreshInterval: 0, // Disable auto-refresh (can enable per-hook)
        // Suspense mode
        suspense: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
