"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  Users,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  XCircle,
  Search,
  Shield,
  Mail,
  Phone,
  Clock,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { uploadAvatar } from "@/lib/supabase/storage"
import { AvatarPickerDialog } from "@/components/profile/avatar-picker-dialog"

const AvatarCropModal = dynamic(
  () => import("@/components/profile/avatar-crop-modal").then((m) => ({ default: m.AvatarCropModal })),
  { ssr: false }
)

// Types
interface TeamMember {
  userId: string
  userRoleId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  avatarUrl: string
  roleName: string
  roleId: string
  position: string
  assignedAt: string
  type: "member"
}

interface PendingInvite {
  id: string
  email: string
  roleName: string
  roleId: string
  position: string
  message: string
  invitedBy: string
  createdAt: string
  expiresAt: string
  type: "pending"
}

type TeamRow = TeamMember | PendingInvite

interface WorkspaceRole {
  id: string
  name: string
  isCustom: boolean
}

const fallbackPositions = [
  "Architect",
  "Manager",
  "Drafter",
  "Sales Agent",
  "Project Manager",
  "Designer",
  "Engineer",
  "Intern",
]

const roleColors: Record<string, string> = {
  Owner: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Admin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Editor: "bg-green-500/10 text-green-600 border-green-500/20",
  Viewer: "bg-gray-500/10 text-gray-500 border-gray-500/20",
}

