'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from './button'
import Link from 'next/link'
import { useSessionContext } from '@/lib/SessionContext'
import { useState } from 'react'
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export function NavbarWrapper() {
  const { session, loading } = useSessionContext();
  // Optionally, you can show nothing or a loader while loading
  if (loading) return null;
  if (!session) return null;
  return <Navbar />;
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const { session, profile, setSession, setProfile } = useSessionContext()
  const userRole = profile?.role || null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="w-full bg-black border-b border-orange-500">
      <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center h-auto min-h-16 px-2 sm:px-6 relative">
        {/* Logo */}
        <div className="flex-shrink-0 py-3">
          <Link href="/jobs" className="text-xl font-bold tracking-widest text-orange-500 uppercase mr-4 sm:mr-12" style={{ letterSpacing: '0.1em' }}>
            NEXT LEVEL
          </Link>
        </div>
        {/* Hamburger Icon for Mobile (now at 828px breakpoint) */}
        <button
          className="max-[838px]:block hidden ml-auto text-orange-500 focus:outline-none z-20"
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="text-2xl" />
        </button>
        {/* Navigation Links */}
        <div className="hidden min-[839px]:flex flex-1 justify-center w-full min-[829px]:w-auto">
          <div className="flex gap-3 lg:gap-8 xl:gap-12 flex-wrap justify-center w-full min-[829px]:w-auto">
            {userRole === 'job_poster' && (
              <>
                <Link href="/jobs" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/jobs' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>JOBS</Link>
                <Link href="/jobs/new" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/jobs/new' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>POST JOB</Link>
                <Link href="/applications" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/applications' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>APPLICATIONS</Link>
                <Link href="/applications/apprenticeship" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/applications/apprenticeship' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>APPRENTICESHIP</Link>
              </>
            )}
            {userRole === 'job_seeker' && (
              <>
                <Link href="/jobs" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/jobs' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>JOBS</Link>
                <Link href="/applications" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/applications' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>APPLICATIONS</Link>
                <Link href="/badges" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/badges' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>BADGES</Link>
              </>
            )}
          </div>
        </div>
        {/* Sign Out Button (desktop/tablet) */}
        <div className="hidden min-[839px]:flex flex-shrink-0 ml-auto py-3">
          <Button
            onClick={handleSignOut}
            className="border border-orange-500 text-orange-500 bg-transparent hover:bg-orange-500 hover:text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-none transition-colors"
            variant="ghost"
          >
            SIGN OUT
          </Button>
        </div>
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="max-[828px]:block hidden absolute top-16 left-0 w-full bg-black border-b border-orange-500 z-10 animate-fade-in">
            <div className="flex flex-col items-center gap-4 py-6">
              {userRole === 'job_poster' && (
                <>
                  <Link href="/jobs" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/jobs' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors w-full text-center`} onClick={() => setMobileMenuOpen(false)}>JOBS</Link>
                  <Link href="/jobs/new" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/jobs/new' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors w-full text-center`} onClick={() => setMobileMenuOpen(false)}>POST JOB</Link>
                  <Link href="/applications" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/applications' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors w-full text-center`} onClick={() => setMobileMenuOpen(false)}>APPLICATIONS</Link>
                  <Link href="/applications/apprenticeship" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/applications/apprenticeship' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors w-full text-center`} onClick={() => setMobileMenuOpen(false)}>APPRENTICESHIP</Link>
                </>
              )}
              {userRole === 'job_seeker' && (
                <>
                  <Link href="/jobs" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/jobs' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors w-full text-center`} onClick={() => setMobileMenuOpen(false)}>JOBS</Link>
                  <Link href="/applications" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/applications' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors w-full text-center`} onClick={() => setMobileMenuOpen(false)}>APPLICATIONS</Link>
                  <Link href="/badges" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/badges' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors w-full text-center`} onClick={() => setMobileMenuOpen(false)}>BADGES</Link>
                </>
              )}
              <Button
                onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                className="border border-orange-500 text-orange-500 bg-transparent hover:bg-orange-500 hover:text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-none transition-colors w-11/12"
                variant="ghost"
              >
                SIGN OUT
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}