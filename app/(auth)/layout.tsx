export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white dark:border-black rotate-45" />
            </div>
            <span className="font-semibold text-2xl">ArchaFlow</span>
          </div>
        </div>

        {/* Auth content */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          © 2026 ArchaFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}