export default function TeamsPage() {
  const { currentWorkspace, user, workspacesLoaded } = useAuth()
  const businessId = currentWorkspace?.id
  const currentUserRole = currentWorkspace?.role

  // Data state
  const [members, setMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [roles, setRoles] = useState<WorkspaceRole[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState("")
  const [invitePosition, setInvitePosition] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  // Edit member modal state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editAvatarUrl, setEditAvatarUrl] = useState("")
  const [editPosition, setEditPosition] = useState("")
  const [editRoleId, setEditRoleId] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null)
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Remove member / cancel invite
  const [removeConfirm, setRemoveConfirm] = useState<{ type: "member" | "invite"; id: string; name: string } | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const isOwnerOrAdmin = currentUserRole === "owner" || currentUserRole === "admin"

  // Load data
  useEffect(() => {
    if (businessId) {
      loadTeamData()
    } else if (workspacesLoaded) {
      setIsLoading(false)
    }
  }, [businessId, workspacesLoaded])

  // Reload data when session is refreshed (e.g. after returning from idle tab)
  useEffect(() => {
    const onSessionRefreshed = () => {
      if (businessId) loadTeamData()
    }
    window.addEventListener("session-refreshed", onSessionRefreshed)
    return () => window.removeEventListener("session-refreshed", onSessionRefreshed)
  }, [businessId])

  const loadTeamData = async () => {
    if (!businessId) return
    setIsLoading(true)
    setLoadError(null)

    try {
      // 1. Load roles for this workspace
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, name, is_custom")
        .eq("business_id", businessId)
        .order("name")

      if (rolesError) throw rolesError

      const workspaceRoles: WorkspaceRole[] = (rolesData || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        isCustom: r.is_custom,
      }))
      setRoles(workspaceRoles)

      // 2. Load positions from business_positions (Settings → Team Positions)
      const { data: positionsData } = await supabase
        .from("business_positions")
        .select("label")
        .eq("business_id", businessId)
        .order("order_index", { ascending: true })
      setPositions((positionsData || []).map((p: { label: string }) => p.label))

      // 3. Load members via API (includes emails and works with RLS)
      const membersRes = await authFetch(`/api/teams/members?businessId=${encodeURIComponent(businessId)}`)
      if (!membersRes.ok) {
        const errData = await membersRes.json().catch(() => ({}))
        console.error("Error loading members:", membersRes.status, errData)
        setMembers([])
        setLoadError((prev) => (prev ? `${prev} ` : "") + (errData.error || "Could not load members."))
      } else {
        const memberList: TeamMember[] = await membersRes.json()
        setMembers(Array.isArray(memberList) ? memberList : [])
      }

      // 4. Load pending invitations via API (server-side so list is not blocked by RLS)
      const invRes = await authFetch(`/api/teams/invitations?businessId=${encodeURIComponent(businessId)}`)
      if (!invRes.ok) {
        console.error("Error loading pending invitations:", invRes.status)
        setPendingInvites([])
        setLoadError((prev) => (prev ? `${prev} ` : "") + "Could not load pending invitations.")
      } else {
        const invData = await invRes.json()
        const invites: PendingInvite[] = (Array.isArray(invData) ? invData : []).map((inv: any) => ({
          id: inv.id,
          email: inv.email,
          roleName: inv.roleName || "Unknown",
          roleId: inv.roleId,
          position: inv.position || "",
          message: inv.message || "",
          invitedBy: inv.invitedBy,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
          type: "pending" as const,
        }))
        setPendingInvites(invites)
      }
    } catch (error: any) {
      console.error("Error loading team data:", error)
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Send invitation
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteRoleId || !businessId) return
    setIsSendingInvite(true)
    setInviteError(null)
    setInviteSuccess(null)

    try {
      const response = await authFetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          roleId: inviteRoleId,
          businessId,
          position: invitePosition.trim() || null,
          message: inviteMessage.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }

      setInviteSuccess(
        data.resent
          ? `Invitation resent to ${inviteEmail.trim()}`
          : `Invitation sent to ${inviteEmail.trim()}`
      )
      setInviteEmail("")
      setInvitePosition("")
      setInviteMessage("")

      // Reload data so the new pending invite appears in the table
      await loadTeamData()
      // Fallback refetch in case the first load was ahead of the insert
      setTimeout(() => loadTeamData(), 500)

      // Close after a brief delay to show success
      setTimeout(() => {
        setIsInviteOpen(false)
        setInviteSuccess(null)
      }, 1500)
    } catch (error: any) {
      setInviteError(error.message)
    } finally {
      setIsSendingInvite(false)
    }
  }

  // Resend invitation
  const handleResendInvite = async (invitationId: string) => {
    try {
      const response = await authFetch("/api/invite/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend invitation")
      }

      toast.success("Invitation resent successfully!")
    } catch (error: any) {
      toast.error("Failed to resend: " + error.message)
    }
  }

  // Cancel invitation
  const handleCancelInvite = async () => {
    if (!removeConfirm || removeConfirm.type !== "invite") return
    setIsRemoving(true)

    try {
      const { error } = await supabase
        .from("workspace_invitations")
        .delete()
        .eq("id", removeConfirm.id)

      if (error) throw error
      await loadTeamData()
      setRemoveConfirm(null)
    } catch (error: any) {
      toast.error("Failed to cancel invitation: " + error.message)
    } finally {
      setIsRemoving(false)
    }
  }

  // Remove member
  const handleRemoveMember = async () => {
    if (!removeConfirm || removeConfirm.type !== "member") return
    setIsRemoving(true)

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", removeConfirm.id)

      if (error) throw error
      await loadTeamData()
      setRemoveConfirm(null)
    } catch (error: any) {
      toast.error("Failed to remove member: " + error.message)
    } finally {
      setIsRemoving(false)
    }
  }

  // Open edit modal
  const openEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setEditFirstName(member.firstName)
    setEditLastName(member.lastName)
    setEditPhone(member.phone)
    setEditAvatarUrl(member.avatarUrl)
    setEditPosition(member.position)
    setEditRoleId(member.roleId)
    setEditError(null)
    setIsEditOpen(true)
  }

  // Save edit (via API so owner/admin can update any member)
  const handleSaveEdit = async () => {
    if (!editingMember) return
    setIsSavingEdit(true)
    setEditError(null)

    try {
      const res = await authFetch("/api/teams/members/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingMember.userId,
          userRoleId: editingMember.userRoleId,
          firstName: editFirstName.trim() || null,
          lastName: editLastName.trim() || null,
          phone: editPhone.trim() || null,
          avatarUrl: editAvatarUrl.trim() || null,
          position: editPosition.trim() || null,
          roleId: editRoleId,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to save")
      }

      await loadTeamData()
      setIsEditOpen(false)
    } catch (error: any) {
      setEditError(error.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handlePresetSelect = (url: string) => {
    setEditAvatarUrl(url)
    setIsAvatarPickerOpen(false)
  }

  const handleFileSelected = (file: File) => {
    setEditError(null)
    setIsAvatarPickerOpen(false)
    setAvatarCropFile(file)
  }

  const handleAvatarCropConfirm = async (croppedFile: File) => {
    if (!editingMember?.userId) return
    setAvatarCropFile(null)
    setAvatarUploading(true)
    setEditError(null)
    try {
      const { url } = await uploadAvatar(croppedFile, editingMember.userId)
      const cacheBustedUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`
      setEditAvatarUrl(cacheBustedUrl)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { url: cacheBustedUrl } }))
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to upload avatar")
    } finally {
      setAvatarUploading(false)
    }
  }

  // Filter
  const allRows: TeamRow[] = useMemo(() => {
    const combined: TeamRow[] = [...members, ...pendingInvites]
    if (!searchQuery) return combined

    const q = searchQuery.toLowerCase()
    return combined.filter((row) => {
      if (row.type === "member") {
        return (
          `${row.firstName} ${row.lastName}`.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.position.toLowerCase().includes(q) ||
          row.roleName.toLowerCase().includes(q)
        )
      } else {
        return (
          row.email.toLowerCase().includes(q) ||
          row.roleName.toLowerCase().includes(q)
        )
      }
    })
  }, [members, pendingInvites, searchQuery])

  // Set default invite role to first non-Owner role
  useEffect(() => {
    if (roles.length > 0 && !inviteRoleId) {
      const defaultRole = roles.find((r) => r.name === "Editor") || roles.find((r) => r.name !== "Owner")
      if (defaultRole) setInviteRoleId(defaultRole.id)
    }
  }, [roles])

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading team...</div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Empty state
  if (members.length === 0 && pendingInvites.length === 0 && !searchQuery) {
    return (
      <AppLayout>
        <div className="p-6">
          {loadError && (
            <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
              {loadError}
            </div>
          )}
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Invite team members to collaborate in this workspace"
            action={
              isOwnerOrAdmin
                ? { label: "Invite Team Member", onClick: () => setIsInviteOpen(true) }
                : undefined
            }
          />
          {renderInviteModal()}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Team</h1>
            <p className="text-sm text-gray-500 mt-1">
              {members.length} member{members.length !== 1 ? "s" : ""}
              {pendingInvites.length > 0 && `, ${pendingInvites.length} pending`}
            </p>
          </div>
          {isOwnerOrAdmin && (
            <Button onClick={() => setIsInviteOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Position</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRows.map((row) => {
                if (row.type === "member") {
                  const member = row as TeamMember
                  const displayName = `${member.firstName} ${member.lastName}`.trim() || "Unnamed"
                  const initials = `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase() || "?"
                  const isCurrentUser = member.userId === user?.id
                  const isOwnerRow = member.roleName === "Owner"

                  return (
                    <TableRow key={`member-${member.userRoleId}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {displayName}
                              {isCurrentUser && (
                                <span className="text-xs text-gray-400 ml-1">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 sm:hidden">
                              {member.email || member.userId.substring(0, 12) + "..."}
                            </p>
                            {member.phone && (
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {member.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-gray-600 dark:text-gray-400">
                        {member.email || member.userId.substring(0, 12) + "..."}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">
                        {member.position || "---"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[member.roleName] || roleColors.Viewer} border text-xs`}>
                          {member.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border text-xs">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        {new Date(member.assignedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {(isOwnerOrAdmin || isCurrentUser) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditMember(member)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Profile
                              </DropdownMenuItem>
                              {isOwnerOrAdmin && !isOwnerRow && !isCurrentUser && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      setRemoveConfirm({
                                        type: "member",
                                        id: member.userRoleId,
                                        name: displayName,
                                      })
                                    }
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove from Workspace
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                } else {
                  const invite = row as PendingInvite
                  const isExpired = new Date(invite.expiresAt) < new Date()

                  return (
                    <TableRow key={`invite-${invite.id}`} className="bg-gray-50/50 dark:bg-gray-900/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 text-xs">
                              <Mail className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-gray-500">Invited User</p>
                            <p className="text-xs text-gray-400 sm:hidden">{invite.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{invite.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">
                        {invite.position || "---"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[invite.roleName] || roleColors.Viewer} border text-xs`}>
                          {invite.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          className={`border text-xs ${
                            isExpired
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          }`}
                        >
                          {isExpired ? "Expired" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isOwnerOrAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResendInvite(invite.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  setRemoveConfirm({
                                    type: "invite",
                                    id: invite.id,
                                    name: invite.email,
                                  })
                                }
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                }
              })}
              {allRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                    {searchQuery ? "No team members match your search." : "No team members found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* Invite Modal */}
        {renderInviteModal()}

        <AvatarCropModal
          file={avatarCropFile}
          onConfirm={handleAvatarCropConfirm}
          onCancel={() => setAvatarCropFile(null)}
        />
        <AvatarPickerDialog
          open={isAvatarPickerOpen}
          onOpenChange={setIsAvatarPickerOpen}
          onSelectPreset={handlePresetSelect}
          onFileSelected={handleFileSelected}
          onValidationError={setEditError}
          isUploading={avatarUploading}
        />

        {/* Edit Member Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update profile information and role for this team member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerOpen(true)}
                    disabled={avatarUploading}
                    className="block rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2"
                  >
                    <Avatar className="w-16 h-16 cursor-pointer hover:opacity-90 transition-opacity">
                      <AvatarImage src={editAvatarUrl} />
                      <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-lg">
                        {`${editFirstName?.[0] || ""}${editLastName?.[0] || ""}`.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerOpen(true)}
                    disabled={avatarUploading}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                  >
                    {avatarUploading ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to change photo. Choose from presets or upload your own.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <Select value={editPosition} onValueChange={setEditPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {(positions.length > 0 ? positions : fallbackPositions).map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isOwnerOrAdmin && editingMember?.roleName !== "Owner" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={editRoleId} onValueChange={setEditRoleId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((r) => r.name !== "Owner")
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Changing the role will update this member&apos;s permissions.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              {editError && <p className="text-sm text-red-600 flex-1">{editError}</p>}
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSavingEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove / Cancel Confirmation */}
        <Dialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {removeConfirm?.type === "invite" ? "Cancel Invitation?" : "Remove Team Member?"}
              </DialogTitle>
              <DialogDescription>
                {removeConfirm?.type === "invite"
                  ? `This will cancel the pending invitation to ${removeConfirm?.name}.`
                  : `This will remove ${removeConfirm?.name} from this workspace. They will lose access to all workspace data.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveConfirm(null)} disabled={isRemoving}>
                Keep
              </Button>
              <Button
                variant="destructive"
                onClick={removeConfirm?.type === "invite" ? handleCancelInvite : handleRemoveMember}
                disabled={isRemoving}
              >
                {isRemoving
                  ? "Removing..."
                  : removeConfirm?.type === "invite"
                    ? "Cancel Invitation"
                    : "Remove Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )

  function renderInviteModal() {
    return (
      <Dialog
        open={isInviteOpen}
        onOpenChange={(open) => {
          setIsInviteOpen(open)
          if (!open) {
            setInviteError(null)
            setInviteSuccess(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this workspace. They&apos;ll receive an email with a link to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role *</label>
              <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r.name !== "Owner")
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Select value={invitePosition} onValueChange={setInvitePosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {(positions.length > 0 ? positions : fallbackPositions).map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message (Optional)</label>
              <Textarea
                placeholder="Add a personal message to the invitation..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            {inviteError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600">
                {inviteSuccess}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)} disabled={isSendingInvite}>
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={isSendingInvite || !inviteEmail.trim() || !inviteRoleId}
            >
              {isSendingInvite ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
}
