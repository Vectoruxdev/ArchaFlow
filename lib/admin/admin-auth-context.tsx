"use client"

import { createContext, useContext } from "react"

interface AdminUser {
  userId: string
  email: string
}

interface AdminAuthContextValue {
  user: AdminUser | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export type { AdminUser }
