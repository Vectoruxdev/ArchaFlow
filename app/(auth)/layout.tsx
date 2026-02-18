export const dynamic = "force-dynamic"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary-foreground rotate-45" />
            </div>
            <span className="font-semibold text-2xl text-foreground">ArchaFlow</span>
          </div>
        </div>

        {/* Auth content */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          &copy; 2026 ArchaFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}
