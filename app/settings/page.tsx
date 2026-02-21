"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import {
  Check,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Shield,
  GripVertical,
  Building2,
  LogOut,
  Target,
  Globe,
  CreditCard,
  ArrowRight,
  Monitor,
  Sun,
  Moon,
} from "lucide-react"
import { PlanBadge } from "@/components/billing/plan-badge"
import Link from "next/link"
import { toast } from "@/lib/toast"

export default function SettingsPage() {
  const router = useRouter()
  const { currentWorkspace, workspaces, user, deleteWorkspace, leaveWorkspace, renameWorkspace } = useAuth()
  const [saved, setSaved] = useState(false)

  // Theme state
  type ThemeMode = "system" | "light" | "dark"
  const [themeMode, setThemeMode] = useState<ThemeMode>("system")
  const [systemIsDark, setSystemIsDark] = useState(false)

  useEffect(() => {
    const stored = (localStorage.getItem("archaflow-theme") || "system") as ThemeMode
    setThemeMode(stored)
    setSystemIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches)

    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const osHandler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches)
      if ((localStorage.getItem("archaflow-theme") || "system") === "system") {
        document.documentElement.classList.toggle("dark", e.matches)
      }
    }
    mql.addEventListener("change", osHandler)

    const syncHandler = (e: Event) => {
      const mode = (e as CustomEvent).detail?.mode as ThemeMode
      if (mode) setThemeMode(mode)
    }
    window.addEventListener("theme-changed", syncHandler)

    return () => {
      mql.removeEventListener("change", osHandler)
      window.removeEventListener("theme-changed", syncHandler)
    }
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    setThemeMode(mode)
    localStorage.setItem("archaflow-theme", mode)
    const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", isDark)
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: { mode } }))
  }

  const effectiveTheme = themeMode === "system" ? (systemIsDark ? "dark" : "light") : themeMode

  // Accent color state
  type AccentColor = "amber" | "forest" | "slate" | "rust" | "plum" | "stone"
  const [accentColor, setAccentColor] = useState<AccentColor>("amber")

  useEffect(() => {
    const stored = localStorage.getItem("archaflow-accent") as AccentColor | null
    if (stored) setAccentColor(stored)
  }, [])

  const applyAccent = (color: AccentColor) => {
    setAccentColor(color)
    localStorage.setItem("archaflow-accent", color)
    if (color === "amber") {
      delete document.documentElement.dataset.accent
    } else {
      document.documentElement.dataset.accent = color
    }
  }

  const accentOptions: { id: AccentColor; label: string; swatch: string }[] = [
    { id: "amber", label: "Amber", swatch: "#8B5E2A" },
    { id: "forest", label: "Forest", swatch: "#2D6A4F" },
    { id: "slate", label: "Slate", swatch: "#475569" },
    { id: "rust", label: "Rust", swatch: "#9A3412" },
    { id: "plum", label: "Plum", swatch: "#7E22CE" },
    { id: "stone", label: "Stone", swatch: "#78716C" },
  ]

  // Density state
  type DensityMode = "compact" | "default" | "comfortable"
  const [density, setDensity] = useState<DensityMode>("default")

  useEffect(() => {
    const stored = localStorage.getItem("archaflow-density") as DensityMode | null
    if (stored) setDensity(stored)
  }, [])

  const applyDensity = (mode: DensityMode) => {
    setDensity(mode)
    localStorage.setItem("archaflow-density", mode)
    if (mode === "default") {
      delete document.documentElement.dataset.density
    } else {
      document.documentElement.dataset.density = mode
    }
  }

  // Workspace action state
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false)
  const [isLeaveWorkspaceOpen, setIsLeaveWorkspaceOpen] = useState(false)
  const [isRenameWorkspaceOpen, setIsRenameWorkspaceOpen] = useState(false)
  const [renameWorkspaceName, setRenameWorkspaceName] = useState("")
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [isWorkspaceActionLoading, setIsWorkspaceActionLoading] = useState(false)
  const [workspaceActionError, setWorkspaceActionError] = useState<string | null>(null)
  
  // Team Positions state (persisted in business_positions table)
  type Position = { id: string; label: string; order_index: number }
  const [positions, setPositions] = useState<Position[]>([])
  const [positionsLoading, setPositionsLoading] = useState(true)
  const [positionsError, setPositionsError] = useState<string | null>(null)
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false)
  const [newPosition, setNewPosition] = useState("")
  const [editingPosition, setEditingPosition] = useState<{ id: string; label: string } | null>(null)

  // Lead Types state (persisted in lead_types table)
  type LeadType = { id: string; label: string; order_index: number }
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  const [leadTypesLoading, setLeadTypesLoading] = useState(true)
  const [leadTypesError, setLeadTypesError] = useState<string | null>(null)
  const [isAddLeadTypeOpen, setIsAddLeadTypeOpen] = useState(false)
  const [newLeadType, setNewLeadType] = useState("")
  const [editingLeadType, setEditingLeadType] = useState<{ id: string; label: string } | null>(null)

  // Roles & Permissions state (Supabase)
  type Role = {
    id: string
    business_id: string
    name: string
    is_custom: boolean
  }

  type Permission = {
    id: string
    role_id: string
    feature_type: string
    action: string
    allowed: boolean
    visibility_flags: Record<string, unknown>
  }

  const featureList = [
    { key: "dashboard", label: "Dashboard" },
    { key: "projects", label: "Projects" },
    { key: "leads", label: "Leads" },
    { key: "invoices", label: "Invoices" },
    { key: "billing", label: "Billing" },
    { key: "reports", label: "Reports" },
  ]

  const permissionActions = ["create", "read", "update", "delete"]

  const businessId = currentWorkspace?.id || ""

  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [permissionsMap, setPermissionsMap] = useState<Record<string, Record<string, boolean>>>({})
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [editingRoleName, setEditingRoleName] = useState("")
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [savingPermissions, setSavingPermissions] = useState(false)

  // Workspace Access (domain auto-add) state
  const [allowedDomains, setAllowedDomains] = useState("")
  const [autoAddByDomain, setAutoAddByDomain] = useState(false)
  const [domainSettingsLoading, setDomainSettingsLoading] = useState(true)
  const [savingDomainSettings, setSavingDomainSettings] = useState(false)

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Load positions from database
  const loadPositions = async () => {
    if (!businessId) return
    setPositionsLoading(true)
    setPositionsError(null)
    try {
      const { data, error } = await supabase
        .from("business_positions")
        .select("id, label, order_index")
        .eq("business_id", businessId)
        .order("order_index", { ascending: true })

      if (error) throw error
      setPositions((data || []) as Position[])
    } catch (err: unknown) {
      setPositionsError(err instanceof Error ? err.message : "Failed to load positions")
      setPositions([])
    } finally {
      setPositionsLoading(false)
    }
  }

  useEffect(() => {
    loadPositions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  // Load domain settings from businesses table
  const loadDomainSettings = async () => {
    if (!businessId) return
    setDomainSettingsLoading(true)
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("allowed_email_domains, auto_add_by_domain")
        .eq("id", businessId)
        .single()

      if (error) throw error
      const domains: string[] = Array.isArray(data?.allowed_email_domains)
        ? data.allowed_email_domains
        : []
      setAllowedDomains(domains.join(", "))
      setAutoAddByDomain(data?.auto_add_by_domain || false)
    } catch {
      // ignore - columns may not exist yet
    } finally {
      setDomainSettingsLoading(false)
    }
  }

  useEffect(() => {
    loadDomainSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const handleSaveDomainSettings = async () => {
    if (!businessId) return
    setSavingDomainSettings(true)
    try {
      const domains = allowedDomains
        .split(/[,\n]/)
        .map((d) => d.trim().toLowerCase())
        .filter((d) => d.length > 0)

      const { error } = await supabase
        .from("businesses")
        .update({
          allowed_email_domains: domains,
          auto_add_by_domain: autoAddByDomain,
        })
        .eq("id", businessId)

      if (error) throw error
      showSaved()
    } catch (err: any) {
      toast.error(err.message || "Failed to save domain settings")
    } finally {
      setSavingDomainSettings(false)
    }
  }

  const handleAddPosition = async () => {
    const label = newPosition.trim()
    if (!label || !businessId || positions.some((p) => p.label.toLowerCase() === label.toLowerCase()))
      return
    try {
      const maxOrder = positions.length > 0 ? Math.max(...positions.map((p) => p.order_index)) : -1
      const { data, error } = await supabase
        .from("business_positions")
        .insert([{ business_id: businessId, label, order_index: maxOrder + 1 }])
        .select("id, label, order_index")
        .single()

      if (error) throw error
      setPositions((prev) => [...prev, data as Position])
      setNewPosition("")
      setIsAddPositionOpen(false)
      showSaved()
    } catch (err: unknown) {
      setPositionsError(err instanceof Error ? err.message : "Failed to add position")
    }
  }

  const handleEditPosition = async () => {
    if (!editingPosition || !editingPosition.label.trim()) return
    const label = editingPosition.label.trim()
    if (positions.some((p) => p.id !== editingPosition.id && p.label.toLowerCase() === label.toLowerCase()))
      return
    try {
      const { error } = await supabase
        .from("business_positions")
        .update({ label })
        .eq("id", editingPosition.id)

      if (error) throw error
      setPositions((prev) =>
        prev.map((p) => (p.id === editingPosition.id ? { ...p, label } : p))
      )
      setEditingPosition(null)
      showSaved()
    } catch (err: unknown) {
      setPositionsError(err instanceof Error ? err.message : "Failed to update position")
    }
  }

  const handleDeletePosition = async (id: string) => {
    try {
      const { error } = await supabase.from("business_positions").delete().eq("id", id)
      if (error) throw error
      setPositions((prev) => prev.filter((p) => p.id !== id))
      showSaved()
    } catch (err: unknown) {
      setPositionsError(err instanceof Error ? err.message : "Failed to delete position")
    }
  }

  // Load lead types from database
  const loadLeadTypes = async () => {
    if (!businessId) return
    setLeadTypesLoading(true)
    setLeadTypesError(null)
    try {
      const { data, error } = await supabase
        .from("lead_types")
        .select("id, label, order_index")
        .eq("business_id", businessId)
        .order("order_index", { ascending: true })

      if (error) throw error
      setLeadTypes((data || []) as LeadType[])
    } catch (err: unknown) {
      setLeadTypesError(err instanceof Error ? err.message : "Failed to load lead types")
      setLeadTypes([])
    } finally {
      setLeadTypesLoading(false)
    }
  }

  useEffect(() => {
    loadLeadTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const handleAddLeadType = async () => {
    const label = newLeadType.trim()
    if (!label || !businessId || leadTypes.some((lt) => lt.label.toLowerCase() === label.toLowerCase()))
      return
    try {
      const maxOrder = leadTypes.length > 0 ? Math.max(...leadTypes.map((lt) => lt.order_index)) : -1
      const { data, error } = await supabase
        .from("lead_types")
        .insert([{ business_id: businessId, label, order_index: maxOrder + 1 }])
        .select("id, label, order_index")
        .single()

      if (error) throw error
      setLeadTypes((prev) => [...prev, data as LeadType])
      setNewLeadType("")
      setIsAddLeadTypeOpen(false)
      showSaved()
    } catch (err: unknown) {
      setLeadTypesError(err instanceof Error ? err.message : "Failed to add lead type")
    }
  }

  const handleEditLeadType = async () => {
    if (!editingLeadType || !editingLeadType.label.trim()) return
    const label = editingLeadType.label.trim()
    if (leadTypes.some((lt) => lt.id !== editingLeadType.id && lt.label.toLowerCase() === label.toLowerCase()))
      return
    try {
      const { error } = await supabase
        .from("lead_types")
        .update({ label })
        .eq("id", editingLeadType.id)

      if (error) throw error
      setLeadTypes((prev) =>
        prev.map((lt) => (lt.id === editingLeadType.id ? { ...lt, label } : lt))
      )
      setEditingLeadType(null)
      showSaved()
    } catch (err: unknown) {
      setLeadTypesError(err instanceof Error ? err.message : "Failed to update lead type")
    }
  }

  const handleDeleteLeadType = async (id: string) => {
    try {
      const { error } = await supabase.from("lead_types").delete().eq("id", id)
      if (error) throw error
      setLeadTypes((prev) => prev.filter((lt) => lt.id !== id))
      showSaved()
    } catch (err: unknown) {
      setLeadTypesError(err instanceof Error ? err.message : "Failed to delete lead type")
    }
  }

  const buildPermissionKey = (feature: string, action: string) => `${feature}:${action}`

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  )

  // Allow owners to edit all roles, including system roles
  const isProtectedRole = (role: Role) => false

  const loadRolesAndPermissions = async () => {
    setRolesLoading(true)
    setRolesError(null)

    const { data: rolesData, error: rolesErr } = await supabase
      .from("roles")
      .select("id,business_id,name,is_custom")
      .eq("business_id", businessId)
      .order("name")

    if (rolesErr) {
      setRolesError(rolesErr.message)
      setRolesLoading(false)
      return
    }

    const roleList = (rolesData || []) as Role[]
    setRoles(roleList)

    if (!selectedRoleId && roleList.length > 0) {
      setSelectedRoleId(roleList[0].id)
    }

    const roleIds = roleList.map((role) => role.id)
    if (roleIds.length === 0) {
      setPermissionsMap({})
      setRolesLoading(false)
      return
    }

    const { data: permissionsData, error: permissionsErr } = await supabase
      .from("permissions")
      .select("id,role_id,feature_type,action,allowed,visibility_flags")
      .in("role_id", roleIds)

    if (permissionsErr) {
      setRolesError(permissionsErr.message)
      setRolesLoading(false)
      return
    }

    const nextMap: Record<string, Record<string, boolean>> = {}
    roleIds.forEach((roleId) => {
      nextMap[roleId] = {}
      featureList.forEach((feature) => {
        permissionActions.forEach((action) => {
          nextMap[roleId][buildPermissionKey(feature.key, action)] = false
        })
      })
    })

    ;(permissionsData as Permission[]).forEach((permission) => {
      // Map legacy action names (view/edit) to CRUD names (read/update) for consistency
      const actionMap: Record<string, string> = { view: "read", edit: "update" }
      const action = actionMap[permission.action] || permission.action
      const key = buildPermissionKey(permission.feature_type, action)
      if (!nextMap[permission.role_id]) {
        nextMap[permission.role_id] = {}
      }
      // Use OR so legacy view/edit and new read/update both contribute
      nextMap[permission.role_id][key] = nextMap[permission.role_id][key] || permission.allowed
    })

    setPermissionsMap(nextMap)
    setRolesLoading(false)
  }

  useEffect(() => {
    loadRolesAndPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const togglePermission = (roleId: string, feature: string, action: string) => {
    const key = buildPermissionKey(feature, action)
    setPermissionsMap((prev) => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] || {}),
        [key]: !(prev[roleId]?.[key] ?? false),
      },
    }))
  }

  const toggleAllPermissionsForAction = (roleId: string, action: string) => {
    const allChecked = areAllPermissionsCheckedForAction(roleId, action)
    const newValue = !allChecked

    setPermissionsMap((prev) => {
      const updatedPermissions = { ...(prev[roleId] || {}) }
      featureList.forEach((feature) => {
        const key = buildPermissionKey(feature.key, action)
        updatedPermissions[key] = newValue
      })
      return {
        ...prev,
        [roleId]: updatedPermissions,
      }
    })
  }

  const areAllPermissionsCheckedForAction = (roleId: string, action: string) => {
    return featureList.every((feature) => {
      const key = buildPermissionKey(feature.key, action)
      return permissionsMap[roleId]?.[key] ?? false
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    setSavingPermissions(true)

    const rows = featureList.flatMap((feature) =>
      permissionActions.map((action) => ({
        role_id: selectedRole.id,
        feature_type: feature.key,
        action,
        allowed:
          permissionsMap[selectedRole.id]?.[buildPermissionKey(feature.key, action)] ?? false,
      }))
    )

    const { error } = await supabase
      .from("permissions")
      .upsert(rows, { onConflict: "role_id,feature_type,action" })

    if (error) {
      setRolesError(error.message)
      setSavingPermissions(false)
      return
    }

    setSavingPermissions(false)
    showSaved()
  }

  const handleCreateRole = async () => {
    const name = newRoleName.trim()
    if (!name) return

    const { data, error } = await supabase
      .from("roles")
      .insert([{ business_id: businessId, name, is_custom: true }])
      .select("id,business_id,name,is_custom")
      .single()

    if (error) {
      setRolesError(error.message)
      return
    }

    const newRole = data as Role
    setRoles((prev) => [...prev, newRole])
    setSelectedRoleId(newRole.id)
    setIsRoleModalOpen(false)
    setNewRoleName("")

    const rows = featureList.flatMap((feature) =>
      permissionActions.map((action) => ({
        role_id: newRole.id,
        feature_type: feature.key,
        action,
        allowed: false,
      }))
    )

    await supabase.from("permissions").insert(rows)
    loadRolesAndPermissions()
  }

  const handleEditRoleName = async () => {
    if (!editingRoleId) return
    const name = editingRoleName.trim()
    if (!name) return

    const { error } = await supabase.from("roles").update({ name }).eq("id", editingRoleId)
    if (error) {
      setRolesError(error.message)
      return
    }

    setRoles((prev) => prev.map((role) => (role.id === editingRoleId ? { ...role, name } : role)))
    setEditingRoleId(null)
    setEditingRoleName("")
    showSaved()
  }

  const handleDeleteRole = async () => {
    if (!deletingRole) return
    const { error } = await supabase.from("roles").delete().eq("id", deletingRole.id)
    if (error) {
      setRolesError(error.message)
      return
    }

    setRoles((prev) => prev.filter((role) => role.id !== deletingRole.id))
    if (selectedRoleId === deletingRole.id) {
      setSelectedRoleId(roles[0]?.id ?? null)
    }
    setDeletingRole(null)
    showSaved()
  }

  const handleRoleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(roles)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setRoles(items)
  }

  // Workspace actions
  const isOwner = currentWorkspace?.role === "owner"
  const isLastWorkspace = workspaces.length <= 1

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return
    if (deleteConfirmName !== currentWorkspace.name) return

    setIsWorkspaceActionLoading(true)
    setWorkspaceActionError(null)

    try {
      await deleteWorkspace(currentWorkspace.id)
      setIsDeleteWorkspaceOpen(false)
      setDeleteConfirmName("")
      // Navigate to workflow -- it will auto-select another workspace or show empty state
      router.push("/workflow")
    } catch (error: any) {
      console.error("Error deleting workspace:", error)
      setWorkspaceActionError(error.message || "Failed to delete workspace")
    } finally {
      setIsWorkspaceActionLoading(false)
    }
  }

  const handleRenameWorkspace = async () => {
    if (!currentWorkspace) return
    if (!renameWorkspaceName.trim()) return

    setIsWorkspaceActionLoading(true)
    setWorkspaceActionError(null)

    try {
      await renameWorkspace(currentWorkspace.id, renameWorkspaceName.trim())
      setIsRenameWorkspaceOpen(false)
      setRenameWorkspaceName("")
      showSaved()
    } catch (error: any) {
      console.error("Error renaming workspace:", error)
      setWorkspaceActionError(error.message || "Failed to rename workspace")
    } finally {
      setIsWorkspaceActionLoading(false)
    }
  }

  const handleLeaveWorkspace = async () => {
    if (!currentWorkspace) return

    setIsWorkspaceActionLoading(true)
    setWorkspaceActionError(null)

    try {
      await leaveWorkspace(currentWorkspace.id)
      setIsLeaveWorkspaceOpen(false)
      // Navigate to workflow -- it will auto-select another workspace or show empty state
      router.push("/workflow")
    } catch (error: any) {
      console.error("Error leaving workspace:", error)
      setWorkspaceActionError(error.message || "Failed to leave workspace")
    } finally {
      setIsWorkspaceActionLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto" style={{ padding: "var(--af-density-page-padding)", display: "flex", flexDirection: "column", gap: "var(--af-density-section-gap)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-[--af-text-secondary] mt-1">
              Manage workspace settings, roles, and team configuration
            </p>
          </div>
          {saved && (
            <Badge className="bg-[--af-success-bg] text-[--af-success-text] border border-[--af-success-border]">
              <Check className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>

        {/* Theme Section */}
        <div className="border border-[--af-border-default] rounded-lg">
          <div className="p-6 border-b border-[--af-border-default]">
            <h2 className="font-semibold">Theme</h2>
            <p className="text-sm text-[--af-text-secondary] mt-1">
              Choose how ArchaFlow looks on your device
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                {
                  mode: "system" as ThemeMode,
                  label: "System",
                  description: "Follows your OS preference",
                  icon: Monitor,
                },
                {
                  mode: "light" as ThemeMode,
                  label: "Light",
                  description: "Always use light theme",
                  icon: Sun,
                },
                {
                  mode: "dark" as ThemeMode,
                  label: "Dark",
                  description: "Always use dark theme",
                  icon: Moon,
                },
              ]).map((opt) => {
                const isSelected = themeMode === opt.mode
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => applyTheme(opt.mode)}
                    className={`group relative rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? "border-[--af-brand] bg-[--af-bg-surface-alt]"
                        : "border-[--af-border-default] hover:border-[--af-text-muted]"
                    }`}
                  >
                    {/* Theme preview */}
                    <div className="mb-3 overflow-hidden rounded-lg border border-[--af-border-default]">
                      {opt.mode === "system" ? (
                        <div className="flex h-[72px]">
                          <div className="w-1/2 bg-[#FAF9F7] p-2">
                            <div className="h-2 w-10 rounded bg-[#D4C8B8] mb-1.5" />
                            <div className="h-1.5 w-6 rounded bg-[#B8A99A]" />
                          </div>
                          <div className="w-1/2 bg-[#1C1917] p-2">
                            <div className="h-2 w-10 rounded bg-[#57534E] mb-1.5" />
                            <div className="h-1.5 w-6 rounded bg-[#78716C]" />
                          </div>
                        </div>
                      ) : opt.mode === "light" ? (
                        <div className="h-[72px] bg-[#FAF9F7] p-3">
                          <div className="h-2 w-16 rounded bg-[#44403C] mb-2" />
                          <div className="h-1.5 w-12 rounded bg-[#D4C8B8] mb-1.5" />
                          <div className="h-1.5 w-14 rounded bg-[#D4C8B8] mb-2" />
                          <div className="h-3 w-8 rounded bg-[#8B5E2A]" />
                        </div>
                      ) : (
                        <div className="h-[72px] bg-[#1C1917] p-3">
                          <div className="h-2 w-16 rounded bg-[#D6D3D1] mb-2" />
                          <div className="h-1.5 w-12 rounded bg-[#57534E] mb-1.5" />
                          <div className="h-1.5 w-14 rounded bg-[#57534E] mb-2" />
                          <div className="h-3 w-8 rounded bg-[#B8860B]" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4 text-[--af-text-secondary]" />
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-[--af-text-muted]">{opt.description}</p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-[--af-brand]"
                            : "border-[--af-text-muted]"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[--af-brand]" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Status banner */}
            <div className="flex items-center gap-3 rounded-lg bg-[--af-brand]/10 border border-[--af-brand]/20 px-4 py-3">
              <Monitor className="w-4 h-4 text-[--af-brand] shrink-0" />
              <div>
                <p className="text-sm font-medium text-[--af-brand]">
                  {themeMode === "system"
                    ? `System theme \u2014 currently ${effectiveTheme}`
                    : `${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} theme`}
                </p>
                <p className="text-xs text-[--af-text-muted]">
                  Changes are applied instantly across the entire app
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accent Color Section */}
        <div className="border border-[--af-border-default] rounded-lg">
          <div className="p-6 border-b border-[--af-border-default]">
            <h2 className="font-display font-semibold text-lg">Accent Color</h2>
            <p className="text-sm text-[--af-text-secondary] mt-1">
              Used for highlights, badges, and interactive elements
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {accentOptions.map((opt) => {
                const isSelected = accentColor === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => applyAccent(opt.id)}
                    className={`flex flex-col items-center gap-2.5 rounded-xl border-2 px-5 py-4 transition-all ${
                      isSelected
                        ? "border-[--af-brand] bg-[--af-bg-surface-alt]"
                        : "border-[--af-border-default] bg-[--af-bg-surface-alt] hover:border-[--af-text-muted]"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: opt.swatch }}
                    />
                    <span className={`text-xs font-medium ${isSelected ? "text-[--af-brand-text]" : "text-[--af-text-muted]"}`}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Density Section */}
        <div className="border border-[--af-border-default] rounded-lg">
          <div className="p-6 border-b border-[--af-border-default]">
            <h2 className="font-semibold">Density</h2>
            <p className="text-sm text-[--af-text-secondary] mt-1">
              Control how much content is shown at once by adjusting spacing
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                {
                  mode: "compact" as DensityMode,
                  label: "Compact",
                  description: "Tighter spacing, more content visible",
                  lines: [2, 2, 2, 2, 2],
                },
                {
                  mode: "default" as DensityMode,
                  label: "Default",
                  description: "Balanced spacing for everyday use",
                  lines: [3, 3, 3, 3],
                },
                {
                  mode: "comfortable" as DensityMode,
                  label: "Comfortable",
                  description: "Generous spacing, easier scanning",
                  lines: [4, 4, 4],
                },
              ]).map((opt) => {
                const isSelected = density === opt.mode
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => applyDensity(opt.mode)}
                    className={`group relative rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? "border-[--af-brand] bg-[--af-bg-surface-alt]"
                        : "border-[--af-border-default] hover:border-[--af-text-muted]"
                    }`}
                  >
                    {/* Density preview */}
                    <div className="mb-3 overflow-hidden rounded-lg border border-[--af-border-default] bg-[--af-bg-surface-alt] p-2">
                      <div className="flex flex-col" style={{ gap: `${opt.lines[0]}px` }}>
                        {opt.lines.map((h, i) => (
                          <div key={i} className="flex items-center" style={{ gap: `${h}px` }}>
                            <div className="w-3 h-3 rounded-sm bg-[--af-border-strong] shrink-0" />
                            <div className="h-2 rounded bg-[--af-border-strong] flex-1" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-[--af-text-muted]">{opt.description}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-[--af-brand]"
                            : "border-[--af-text-muted]"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[--af-brand]" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Roles & Permissions Section */}
        <div className="border border-[--af-border-default] rounded-lg">
          <div className="p-6 border-b border-[--af-border-default]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[--af-bg-surface-alt] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[--af-text-secondary]" />
              </div>
              <div>
                <h2 className="font-semibold">Roles & Permissions</h2>
                <p className="text-sm text-[--af-text-secondary]">
                  Control access to features across your business
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[--af-text-secondary]">
                Manage role access for this business
              </p>
              <Button size="sm" onClick={() => setIsRoleModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Role
              </Button>
            </div>

            {rolesError && (
              <div className="text-sm text-[--af-danger-text] bg-[--af-danger-bg] border border-[--af-danger-border] rounded-md p-3">
                {rolesError}
              </div>
            )}

            {rolesLoading ? (
              <div className="text-sm text-[--af-text-muted]">Loading roles...</div>
            ) : roles.length === 0 ? (
              <div className="text-sm text-[--af-text-muted]">
                No roles found for this business yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Roles list */}
                <DragDropContext onDragEnd={handleRoleDragEnd}>
                  <Droppable droppableId="roles-list">
                    {(provided) => (
                      <div
                        className="lg:col-span-1 space-y-2"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {roles.map((role, index) => {
                          const isSelected = role.id === selectedRoleId
                          const isProtected = isProtectedRole(role)
                          const isEditing = editingRoleId === role.id

                          return (
                            <Draggable key={role.id} draggableId={role.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`border rounded-lg px-3 py-2 group relative ${
                                    isSelected
                                      ? "border-foreground dark:border-white bg-[--af-bg-surface-alt]"
                                      : "border-[--af-border-default]"
                                  } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                                >
                                  {/* Drag handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-4 h-4 text-[--af-text-muted]" />
                                  </div>

                                  <div className="flex items-center justify-between gap-2">
                                    {isEditing ? (
                                      <div className="flex items-center gap-1 flex-1">
                                        <Input
                                          value={editingRoleName}
                                          onChange={(e) => setEditingRoleName(e.target.value)}
                                          onBlur={handleEditRoleName}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleEditRoleName()
                                            if (e.key === "Escape") {
                                              setEditingRoleId(null)
                                              setEditingRoleName("")
                                            }
                                          }}
                                          className="h-7 text-sm"
                                          autoFocus
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => setSelectedRoleId(role.id)}
                                        className="flex items-center gap-1 flex-1 cursor-pointer"
                                      >
                                        <span className="text-sm font-medium text-left">
                                          {role.name}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          disabled={isProtected}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingRoleId(role.id)
                                            setEditingRoleName(role.name)
                                          }}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-[--af-danger-text] hover:text-[--af-danger-text] hover:bg-[--af-danger-bg]"
                                      disabled={isProtected}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeletingRole(role)
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Permissions matrix */}
                <div className="lg:col-span-2 border border-[--af-border-default] rounded-lg">
                  <div className="px-4 py-3 border-b border-[--af-border-default] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedRole?.name || "Select a role"}
                      </p>
                      <p className="text-xs text-[--af-text-muted]">
                        Set access levels by feature
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadRolesAndPermissions}
                        disabled={rolesLoading}
                      >
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSavePermissions}
                        disabled={!selectedRole || savingPermissions || isProtectedRole(selectedRole)}
                      >
                        {savingPermissions ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {selectedRole ? (
                      <>
                        {/* Master CRUD row */}
                        <div className="border-b-2 border-[--af-border-default] pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold">Select All</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {permissionActions.map((action) => {
                              const allChecked = areAllPermissionsCheckedForAction(
                                selectedRole.id,
                                action
                              )
                              return (
                                <label
                                  key={`master-${action}`}
                                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                                >
                                  <Checkbox
                                    checked={allChecked}
                                    onCheckedChange={() =>
                                      toggleAllPermissionsForAction(selectedRole.id, action)
                                    }
                                    disabled={isProtectedRole(selectedRole)}
                                  />
                                  <span className="capitalize">{action}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        {/* Feature rows */}
                        {featureList.map((feature) => (
                          <div key={feature.key} className="border-b border-[--af-border-default]/50 dark:border-foreground pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">{feature.label}</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {permissionActions.map((action) => {
                                const key = buildPermissionKey(feature.key, action)
                                const isChecked =
                                  permissionsMap[selectedRole.id]?.[key] ?? false
                                return (
                                  <label
                                    key={`${feature.key}-${action}`}
                                    className="flex items-center gap-2 text-sm text-[--af-text-secondary]"
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() =>
                                        togglePermission(selectedRole.id, feature.key, action)
                                      }
                                      disabled={isProtectedRole(selectedRole)}
                                    />
                                    <span className="capitalize">{action}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-[--af-text-muted]">Select a role to edit permissions.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Types Section */}
        <div className="border border-[--af-border-default] rounded-lg">
          <div className="p-6 border-b border-[--af-border-default]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[--af-bg-surface-alt] flex items-center justify-center">
                <Target className="w-5 h-5 text-[--af-text-secondary]" />
              </div>
              <div>
                <h2 className="font-semibold">Lead Types</h2>
                <p className="text-sm text-[--af-text-secondary]">
                  Manage lead types for categorizing leads (e.g., Structural Engineering, Interior Design)
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[--af-text-secondary]">
                {leadTypes.length} lead types configured
              </p>
              <Button size="sm" onClick={() => setIsAddLeadTypeOpen(true)} disabled={!businessId}>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead Type
              </Button>
            </div>

            {leadTypesError && (
              <div className="text-sm text-[--af-danger-text] bg-[--af-danger-bg] border border-[--af-danger-border] rounded-md p-3">
                {leadTypesError}
              </div>
            )}

            {leadTypesLoading ? (
              <div className="text-sm text-[--af-text-muted]">Loading lead types...</div>
            ) : (
              <div className="space-y-2">
                {leadTypes.map((lt) => (
                  <div
                    key={lt.id}
                    className="flex items-center justify-between p-3 bg-[--af-bg-surface-alt] rounded-card border border-[--af-border-default]"
                  >
                    <span className="font-medium text-sm">{lt.label}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingLeadType({ id: lt.id, label: lt.label })}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[--af-danger-text] hover:text-[--af-danger-text] hover:bg-[--af-danger-bg]"
                        onClick={() => handleDeleteLeadType(lt.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Positions Section */}
        <div className="border border-[--af-border-default] rounded-lg">
          <div className="p-6 border-b border-[--af-border-default]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[--af-bg-surface-alt] flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[--af-text-secondary]" />
              </div>
              <div>
                <h2 className="font-semibold">Team Positions</h2>
                <p className="text-sm text-[--af-text-secondary]">
                  Manage job positions for your team members
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[--af-text-secondary]">
                {positions.length} positions configured
              </p>
              <Button size="sm" onClick={() => setIsAddPositionOpen(true)} disabled={!businessId}>
                <Plus className="w-4 h-4 mr-2" />
                Add Position
              </Button>
            </div>

            {positionsError && (
              <div className="text-sm text-[--af-danger-text] bg-[--af-danger-bg] border border-[--af-danger-border] rounded-md p-3">
                {positionsError}
              </div>
            )}

            {positionsLoading ? (
              <div className="text-sm text-[--af-text-muted]">Loading positions...</div>
            ) : (
              <div className="space-y-2">
                {positions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-[--af-bg-surface-alt] rounded-card border border-[--af-border-default]"
                  >
                    <span className="font-medium text-sm">{p.label}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingPosition({ id: p.id, label: p.label })}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[--af-danger-text] hover:text-[--af-danger-text] hover:bg-[--af-danger-bg]"
                        onClick={() => handleDeletePosition(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workspace Access Section (Owner/Admin only) */}
        {isOwner && (
          <div className="border border-[--af-border-default] rounded-lg">
            <div className="p-6 border-b border-[--af-border-default]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[--af-bg-surface-alt] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[--af-text-secondary]" />
                </div>
                <div>
                  <h2 className="font-semibold">Workspace Access</h2>
                  <p className="text-sm text-[--af-text-secondary]">
                    Control how new users can join this workspace
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {domainSettingsLoading ? (
                <div className="text-sm text-[--af-text-muted]">Loading...</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Allowed Email Domains</label>
                    <Input
                      placeholder="e.g., acme.com, vectorux.com"
                      value={allowedDomains}
                      onChange={(e) => setAllowedDomains(e.target.value)}
                    />
                    <p className="text-xs text-[--af-text-muted]">
                      Comma-separated list of email domains. Users with matching domains will see this workspace as &quot;Recommended&quot; when searching.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[--af-bg-surface-alt] rounded-lg">
                    <Checkbox
                      id="autoAddByDomain"
                      checked={autoAddByDomain}
                      onCheckedChange={(checked) => setAutoAddByDomain(checked as boolean)}
                    />
                    <div>
                      <label htmlFor="autoAddByDomain" className="text-sm font-medium cursor-pointer">
                        Auto-add users with matching email domain
                      </label>
                      <p className="text-xs text-[--af-text-muted] mt-0.5">
                        When enabled, users with a matching email domain will be automatically added to the workspace when they send a join request, without requiring manual approval.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSaveDomainSettings}
                      disabled={savingDomainSettings}
                    >
                      {savingDomainSettings ? "Saving..." : "Save Access Settings"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Billing & Plan Section */}
        {currentWorkspace && (
          <div className="border border-[--af-border-default] rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[--af-bg-surface-alt] flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[--af-text-secondary]" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Billing & Plan</h2>
                    <p className="text-sm text-[--af-text-secondary]">
                      Manage your subscription and billing details
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PlanBadge tier={currentWorkspace.planTier} />
                  <Button asChild size="sm" variant="outline">
                    <Link href="/settings/billing">
                      Manage
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Section */}
        {currentWorkspace && (
          <div className="border border-[--af-border-default] rounded-lg">
            <div className="p-6 border-b border-[--af-border-default]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[--af-bg-surface-alt] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[--af-text-secondary]" />
                </div>
                <div>
                  <h2 className="font-semibold">Workspace</h2>
                  <p className="text-sm text-[--af-text-secondary]">
                    Manage your current workspace
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Workspace info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[--af-bg-surface-alt] rounded-lg">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium">{currentWorkspace.name}</p>
                    <p className="text-sm text-[--af-text-secondary] mt-0.5">
                      Your role in this workspace
                    </p>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setRenameWorkspaceName(currentWorkspace.name)
                        setWorkspaceActionError(null)
                        setIsRenameWorkspaceOpen(true)
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <Badge className="capitalize bg-[--af-bg-surface-alt] dark:bg-warm-800 text-[--af-text-secondary] dark:text-[--af-text-muted]">
                  {currentWorkspace.role}
                </Badge>
              </div>

              {/* Owner: Delete workspace */}
              {isOwner && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-[--af-danger-border] rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-[--af-danger-text]">Delete Workspace</p>
                    <p className="text-xs text-[--af-text-secondary] mt-0.5">
                      Permanently delete this workspace and all its data including projects, clients, and team members.
                      {isLastWorkspace && " This is your only workspace -- a new one will be created on next login."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="text-[--af-danger-text] border-[--af-danger-border] hover:bg-[--af-danger-bg]  shrink-0"
                    onClick={() => {
                      setIsDeleteWorkspaceOpen(true)
                      setDeleteConfirmName("")
                      setWorkspaceActionError(null)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}

              {/* Non-owner: Leave workspace */}
              {!isOwner && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-orange-200 dark:border-orange-900/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-orange-600 dark:text-orange-400">Leave Workspace</p>
                    <p className="text-xs text-[--af-text-secondary] mt-0.5">
                      Remove yourself from this workspace. You will lose access to all projects and data.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-900/30 dark:hover:bg-orange-900/10 shrink-0"
                    onClick={() => {
                      setIsLeaveWorkspaceOpen(true)
                      setWorkspaceActionError(null)
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* New Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Add a new role for this business.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <label className="text-sm font-medium">Role name</label>
            <Input
              placeholder="e.g., Editor"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation */}
      <Dialog open={!!deletingRole} onOpenChange={() => setDeletingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              This will permanently remove the role and its permissions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRole(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[--af-danger-text] text-white hover:opacity-90"
              onClick={handleDeleteRole}
            >
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Position Modal */}
      <Dialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Position</DialogTitle>
            <DialogDescription>
              Create a new job position for your team members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Position Name</label>
              <Input
                placeholder="e.g., Senior Architect"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddPosition()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPositionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPosition} disabled={!newPosition.trim()}>
              Add Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lead Type Modal */}
      <Dialog open={isAddLeadTypeOpen} onOpenChange={setIsAddLeadTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead Type</DialogTitle>
            <DialogDescription>
              Create a new lead type for categorizing leads (e.g., Structural Engineering, Interior Design).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lead Type Name</label>
              <Input
                placeholder="e.g., Structural Engineering"
                value={newLeadType}
                onChange={(e) => setNewLeadType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddLeadType()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLeadTypeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLeadType} disabled={!newLeadType.trim()}>
              Add Lead Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Type Modal */}
      <Dialog open={!!editingLeadType} onOpenChange={() => setEditingLeadType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead Type</DialogTitle>
            <DialogDescription>
              Update the lead type name.
            </DialogDescription>
          </DialogHeader>
          {editingLeadType && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead Type Name</label>
                <Input
                  value={editingLeadType.label}
                  onChange={(e) =>
                    setEditingLeadType({ ...editingLeadType, label: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEditLeadType()
                    }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLeadType(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditLeadType}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Position Modal */}
      <Dialog open={!!editingPosition} onOpenChange={() => setEditingPosition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update the position name.
            </DialogDescription>
          </DialogHeader>
          {editingPosition && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Position Name</label>
                <Input
                  value={editingPosition.label}
                  onChange={(e) =>
                    setEditingPosition({ ...editingPosition, label: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEditPosition()
                    }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPosition(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditPosition}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Confirmation */}
      <Dialog open={isDeleteWorkspaceOpen} onOpenChange={(open) => {
        setIsDeleteWorkspaceOpen(open)
        if (!open) {
          setDeleteConfirmName("")
          setWorkspaceActionError(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              This will permanently delete the workspace <strong>{currentWorkspace?.name}</strong> and all its data, including:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <ul className="text-sm text-[--af-text-secondary] space-y-1 list-disc list-inside">
              <li>All projects and project data</li>
              <li>All clients and client contacts</li>
              <li>All team member access and roles</li>
              <li>All permissions and settings</li>
            </ul>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <strong>{currentWorkspace?.name}</strong> to confirm
              </label>
              <Input
                placeholder="Workspace name"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>
            {workspaceActionError && (
              <p className="text-sm text-[--af-danger-text]">{workspaceActionError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteWorkspaceOpen(false)}
              disabled={isWorkspaceActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={isWorkspaceActionLoading || deleteConfirmName !== currentWorkspace?.name}
            >
              {isWorkspaceActionLoading ? "Deleting..." : "Delete Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Workspace Confirmation */}
      <Dialog open={isLeaveWorkspaceOpen} onOpenChange={(open) => {
        setIsLeaveWorkspaceOpen(open)
        if (!open) setWorkspaceActionError(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave <strong>{currentWorkspace?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-[--af-text-secondary]">
              You will immediately lose access to all projects, clients, and data in this workspace. You will be removed from the team list. To rejoin, an owner or admin will need to invite you again.
            </p>
            {workspaceActionError && (
              <p className="text-sm text-[--af-danger-text]">{workspaceActionError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLeaveWorkspaceOpen(false)}
              disabled={isWorkspaceActionLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleLeaveWorkspace}
              disabled={isWorkspaceActionLoading}
            >
              {isWorkspaceActionLoading ? "Leaving..." : "Leave Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Workspace Dialog */}
      <Dialog open={isRenameWorkspaceOpen} onOpenChange={(open) => {
        setIsRenameWorkspaceOpen(open)
        if (!open) {
          setRenameWorkspaceName("")
          setWorkspaceActionError(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
            <DialogDescription>
              Enter a new name for your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <Input
                placeholder="My Workspace"
                value={renameWorkspaceName}
                onChange={(e) => setRenameWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameWorkspace()
                }}
              />
            </div>
            {workspaceActionError && (
              <p className="text-sm text-[--af-danger-text]">{workspaceActionError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameWorkspaceOpen(false)}
              disabled={isWorkspaceActionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameWorkspace}
              disabled={isWorkspaceActionLoading || !renameWorkspaceName.trim() || renameWorkspaceName.trim() === currentWorkspace?.name}
            >
              {isWorkspaceActionLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
