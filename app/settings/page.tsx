"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
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
  Bell,
  Lock,
  CreditCard,
  Palette,
  Check,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  Shield,
  GripVertical,
  Building2,
  LogOut,
} from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { currentWorkspace, workspaces, user, deleteWorkspace, leaveWorkspace, renameWorkspace } = useAuth()
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [saved, setSaved] = useState(false)

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

  useEffect(() => {
    // Check current theme on mount
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    showSaved()
  }

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
      // Navigate to dashboard -- it will auto-select another workspace or show empty state
      router.push("/dashboard")
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
      // Navigate to dashboard -- it will auto-select another workspace or show empty state
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error leaving workspace:", error)
      setWorkspaceActionError(error.message || "Failed to leave workspace")
    } finally {
      setIsWorkspaceActionLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your account preferences and settings
            </p>
          </div>
          {saved && (
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              <Check className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>

        {/* Appearance Section */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold">Appearance</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize how ArchaFlow looks
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Theme</label>
              <div className="grid grid-cols-2 gap-4">
                {/* Light Theme Option */}
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`relative p-4 border-2 rounded-lg transition-all ${
                    theme === "light"
                      ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Light</span>
                      {theme === "light" && (
                        <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center">
                          <Check className="w-3 h-3 text-white dark:text-black" />
                        </div>
                      )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-3 space-y-2">
                      <div className="h-2 bg-gray-900 rounded w-1/2"></div>
                      <div className="h-1.5 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-1.5 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                </button>

                {/* Dark Theme Option */}
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`relative p-4 border-2 rounded-lg transition-all ${
                    theme === "dark"
                      ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Dark</span>
                      {theme === "dark" && (
                        <div className="w-5 h-5 rounded-full bg-black dark:bg-white flex items-center justify-center">
                          <Check className="w-3 h-3 text-white dark:text-black" />
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-md p-3 space-y-2">
                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                      <div className="h-1.5 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-1.5 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Choose your preferred color scheme. Changes apply immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold">Notifications</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your notification preferences
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              {
                title: "Email Notifications",
                description: "Receive email updates about your projects",
                enabled: true,
              },
              {
                title: "Project Updates",
                description: "Get notified when project status changes",
                enabled: true,
              },
              {
                title: "Payment Reminders",
                description: "Receive reminders for pending invoices",
                enabled: true,
              },
              {
                title: "Team Activity",
                description: "Get notified about team member actions",
                enabled: false,
              },
            ].map((notification) => (
              <div
                key={notification.title}
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-900 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {notification.description}
                  </p>
                </div>
                <button
                  onClick={showSaved}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notification.enabled
                      ? "bg-black dark:bg-white"
                      : "bg-gray-200 dark:bg-gray-800"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${
                      notification.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Roles & Permissions Section */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold">Roles & Permissions</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control access to features across your business
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage role access for this business
              </p>
              <Button size="sm" onClick={() => setIsRoleModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Role
              </Button>
            </div>

            {rolesError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-3">
                {rolesError}
              </div>
            )}

            {rolesLoading ? (
              <div className="text-sm text-gray-500">Loading roles...</div>
            ) : roles.length === 0 ? (
              <div className="text-sm text-gray-500">
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
                                      ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                                      : "border-gray-200 dark:border-gray-800"
                                  } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                                >
                                  {/* Drag handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-4 h-4 text-gray-400" />
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
                                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedRole?.name || "Select a role"}
                      </p>
                      <p className="text-xs text-gray-500">
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
                        <div className="border-b-2 border-gray-200 dark:border-gray-800 pb-4">
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
                                  className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100"
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
                          <div key={feature.key} className="border-b border-gray-100 dark:border-gray-900 pb-4 last:border-0 last:pb-0">
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
                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
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
                      <p className="text-sm text-gray-500">Select a role to edit permissions.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Positions Section */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold">Team Positions</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage job positions for your team members
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {positions.length} positions configured
              </p>
              <Button size="sm" onClick={() => setIsAddPositionOpen(true)} disabled={!businessId}>
                <Plus className="w-4 h-4 mr-2" />
                Add Position
              </Button>
            </div>

            {positionsError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md p-3">
                {positionsError}
              </div>
            )}

            {positionsLoading ? (
              <div className="text-sm text-gray-500">Loading positions...</div>
            ) : (
              <div className="space-y-2">
                {positions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
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
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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

        {/* Security Section */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold">Security</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your password and security settings
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={showSaved}>
                Update Password
              </Button>
            </div>
          </div>
        </div>

        {/* Billing Section */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold">Billing</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your subscription and payment methods
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <p className="font-medium">Professional Plan</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  $49/month • Renews on March 15, 2026
                </p>
              </div>
              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                Active
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Update Plan
              </Button>
              <Button variant="outline" className="flex-1">
                Manage Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Workspace Section */}
        {currentWorkspace && (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Workspace</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your current workspace
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Workspace info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium">{currentWorkspace.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
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
                <Badge className="capitalize bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {currentWorkspace.role}
                </Badge>
              </div>

              {/* Owner: Delete workspace */}
              {isOwner && (
                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-red-600 dark:text-red-400">Delete Workspace</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Permanently delete this workspace and all its data including projects, clients, and team members.
                      {isLastWorkspace && " This is your only workspace -- a new one will be created on next login."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 shrink-0 ml-4"
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
                <div className="flex items-center justify-between p-4 border border-orange-200 dark:border-orange-900/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-orange-600 dark:text-orange-400">Leave Workspace</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Remove yourself from this workspace. You will lose access to all projects and data.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-900/30 dark:hover:bg-orange-900/10 shrink-0 ml-4"
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

        {/* Danger Zone */}
        <div className="border border-red-200 dark:border-red-900/30 rounded-lg">
          <div className="p-6 border-b border-red-200 dark:border-red-900/30">
            <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Irreversible actions
            </p>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Delete Account</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10">
                Delete
              </Button>
            </div>
          </div>
        </div>
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
              className="bg-red-600 text-white hover:bg-red-700"
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
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
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
              <p className="text-sm text-red-600">{workspaceActionError}</p>
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You will immediately lose access to all projects, clients, and data in this workspace. You will be removed from the team list. To rejoin, an owner or admin will need to invite you again.
            </p>
            {workspaceActionError && (
              <p className="text-sm text-red-600">{workspaceActionError}</p>
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
              <p className="text-sm text-red-600">{workspaceActionError}</p>
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
    </DashboardLayout>
  )
}
