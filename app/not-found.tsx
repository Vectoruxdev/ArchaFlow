import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold mb-2">404 - Page not found</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
