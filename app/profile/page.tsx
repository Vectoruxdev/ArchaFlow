"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { uploadAvatar } from "@/lib/supabase/storage"
import {
  User,
  Palette,
  Lock,
  Bell,
  Check,
  Upload,
  Trash2,
} from "lucide-react"

type NotificationPrefs = {
  email_notifications: boolean
  project_updates: boolean
  payment_reminders: boolean
  team_activity: boolean
}

const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  email_notifications: true,
  project_updates: true,
  payment_reminders: true,
  team_activity: false,
}

import { AvatarPickerDialog } from "@/components/profile/avatar-picker-dialog"

const AvatarCropModal = dynamic(
  () => import("@/components/profile/avatar-crop-modal").then((m) => ({ default: m.AvatarCropModal })),
  { ssr: false }
)

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS)
  const [saved, setSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [passwordNew, setPasswordNew] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null)
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)

  useEffect(() => {
    if (user && !authLoading) {
      loadProfile()
      loadNotificationPrefs()
    }
  }, [user?.id, authLoading])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const loadProfile = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, phone, avatar_url")
        .eq("id", user.id)
        .single()

      if (!error && data) {
        setFirstName((data as { first_name?: string }).first_name || "")
        setLastName((data as { last_name?: string }).last_name || "")
        setPhone((data as { phone?: string }).phone || "")
        setAvatarUrl((data as { avatar_url?: string }).avatar_url || "")
      }
    } catch {
      /* ignore */
    }
  }

  const loadNotificationPrefs = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("email_notifications, project_updates, payment_reminders, team_activity")
        .eq("user_id", user.id)
        .single()

      if (!error && data) {
        setNotifPrefs({
          email_notifications: (data as NotificationPrefs).email_notifications ?? true,
          project_updates: (data as NotificationPrefs).project_updates ?? true,
          payment_reminders: (data as NotificationPrefs).payment_reminders ?? true,
          team_activity: (data as NotificationPrefs).team_activity ?? false,
        })
      }
    } catch {
      /* table may not exist */
    }
  }

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    showSaved()
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setProfileLoading(true)
    setProfileError(null)
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim() || null
      const { error } = await supabase
        .from("user_profiles")
        .upsert(
          {
            id: user.id,
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
            phone: phone.trim() || null,
            full_name: fullName,
            avatar_url: avatarUrl || null,
          },
          { onConflict: "id" }
        )

      if (error) throw error
      showSaved()
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setProfileLoading(false)
    }
  }

  const handleAvatarCropConfirm = async (croppedFile: File) => {
    if (!user?.id) return
    setAvatarCropFile(null)
    setAvatarUploading(true)
    setProfileError(null)
    try {
      const { url } = await uploadAvatar(croppedFile, user.id)
      const cacheBustedUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`
      setAvatarUrl(cacheBustedUrl)
      await supabase
        .from("user_profiles")
        .upsert({ id: user.id, avatar_url: url }, { onConflict: "id" })
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { url: cacheBustedUrl } }))
      }
      showSaved()
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to upload avatar")
    } finally {
      setAvatarUploading(false)
    }
  }

  const handlePresetSelect = async (url: string) => {
    if (!user?.id) return
    setProfileError(null)
    try {
      await supabase
        .from("user_profiles")
        .upsert({ id: user.id, avatar_url: url }, { onConflict: "id" })
      setAvatarUrl(url)
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { url } }))
      setIsAvatarPickerOpen(false)
      showSaved()
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to save avatar")
    }
  }

  const handleFileSelected = (file: File) => {
    setProfileError(null)
    setIsAvatarPickerOpen(false)
    setAvatarCropFile(file)
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    if (passwordNew !== passwordConfirm) {
      setPasswordError("Passwords do not match")
      return
    }
    if (passwordNew.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordNew })
      if (error) throw error
      setPasswordSuccess(true)
      setPasswordNew("")
      setPasswordConfirm("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleNotifToggle = async (
    key: keyof NotificationPrefs,
    value: boolean
  ) => {
    if (!user?.id) return
    const next = { ...notifPrefs, [key]: value }
    setNotifPrefs(next)
    try {
      await supabase.from("user_notification_preferences").upsert(
        {
          user_id: user.id,
          ...next,
        },
        { onConflict: "user_id" }
      )
      showSaved()
    } catch {
      /* table may not exist */
    }
  }

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
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
        onValidationError={setProfileError}
        isUploading={avatarUploading}
      />
      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Profile</h1>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        {/* Profile Section */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold">Profile</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your personal information
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            {profileError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
              </div>
            )}
            <div className="flex items-center gap-6">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  disabled={avatarUploading}
                  className="block rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2"
                >
                  <Avatar className="w-20 h-20 cursor-pointer hover:opacity-90 transition-opacity">
                    <AvatarImage src={avatarUrl} alt="Avatar" />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-lg">
                      {[firstName, lastName].filter(Boolean).join(" ").slice(0, 2).toUpperCase() ||
                        user.email?.slice(0, 2).toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                >
                  {avatarUploading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">First name</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Last name</label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Email</label>
                  <Input value={user.email || ""} disabled className="bg-gray-50 dark:bg-gray-900" />
                  <p className="text-xs text-gray-500 mt-0.5">Email cannot be changed here</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Phone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Saving..." : "Save profile"}
            </Button>
          </form>
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
          <div className="p-6">
            <label className="text-sm font-medium block mb-3">Theme</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  theme === "light"
                    ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                }`}
              >
                <span className="font-medium text-sm">Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`p-4 border-2 rounded-lg transition-all text-left ${
                  theme === "dark"
                    ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                }`}
              >
                <span className="font-medium text-sm">Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div id="password" className="border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold">Password</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Change your password
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">Password updated.</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">New password</label>
              <Input
                type="password"
                value={passwordNew}
                onChange={(e) => setPasswordNew(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                disabled={passwordLoading}
              />
              <p className="text-xs text-gray-500 mt-0.5">At least 8 characters</p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Confirm new password</label>
              <Input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                disabled={passwordLoading}
              />
            </div>
            <Button type="submit" disabled={passwordLoading || !passwordNew || !passwordConfirm}>
              {passwordLoading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>

        {/* Notifications Section */}
        <div id="notifications" className="border border-gray-200 dark:border-gray-800 rounded-lg">
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
                key: "email_notifications" as const,
                title: "Email Notifications",
                description: "Receive email updates about your projects",
              },
              {
                key: "project_updates" as const,
                title: "Project Updates",
                description: "Get notified when project status changes",
              },
              {
                key: "payment_reminders" as const,
                title: "Payment Reminders",
                description: "Receive reminders for pending invoices",
              },
              {
                key: "team_activity" as const,
                title: "Team Activity",
                description: "Get notified about team member actions",
              },
            ].map((n) => (
              <div
                key={n.key}
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-900 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {n.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotifToggle(n.key, !notifPrefs[n.key])}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifPrefs[n.key]
                      ? "bg-black dark:bg-white"
                      : "bg-gray-200 dark:bg-gray-800"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${
                      notifPrefs[n.key] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-200 dark:border-red-900/30 rounded-lg">
          <div className="p-6 border-b border-red-200 dark:border-red-900/30">
            <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Irreversible actions
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Delete Account</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10"
                disabled
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete (coming soon)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
