import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not signed in and the current path is not /auth/login or /auth/signup
  // redirect the user to /auth/login
  if (!session?.user && !['/auth/login', '/auth/signup'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If user is signed in and trying to access auth pages, redirect to jobs
  if (session?.user && ['/auth/login', '/auth/signup'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/jobs', request.url))
  }

  // For authenticated users, check role-based access
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    // Redirect job seekers trying to access job posting
    if (profile?.role === 'job_seeker' && request.nextUrl.pathname === '/jobs/new') {
      return NextResponse.redirect(new URL('/jobs', request.url))
    }
  }

  return res
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