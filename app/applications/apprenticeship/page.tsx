// New page for "Apprenticeship" tab for posters
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ApprenticeshipPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchApprenticeships()
  }, [])

  const fetchApprenticeships = async () => {
    setLoading(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      // Get jobs posted by this user that are closed or completed
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('poster_id', session.user.id)
        .in('status', ['closed', 'completed'])
        .order('created_at', { ascending: false })
      if (jobsError) throw jobsError
      // For each job, get the accepted application (in_progress or completed)
      const jobsWithSeekers = await Promise.all((jobsData || []).map(async (job: any) => {
        const { data: applications, error: appError } = await supabase
          .from('applications')
          .select('*, applicant:profiles!applications_applicant_id_fkey(email)')
          .eq('job_id', job.id)
          .in('status', ['in_progress', 'completed'])
        return { ...job, hiredSeekers: applications || [] }
      }))
      setJobs(jobsWithSeekers)
    } catch (err: any) {
      setError('Error loading apprenticeships')
    }
    setLoading(false)
  }

  const markJobCompleted = async (jobId: string) => {
    setError(null)
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'completed' })
      .eq('id', jobId)
    if (error) {
      setError('Error updating job status')
    } else {
      fetchApprenticeships()
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Apprenticeship</h1>
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No apprenticeships found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{job.title}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">{job.category}</span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">{job.location}</span>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${job.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{job.status}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Hired Seeker(s):</p>
                  {job.hiredSeekers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hired seekers</p>
                  ) : (
                    <ul className="list-disc ml-4">
                      {job.hiredSeekers.map((app: any) => (
                        <li key={app.id} className="text-sm">
                          {app.applicant?.email || 'Unknown'}
                          <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-xs">{app.status.replace('_', ' ')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {job.status === 'closed' && (
                  <Button variant="outline" size="sm" onClick={() => markJobCompleted(job.id)}>
                    Mark as Completed
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
