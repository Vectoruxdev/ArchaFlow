import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

// Define auth routes that should redirect to workflow if already authenticated
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

function isAdminSubdomain(host: string): boolean {
  return (
    host.startsWith("admin.") ||
    host.startsWith("admin.localhost")
  )
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || ""
  const { pathname } = request.nextUrl

  // Handle admin subdomain routing
  if (isAdminSubdomain(host)) {
    // Skip rewriting for API routes, Next.js internals, and static assets
    if (
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon.ico") ||
      pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)
    ) {
      return updateSession(request)
    }

    // Rewrite admin subdomain paths to /admin-portal/* routes
    const url = request.nextUrl.clone()
    if (pathname === "/") {
      url.pathname = "/admin-portal"
    } else {
      url.pathname = `/admin-portal${pathname}`
    }

    const response = NextResponse.rewrite(url)

    // Still update session for auth cookie refresh
    const sessionResponse = await updateSession(request)
    // Copy session cookies to the rewrite response
    sessionResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value)
    })

    return response
  }

  // Default: update session and return
  const response = await updateSession(request)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
