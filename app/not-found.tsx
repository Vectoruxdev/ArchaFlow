import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--af-bg-surface] p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">404 - Page not found</h1>
        <p className="text-sm text-[--af-text-secondary] mb-4">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-warm-900 dark:bg-[--af-bg-surface] text-white dark:text-foreground rounded-lg text-sm font-medium"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
