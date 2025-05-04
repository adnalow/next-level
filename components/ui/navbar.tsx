'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from './button'
import Link from 'next/link'
import { useSessionContext } from '@/lib/SessionContext'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const { session, profile, setSession, setProfile } = useSessionContext()
  const userRole = profile?.role || null

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="w-full bg-black border-b border-orange-500">
      <div className="max-w-screen-2xl mx-auto flex items-center h-16 px-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/jobs" className="text-xl font-bold tracking-widest text-orange-500 uppercase mr-12" style={{ letterSpacing: '0.1em' }}>
            NEXT LEVEL
          </Link>
        </div>
        {/* Navigation Links */}
        <div className="flex-1 flex justify-center">
          <div className="flex gap-12">
            <Link href="/jobs" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/jobs' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>JOBS</Link>
            {userRole === 'job_poster' && (
              <Link href="/jobs/new" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/jobs/new' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>POST JOB</Link>
            )}
            <Link href="/applications" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/applications' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>APPLICATIONS</Link>
            <Link href="/applications/apprenticeship" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/applications/apprenticeship' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>APPRENTICESHIP</Link>
            <Link href="/badges" className={`text-base font-semibold uppercase tracking-wider px-1 ${pathname === '/badges' ? 'text-orange-500' : 'text-white'} hover:text-orange-500 transition-colors`}>BADGES</Link>
          </div>
        </div>
        {/* Sign Out Button */}
        <div className="flex-shrink-0 ml-auto">
          <Button
            onClick={handleSignOut}
            className="border border-orange-500 text-orange-500 bg-transparent hover:bg-orange-500 hover:text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-none transition-colors"
            variant="ghost"
          >
            SIGN OUT
          </Button>
        </div>
      </div>
    </nav>
  )
}