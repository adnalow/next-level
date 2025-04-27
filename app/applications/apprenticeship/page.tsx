// New page for "Apprenticeship" tab for posters
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ApprenticeshipPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [apprentices, setApprentices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchApprenticeships()
    fetchApprentices()
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

  const fetchApprentices = async () => {
    setLoading(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      // Get all jobs posted by this user
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('poster_id', session.user.id)
      if (jobsError) throw jobsError
      const jobIds = (jobsData || []).map((job: any) => job.id)
      const jobTitleMap = Object.fromEntries((jobsData || []).map((job: any) => [job.id, job.title]))
      if (jobIds.length === 0) {
        setApprentices([])
        setLoading(false)
        return
      }
      // Get all in_progress applications for these jobs
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('id, job_id, applicant_id, status, created_at')
        .in('job_id', jobIds)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
      if (appsError) throw appsError
      const applicantIds = (apps || []).map((app: any) => app.applicant_id)
      // Fetch applicant emails
      let profilesMap: Record<string, string> = {}
      if (applicantIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', applicantIds)
        if (profilesError) throw profilesError
        profilesMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.email]))
      }
      // Merge job title and applicant email into each application
      const merged = (apps || []).map((app: any) => ({
        ...app,
        jobTitle: jobTitleMap[app.job_id] || 'Unknown Job',
        applicantEmail: profilesMap[app.applicant_id] || 'Unknown',
      }))
      setApprentices(merged)
    } catch (err: any) {
      setError('Error loading apprentices: ' + (err?.message || JSON.stringify(err)))
      console.error('Apprenticeship fetch error:', err)
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

  const markApprenticeCompleted = async (applicationId: string) => {
    setError(null)
    const { error } = await supabase
      .from('applications')
      .update({ status: 'completed' })
      .eq('id', applicationId)
    if (error) {
      setError('Error updating apprenticeship status')
    } else {
      fetchApprentices()
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
      {apprentices.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No apprenticeships found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apprentices.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{app.jobTitle}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">{app.applicantEmail}</span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">Accepted: {new Date(app.created_at).toLocaleString()}</span>
                  <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-700 px-2 py-1 text-xs">in progress</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" size="sm" onClick={() => markApprenticeCompleted(app.id)}>
                  Complete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
