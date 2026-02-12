"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Shield,
  Users,
  Mail,
  Settings as SettingsIcon,
  Plug,
  CreditCard,
  Edit,
  Trash2,
  Check,
  X,
  Upload,
  Download,
  TrendingUp,
  ChevronRight,
} from "lucide-react"

// Mock Data
interface User {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "member"
  status: "active" | "inactive"
  lastLogin: string
}

// No mock data - clean slate for new users
const mockUsers: User[] = []

const mockInvoices: any[] = []

export default function AdminPage() {
  const [users, setUsers] = useState(mockUsers)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [inviteEmails, setInviteEmails] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member")
  const [inviteMessage, setInviteMessage] = useState("")
  const [inviteSent, setInviteSent] = useState(false)

  // Role check (placeholder - implement with real auth)
  const currentUserRole = "admin" // This would come from auth context

  if (currentUserRole !== "admin") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access team management.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const handleRoleChange = (userId: string, newRole: "admin" | "manager" | "member") => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
  }

  const handleStatusToggle = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    )
  }

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setDeleteConfirm(null)
  }

  const handleSendInvites = () => {
    setInviteSent(true)
    setTimeout(() => {
      setInviteSent(false)
      setInviteEmails("")
      setInviteMessage("")
    }, 3000)
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Workflow</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-gray-100">Team Management</span>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Team Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage users, integrations, and system settings
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="invite" className="gap-2">
              <Mail className="w-4 h-4" />
              Invite Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: any) => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleStatusToggle(user.id)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            user.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-700"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              user.status === "active"
                                ? "translate-x-5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.lastLogin}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(user.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Invite Users Tab */}
          <TabsContent value="invite" className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 max-w-2xl">
              <h3 className="font-semibold mb-4">Invite Team Members</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Addresses</label>
                  <Textarea
                    placeholder="Enter email addresses (one per line or comma-separated)"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">
                    Separate multiple emails with commas or new lines
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value: any) => setInviteRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                      <SelectItem value="manager">Manager - Can manage projects</SelectItem>
                      <SelectItem value="member">Member - Basic access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Message (Optional)</label>
                  <Textarea
                    placeholder="Add a personal message to the invitation..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <Button
                  onClick={handleSendInvites}
                  disabled={!inviteEmails.trim()}
                  className="w-full"
                >
                  {inviteSent ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Invitations Sent!
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitations
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Company Branding */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Company Branding</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Logo</label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input defaultValue="ArchaFlow Inc." />
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    "New user signups",
                    "Payment notifications",
                    "System alerts",
                    "Weekly reports",
                  ].map((pref) => (
                    <div key={pref} className="flex items-center justify-between">
                      <span className="text-sm">{pref}</span>
                      <button className="relative w-11 h-6 rounded-full bg-black dark:bg-white">
                        <div className="absolute top-0.5 translate-x-5 w-5 h-5 rounded-full bg-white dark:bg-black" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Export */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Data Export</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Export all your data including projects, clients, and invoices
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            {/* Current Plan */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Professional Plan</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    $49/month • Renews on March 15, 2026
                  </p>
                </div>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  Active
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Projects
                  </p>
                  <p className="text-2xl font-semibold">9 / 50</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Team Members
                  </p>
                  <p className="text-2xl font-semibold">4 / 10</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Storage</p>
                  <p className="text-2xl font-semibold">12 / 100 GB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button variant="outline">Manage Subscription</Button>
              </div>
            </div>

            {/* Invoice History */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold">Invoice History</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {new Date(invoice.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${invoice.amount}.00
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Modal */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information and permissions.</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input defaultValue={editingUser.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" defaultValue={editingUser.email} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select defaultValue={editingUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => setEditingUser(null)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDeleteUser(deleteConfirm)}
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
