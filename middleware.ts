import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

// Define auth routes that should redirect to workflow if already authenticated
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  // Update session and get response
  const response = await updateSession(request)
  
  // Note: Session checking is handled by the AuthProvider and individual pages
  // This middleware just ensures the session is refreshed
  
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
