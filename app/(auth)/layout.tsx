import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[--af-bg-canvas] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[--af-text-muted] hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-warm-900 dark:bg-amber-500 rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white dark:border-warm-900 rotate-45" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">ArchaFlow</span>
          </div>
        </div>

        {/* Auth content */}
        <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-card shadow-af-card p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[--af-text-muted] font-mono mt-6">
          &copy; 2026 ArchaFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}
