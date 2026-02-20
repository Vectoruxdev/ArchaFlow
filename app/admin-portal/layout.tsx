"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { AdminAuthContext } from "@/lib/admin/admin-auth-context"
import type { AdminUser } from "@/lib/admin/admin-auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  // usePathname() returns the browser URL path (e.g. "/login" on admin subdomain),
  // not the rewritten path ("/admin-portal/login"), so check both
  const isLoginPage = pathname === "/admin-portal/login" || pathname === "/login"

  const verifyAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth")
      if (res.ok) {
        const data = await res.json()
        setUser({ userId: data.userId, email: data.email })
      } else {
        setUser(null)
        if (!isLoginPage) {
          router.push("/login")
        }
      }
    } catch {
      setUser(null)
      if (!isLoginPage) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }, [isLoginPage, router])

  useEffect(() => {
    verifyAdmin()
  }, [verifyAdmin])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/login")
  }

  // Login page renders without the admin layout shell
  if (isLoginPage) {
    return (
      <AdminAuthContext.Provider value={{ user, loading, signOut }}>
        {children}
      </AdminAuthContext.Provider>
    )
  }

  // All other pages require auth and get the admin layout
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[--af-text-muted]">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, signOut }}>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthContext.Provider>
  )
}
