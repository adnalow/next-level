'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Application = {
  id: string
  job_id: string
  message: string
  resume_url: string
  status: 'applied' | 'in_progress' | 'completed' | 'declined'
  created_at: string
  job: {
    title: string
    category: string
    location: string
  }
  applicant: {
    email: string
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUserRole()
  }, [])

  useEffect(() => {
    if (userRole) {
      fetchApplications()
    }
  }, [userRole])

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profile) {
      setUserRole(profile.role)
    }
  }

  const fetchApplications = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      let { data, error } = userRole === 'job_seeker' 
        ? await supabase
            .from('applications')
            .select(`
              *,
              job:jobs(title, category, location)
            `)
            .eq('applicant_id', session.user.id)
            .order('created_at', { ascending: false })
        : await supabase
            .from('applications')
            .select(`
              *,
              job:jobs(title, category, location),
              applicant:profiles!applications_applicant_id_fkey(email)
            `)
            .eq('jobs.poster_id', session.user.id)
            .order('created_at', { ascending: false })

      if (error) {
        setError('Error loading applications')
      } else {
        setApplications(data || []) // Handle null case by providing empty array as fallback
      }
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Error loading applications')
    }
    setLoading(false)
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: Application['status']) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)

    if (error) {
      setError('Error updating application status')
    } else {
      fetchApplications()
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {userRole === 'job_seeker' ? 'My Applications' : 'Manage Applications'}
        </h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{application.job.title}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                    {application.job.category}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
                    {application.job.location}
                  </span>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${
                    application.status === 'completed' ? 'bg-green-100 text-green-700' :
                    application.status === 'declined' ? 'bg-red-100 text-red-700' :
                    application.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {application.status.replace('_', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRole === 'job_poster' && (
                  <div>
                    <p className="text-sm font-medium">Applicant</p>
                    <p className="text-sm text-muted-foreground">{application.applicant.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Cover Letter</p>
                  <p className="text-sm text-muted-foreground">{application.message}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Resume</p>
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Resume
                  </a>
                </div>
                {userRole === 'job_poster' && application.status === 'applied' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => updateApplicationStatus(application.id, 'in_progress')}
                    >
                      Start Review
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => updateApplicationStatus(application.id, 'declined')}
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {userRole === 'job_poster' && application.status === 'in_progress' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => updateApplicationStatus(application.id, 'completed')}
                    >
                      Complete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => updateApplicationStatus(application.id, 'declined')}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}