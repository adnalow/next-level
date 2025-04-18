'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from './button'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function Navbar() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profile) {
      setUserRole(profile.role)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/jobs" className="text-sm font-medium transition-colors hover:text-primary">
            Jobs
          </Link>
          {userRole === 'job_poster' && (
            <Link href="/jobs/new" className="text-sm font-medium transition-colors hover:text-primary">
              Post Job
            </Link>
          )}
          <Link href="/applications" className="text-sm font-medium transition-colors hover:text-primary">
            Applications
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}