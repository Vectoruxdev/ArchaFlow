"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { User, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"

// Types
interface Workspace {
  id: string
  name: string
  icon: string
  role: "owner" | "admin" | "editor" | "viewer"
}

interface PendingInvitation {
  id: string
  token: string
  businessName: string
  roleName: string
  inviterEmail?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  workspacesLoading: boolean
  workspacesLoaded: boolean
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  pendingInvitations: PendingInvitation[]
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, workspaceName: string) => Promise<void>
  signUpWithoutWorkspace: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  switchWorkspace: (workspaceId: string) => void
  createWorkspace: (name: string, icon: string) => Promise<Workspace>
  refreshWorkspaces: () => Promise<void>
  deleteWorkspace: (workspaceId: string) => Promise<void>
  leaveWorkspace: (workspaceId: string) => Promise<void>
  renameWorkspace: (workspaceId: string, newName: string) => Promise<void>
  checkPendingInvitations: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspacesLoading, setWorkspacesLoading] = useState(false)
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const router = useRouter()
  
  // Prevent concurrent workspace loading
  const loadingWorkspacesRef = useRef(false)

  // Suppress AbortError from navigator.locks in dev mode error overlay
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (event.reason?.name === "AbortError") {
        event.preventDefault()
      }
    }
    window.addEventListener("unhandledrejection", handler)
    return () => window.removeEventListener("unhandledrejection", handler)
  }, [])

  // Load workspaces for authenticated user
  const loadWorkspaces = async (userId: string) => {
    // Prevent concurrent calls
    if (loadingWorkspacesRef.current) {
      console.log("⚠️ Already loading workspaces, skipping...")
      return
    }
    
    loadingWorkspacesRef.current = true
    setWorkspacesLoading(true)
    setWorkspacesLoaded(false)
    
    try {
      console.log("🔄 Loading workspaces for user:", userId, "at", new Date().toISOString())
      
      // First, get user_roles with business and role IDs
      const { data: userRolesData, error: userRolesError } = await supabase
        .from("user_roles")
        .select("business_id, role_id")
        .eq("user_id", userId)

      console.log("=".repeat(60))
      console.log("📊 USER_ROLES QUERY RESULT:")
      console.log("  rows:", userRolesData?.length ?? "null")
      console.log("  data:", JSON.stringify(userRolesData))
      console.log("  error:", userRolesError ? JSON.stringify({ message: userRolesError.message, code: userRolesError.code, details: userRolesError.details }) : "none")
      console.log("=".repeat(60))

      if (userRolesError) {
        console.error("Supabase error loading user roles:", {
          message: userRolesError.message,
          details: userRolesError.details,
          hint: userRolesError.hint,
          code: userRolesError.code
        })
        throw userRolesError
      }

      if (!userRolesData || userRolesData.length === 0) {
        console.log("No workspaces found for user:", userId)
        setWorkspaces([])
        setCurrentWorkspace(null)
        return
      }

      // Get unique business IDs
      const businessIds = [...new Set(userRolesData.map(ur => ur.business_id))]
      console.log("Business IDs:", businessIds)

      // Fetch businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from("businesses")
        .select("id, name")
        .in("id", businessIds)

      console.log("Businesses query result:", { data: businessesData, error: businessesError })

      if (businessesError) throw businessesError

      // Fetch roles
      const roleIds = userRolesData.map(ur => ur.role_id)
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, name")
        .in("id", roleIds)

      console.log("Roles query result:", { data: rolesData, error: rolesError })

      if (rolesError) throw rolesError

      // Combine the data
      const workspaceList: Workspace[] = userRolesData.map((ur) => {
        const business = businessesData?.find(b => b.id === ur.business_id)
        const role = rolesData?.find(r => r.id === ur.role_id)
        
        return {
          id: ur.business_id,
          name: business?.name || "Unknown",
          icon: "🏢",
          role: (role?.name?.toLowerCase() || "viewer") as "owner" | "admin" | "editor" | "viewer",
        }
      })

      console.log("Parsed workspaces:", workspaceList)
      setWorkspaces(workspaceList)

      // Set current workspace from localStorage or first workspace
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId")
      console.log("Saved workspace ID from localStorage:", savedWorkspaceId)
      
      const workspace = savedWorkspaceId
        ? workspaceList.find((w) => w.id === savedWorkspaceId) || workspaceList[0]
        : workspaceList[0]

      if (workspace) {
        console.log("✅ Setting current workspace:", workspace)
        setCurrentWorkspace(workspace)
        localStorage.setItem("currentWorkspaceId", workspace.id)
      } else {
        console.warn("⚠️ No workspace to set as current")
      }
      
      console.log("✅ Workspaces loaded successfully at", new Date().toISOString())
    } catch (error: any) {
      console.error("❌ Error loading workspaces:", {
        message: error?.message,
        stack: error?.stack,
        full: error
      })
      // Even on error, mark as loaded (but with no workspaces)
      setWorkspaces([])
      setCurrentWorkspace(null)
    } finally {
      setWorkspacesLoaded(true)
      setWorkspacesLoading(false)
      loadingWorkspacesRef.current = false
    }
  }

  // Handle auth session changes -- load workspaces & resolve loading state
  const handleAuthSession = async (event: string, session: Session | null) => {
    try {
      console.log("🔔 Auth event:", event, "session:", session ? `user=${session.user?.id}, email=${session.user?.email}` : "null", "at", new Date().toISOString())
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        console.log("👤 User authenticated:", session.user.id, session.user.email, "— loading workspaces...")
        await loadWorkspaces(session.user.id)
        console.log("✅ handleAuthSession complete — workspaces loaded")
        // Check for pending invitations in background (non-blocking)
        checkPendingInvitations().catch(() => {})
      } else {
        console.log("❌ No user session — clearing state")
        setWorkspaces([])
        setCurrentWorkspace(null)
        setPendingInvitations([])
        setWorkspacesLoaded(true)
        localStorage.removeItem("currentWorkspaceId")
      }
    } catch (error) {
      console.error("💥 Error handling auth session:", error)
      setWorkspacesLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  // Initialize auth: subscribe to changes + fetch initial session
  useEffect(() => {
    // Skip auth if Supabase is not configured
    if (!isSupabaseConfigured()) {
      console.log("❌ Supabase not configured, skipping auth")
      setLoading(false)
      return
    }

    console.log("🔐 Initializing auth...")
    let initialSessionHandled = false

    // 1. Subscribe to auth state changes (handles future events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") {
          initialSessionHandled = true
        }
        // Fire and forget -- handleAuthSession manages its own errors
        handleAuthSession(event, session)
      }
    )

    // 2. Fallback: if INITIAL_SESSION hasn't fired after 2s, manually get session
    const fallbackTimer = setTimeout(async () => {
      if (!initialSessionHandled) {
        console.log("⚠️ INITIAL_SESSION not received, fetching session manually...")
        try {
          const { data: { session } } = await supabase.auth.getSession()
          await handleAuthSession("MANUAL_FALLBACK", session)
        } catch (error) {
          console.error("💥 Fallback session fetch error:", error)
          setLoading(false)
          setWorkspacesLoaded(true)
        }
      }
    }, 2000)

    // 3. Safety: force loading=false after 5s max (prevents infinite loading)
    const safetyTimer = setTimeout(() => {
      setLoading(false)
      setWorkspacesLoaded(true)
    }, 5000)

    return () => {
      clearTimeout(fallbackTimer)
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  // Proactive session refresh when user returns to tab (fixes stale token after idle)
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== "visible" || !user) return
      if (!isSupabaseConfigured()) return
      try {
        const { error } = await supabase.auth.refreshSession()
        if (!error && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("session-refreshed"))
        }
      } catch {
        // ignore
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [user])

  // Check for pending invitations for the current user
  const checkPendingInvitations = async () => {
    try {
      // Read user email from component state (already set by handleAuthSession)
      // This avoids calling supabase.auth.getSession() or getUser() which can
      // trigger navigator.locks conflicts
      if (!user?.email) {
        setPendingInvitations([])
        return
      }

      const { data, error } = await supabase
        .from("workspace_invitations")
        .select("id, token, created_at, business_id, businesses:business_id(name), roles:role_id(name)")
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending")
        .gte("expires_at", new Date().toISOString())

      if (error) {
        console.error("Error checking pending invitations:", error)
        return
      }

      const invitations: PendingInvitation[] = (data || []).map((inv: any) => ({
        id: inv.id,
        token: inv.token,
        businessName: inv.businesses?.name || "Unknown Workspace",
        roleName: inv.roles?.name || "Member",
        createdAt: inv.created_at,
      }))

      setPendingInvitations(invitations)
    } catch (error) {
      console.error("Error checking pending invitations:", error)
    }
  }

  // Sign in
  const signIn = async (email: string, password: string) => {
    console.log("🔑 Attempting sign in with email:", email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log("🔑 Sign in result:", {
      hasSession: !!data.session,
      hasUser: !!data.user,
      userId: data.user?.id,
      error: error?.message
    })

    if (error) {
      console.error("❌ Sign in error:", error)
      throw error
    }
    
    console.log("✅ Sign in successful, session will be automatically loaded")
  }

  // Sign up
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    workspaceName: string
  ) => {
    // Sign up the user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) throw signUpError
    if (!data.user) throw new Error("User creation failed")

    // Create default workspace using the SQL function
    const { data: workspaceData, error: workspaceError } = await supabase.rpc(
      "create_default_workspace",
      {
        user_id: data.user.id,
        workspace_name: workspaceName,
        user_full_name: fullName,
      }
    )

    if (workspaceError) {
      console.error("Workspace creation error:", workspaceError)
      throw workspaceError
    }

    // Reload workspaces
    await loadWorkspaces(data.user.id)
  }

  // Sign up without creating a workspace (for onboarding flow)
  const signUpWithoutWorkspace = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) throw signUpError
    if (!data.user) throw new Error("User creation failed")

    // Create user profile only (no workspace)
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({ id: data.user.id, full_name: fullName })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      throw profileError
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      // Only attempt Supabase signOut if configured
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error("Error signing out from Supabase:", error)
      // Continue with logout even if Supabase fails
    }
    
    // Always clear state and redirect
    setUser(null)
    setSession(null)
    setWorkspaces([])
    setCurrentWorkspace(null)
    localStorage.removeItem("currentWorkspaceId")
    router.push("/login")
  }

  // Switch workspace
  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
      localStorage.setItem("currentWorkspaceId", workspaceId)
      // No reload - React state update triggers re-renders; pages listen for businessId change
    }
  }

  // Create new workspace
  const createWorkspace = async (name: string, icon: string): Promise<Workspace> => {
    if (!user) throw new Error("User not authenticated")

    const { data: workspaceData, error: workspaceError } = await supabase.rpc(
      "create_default_workspace",
      {
        user_id: user.id,
        workspace_name: name,
        user_full_name: "", // User already has a profile
      }
    )

    if (workspaceError) throw workspaceError

    const newBusinessId = workspaceData

    // Reload workspaces
    await loadWorkspaces(user.id)

    // Create a workspace object directly since we know the structure
    const newWorkspace: Workspace = {
      id: newBusinessId,
      name: name,
      icon: icon,
      role: "owner", // User who creates workspace is always owner
    }

    return newWorkspace
  }

  // Refresh workspaces
  const refreshWorkspaces = async () => {
    if (user) {
      await loadWorkspaces(user.id)
    }
  }

  // Delete workspace (owner only - deletes the business row, cascade handles cleanup)
  const deleteWorkspace = async (workspaceId: string) => {
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", workspaceId)

    if (error) throw error

    // Clear localStorage if we deleted the current workspace
    const savedId = localStorage.getItem("currentWorkspaceId")
    if (savedId === workspaceId) {
      localStorage.removeItem("currentWorkspaceId")
    }

    // Refresh workspace list - this will auto-select another workspace if available
    await refreshWorkspaces()
  }

  // Leave workspace (non-owner - removes user_roles row for this business)
  const leaveWorkspace = async (workspaceId: string) => {
    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", user.id)
      .eq("business_id", workspaceId)

    if (error) throw error

    // Clear localStorage if we left the current workspace
    const savedId = localStorage.getItem("currentWorkspaceId")
    if (savedId === workspaceId) {
      localStorage.removeItem("currentWorkspaceId")
    }

    // Refresh workspace list - this will auto-select another workspace if available
    await refreshWorkspaces()
  }

  // Rename workspace (updates business name in database)
  const renameWorkspace = async (workspaceId: string, newName: string) => {
    if (!user) throw new Error("User not authenticated")
    if (!newName.trim()) throw new Error("Workspace name cannot be empty")

    const { error } = await supabase
      .from("businesses")
      .update({ name: newName.trim() })
      .eq("id", workspaceId)

    if (error) throw error

    // Refresh workspace list so name updates everywhere
    await refreshWorkspaces()
  }

  const value = {
    user,
    session,
    loading,
    workspacesLoading,
    workspacesLoaded,
    workspaces,
    currentWorkspace,
    pendingInvitations,
    signIn,
    signUp,
    signUpWithoutWorkspace,
    signOut,
    switchWorkspace,
    createWorkspace,
    refreshWorkspaces,
    deleteWorkspace,
    leaveWorkspace,
    renameWorkspace,
    checkPendingInvitations,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
