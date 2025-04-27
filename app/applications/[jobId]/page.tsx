"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Application = {
  id: string
  applicant_id: string
  message: string
  resume_url: string
  status: 'pending' | 'applied' | 'in_progress' | 'completed' | 'declined'
  created_at: string
  applicant: {
    email: string
  }
}

type Job = {
  id: string
  title: string
  category: string
  location: string
  status: string
}

export default function JobApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const jobId = params.jobId as string

  useEffect(() => {
    if (jobId) {
      fetchJobAndApplications()
    }
  }, [jobId])

  const fetchJobAndApplications = async () => {
    setLoading(true)
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      if (jobError) {
        console.error('Job fetch error:', jobError)
        throw new Error('Job fetch error: ' + jobError.message)
      }
      setJob(jobData)
      // Fetch applications without join
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
      if (appsError) {
        console.error('Applications fetch error:', appsError)
        setError('Error loading applications: ' + appsError.message)
        setLoading(false)
        return
      }
      // Fetch all applicant profiles in one query
      const applicantIds = (apps || []).map(app => app.applicant_id)
      let profilesMap: Record<string, string> = {}
      if (applicantIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', applicantIds)
        if (profilesError) {
          console.error('Profiles fetch error:', profilesError)
          setError('Error loading applicant profiles: ' + profilesError.message)
          setLoading(false)
          return
        }
        profilesMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.email]))
      }
      // Merge email into each application
      const appsWithEmail = (apps || []).map(app => ({
        ...app,
        applicant: { email: profilesMap[app.applicant_id] || '' }
      }))
      setApplications(appsWithEmail)
      console.log('Fetched applications:', appsWithEmail) // Debug log
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError('Error loading job or applications: ' + (err?.message || 'Unknown error'))
    }
    setLoading(false)
  }

  // Add function to update job status
  const updateJobStatus = async (newStatus: string) => {
    if (!job) return
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', job.id)
    if (error) {
      setError('Error updating job status')
    } else {
      fetchJobAndApplications()
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: Application['status']) => {
    console.log('Button clicked:', { applicationId, newStatus, type: typeof applicationId }); // Debug log
    setUpdating(applicationId + newStatus)
    setError(null)
    const { data, error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)
    console.log('Supabase update response:', { data, error }); // Log full response
    if (error) {
      setError('Error updating application status: ' + error.message)
      console.error('Supabase error:', error)
    } else {
      console.log('Status updated successfully, fetching applications...'); // Debug log
      await fetchJobAndApplications()
    }
    setUpdating(null)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto py-10 text-destructive">{error}</div>
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      {job && (
        <Card>
          <CardHeader>
            <CardTitle>{job.title}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">{job.category}</span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">{job.location}</span>
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{job.status}</span>
              {/* Job status toggle button */}
              {job.status === 'open' ? (
                <Button variant="outline" size="sm" className="ml-2" onClick={() => updateJobStatus('closed')}>
                  Close Job
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="ml-2" onClick={() => updateJobStatus('open')}>
                  Reopen Job
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      )}
      <h2 className="text-2xl font-semibold">Applications</h2>
      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No applications found for this job</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{application.applicant.email}</CardTitle>
                <div className="mt-2 flex flex-wrap gap-2">
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
                {(application.status === 'applied' || application.status === 'pending') && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={updating === application.id + 'in_progress'}
                      onClick={() => { console.log('Accept button onClick'); updateApplicationStatus(application.id, 'in_progress') }}
                    >
                      {updating === application.id + 'in_progress' ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={updating === application.id + 'declined'}
                      onClick={() => { console.log('Decline button onClick'); updateApplicationStatus(application.id, 'declined') }}
                    >
                      {updating === application.id + 'declined' ? 'Declining...' : 'Decline'}
                    </Button>
                  </div>
                )}
                {application.status === 'in_progress' && (
                  <div className="flex gap-2">
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
      <Button variant="ghost" className="mt-8" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  )
}
