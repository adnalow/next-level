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
  status: 'applied' | 'in_progress' | 'completed' | 'declined'
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
      if (jobError) throw jobError
      setJob(jobData)
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('*, applicant:profiles!applications_applicant_id_fkey(email)')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
      if (appsError) throw appsError
      setApplications(apps || [])
    } catch (err) {
      setError('Error loading job or applications')
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
      fetchJobAndApplications()
    }
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
                {application.status === 'applied' && (
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
                {application.status === 'in_progress' && (
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
      <Button variant="ghost" className="mt-8" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  )
}
