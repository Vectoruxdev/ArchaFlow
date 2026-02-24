"use client"

import { SWRConfig } from "swr"

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000,
        keepPreviousData: true,
        errorRetryCount: 2,
        errorRetryInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
