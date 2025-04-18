import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware configuration
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/',
    '/favicon.ico',
  ]

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route || 
    req.nextUrl.pathname.startsWith('/api/')
  )

  // If not a public route and no session, redirect to login
  if (!isPublicRoute && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based route protection
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    // Routes that require job_poster role
    const jobPosterRoutes = ['/jobs/new']
    const isJobPosterRoute = jobPosterRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    )

    // If trying to access job poster route without proper role
    if (isJobPosterRoute && profile?.role !== 'job_poster') {
      // Redirect to home page or show an error page
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }

    // After successful login, redirect to appropriate dashboard based on role
    if (req.nextUrl.pathname === '/') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = profile?.role === 'job_poster' ? '/jobs/new' : '/jobs'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}