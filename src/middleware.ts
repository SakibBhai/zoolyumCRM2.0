import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check if authentication bypass is enabled
const isAuthBypassEnabled = process.env.AUTH_BYPASS_ENABLED === 'true'

export default withAuth(
  function middleware(req: NextRequest) {
    // If bypass is enabled, allow all requests
    if (isAuthBypassEnabled) {
      console.warn('🚨 AUTH BYPASS MODE ENABLED - DEVELOPMENT ONLY!')
      return NextResponse.next()
    }

    // Normal authentication flow
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // If bypass is enabled, always authorize
        if (isAuthBypassEnabled) {
          return true
        }

        // Check if user is trying to access protected routes
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        const publicRoutes = [
          '/auth/signin',
          '/auth/signup',
          '/api/auth',
          '/_next',
          '/favicon.ico',
        ]

        // Check if the current path is public
        const isPublicRoute = publicRoutes.some(route => 
          pathname.startsWith(route)
        )

        if (isPublicRoute) {
          return true
        }

        // For protected routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}