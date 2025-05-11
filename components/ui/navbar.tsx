'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from './button'
import Link from 'next/link'
import { useSessionContext } from '@/lib/SessionContext'
import { useState } from 'react'
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { UserCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from './dropdown-menu'
import LoadingScreen from './LoadingScreen'
import Image from 'next/image'

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    router.push('/auth/login')
    router.refresh()
    // No need to set signingOut to false, as the user will be redirected
  }

  if (signingOut) {
    return <LoadingScreen />
  }

  // Animation classes
  const navItemBase =
    'text-base font-bold uppercase tracking-wider px-1 transition-colors duration-200 relative group';
  const navItemActive = 'text-orange-500';
  const navItemInactive = 'text-white hover:text-orange-400';

  // Animation for underline
  const underline =
    'after:content-[""] after:block after:h-[2px] after:bg-orange-500 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left';

  return (
    <nav className="w-full bg-black border-b border-orange-500 sticky top-0 z-30 animate-navbar-fade-in">
      <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center h-auto min-h-16 px-2 sm:px-6 relative">
        {/* Logo */}
        <div className="flex items-center group cursor-default space-x-1.5">
                    <Image src="/next-icon.png" alt="Next Level Icon" width={36} height={36} className="w-9 h-9" />
                    <span className="font-bold text-white text-2xl md:text-3xl group-hover:text-[#ff8800] transition-colors duration-300">
                      NEXT LEVEL
                    </span>
                  </div>
        {/* Hamburger Icon for Mobile (now at 828px breakpoint) */}
        <button
          className="max-[838px]:block hidden ml-auto text-orange-500 focus:outline-none z-20"
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="text-2xl transition-transform duration-200" />
        </button>
        {/* Navigation Links */}
        <div className="hidden min-[839px]:flex flex-1 justify-center w-full min-[829px]:w-auto animate-navbar-items-fade-in">
          <div className="flex gap-4 lg:gap-10 xl:gap-14 flex-wrap justify-center w-full min-[829px]:w-auto">
            {userRole === 'job_poster' && (
              <>
                <Link href="/jobs" className={`${navItemBase} ${pathname === '/jobs' ? navItemActive : navItemInactive} ${underline}`}>JOBS</Link>
                <Link href="/jobs/new" className={`${navItemBase} ${pathname === '/jobs/new' ? navItemActive : navItemInactive} ${underline}`}>POST JOB</Link>
                <Link href="/applications" className={`${navItemBase} ${pathname === '/applications' ? navItemActive : navItemInactive} ${underline}`}>APPLICATIONS</Link>
                <Link href="/applications/apprenticeship" className={`${navItemBase} ${pathname === '/applications/apprenticeship' ? navItemActive : navItemInactive} ${underline}`}>APPRENTICESHIP</Link>
              </>
            )}
            {userRole === 'job_seeker' && (
              <>
                <Link href="/jobs" className={`${navItemBase} ${pathname === '/jobs' ? navItemActive : navItemInactive} ${underline}`}>JOBS</Link>
                <Link href="/applications" className={`${navItemBase} ${pathname === '/applications' ? navItemActive : navItemInactive} ${underline}`}>APPLICATIONS</Link>
                <Link href="/badges" className={`${navItemBase} ${pathname === '/badges' ? navItemActive : navItemInactive} ${underline}`}>BADGES</Link>
              </>
            )}
          </div>
        </div>
        {/* Profile Dropdown (desktop/tablet) */}
        <div className="hidden min-[839px]:flex flex-shrink-0 ml-auto py-3">
          <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center text-orange-500 bg-transparent transition-colors focus:outline-none p-0 m-0 border-none shadow-none hover:bg-transparent hover:shadow-none ${profileMenuOpen ? '' : ''}`}
                aria-label="Open profile menu"
                style={{ border: 'none', background: 'none', boxShadow: 'none' }}
              >
                <UserCircle className="w-7 h-7 transition-transform duration-200" />
                <span className={`ml-1 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : 'rotate-0'}`}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px] animate-dropdown-fade-in shadow-lg shadow-orange-500/10 border border-orange-500 bg-black">
              <DropdownMenuLabel className="flex flex-col items-start py-3 px-4">
                <span className="font-semibold text-base text-orange-500">{session?.user?.email}</span>
                <span className="text-xs text-muted-foreground capitalize">{userRole?.replace('_', ' ')}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="border-t border-orange-500/40 my-1" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="py-3 px-4 text-lg font-semibold text-orange-300 hover:bg-orange-500/10 hover:text-white transition-colors cursor-pointer rounded"
                variant="destructive"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="max-[828px]:block hidden absolute top-16 left-0 w-full bg-black border-b border-orange-500 z-10 animate-dropdown-fade-in">
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
      <style jsx global>{`
        @keyframes navbar-fade-in {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-navbar-fade-in {
          animation: navbar-fade-in 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes navbar-items-fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-navbar-items-fade-in {
          animation: navbar-items-fade-in 0.7s 0.2s both;
        }
        @keyframes dropdown-fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-dropdown-fade-in {
          animation: dropdown-fade-in 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .shadow-orange-glow {
          box-shadow: 0 0 8px 2px #f97316aa;
        }
      `}</style>
    </nav>
  )
}