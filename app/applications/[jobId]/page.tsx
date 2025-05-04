"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Globe, Unlock, X } from "lucide-react"

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
    setUpdating(applicationId + newStatus)
    setError(null)
    let updateObj: any = { status: newStatus }
    if (newStatus === 'in_progress') {
      updateObj.accepted_at = new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('applications')
      .update(updateObj)
      .eq('id', applicationId)
    if (error) {
      setError('Error updating application status: ' + error.message)
    } else {
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
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Back link */}
        <div className="flex items-center mb-2">
          <span className="text-[#FF8000] text-xl mr-2">&#8592;</span>
          <button className="text-[#FF8000] text-base font-normal hover:underline" onClick={() => router.back()}>
            Back to Applications
          </button>
        </div>
        {/* Title row */}
        <div className="flex items-center justify-between mb-2 mt-2">
          <div className="flex items-center gap-3">
            <span className="text-[#FF8000] text-3xl"><svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='none' viewBox='0 0 24 24'><path fill='#FF8000' d='M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-4.828-4.828A2 2 0 0 0 13.172 2H6Zm0 2h7.172L20 8.828V20H6V4Zm2 4v2h8V8H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z'/></svg></span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#FF8000] tracking-wide uppercase">{job?.title}</h1>
          </div>
          {job && (
            <Button
              variant="outline"
              size="sm"
              className={`border ${job.status === 'open' ? 'border-[#FF3B3B] text-[#FF3B3B] hover:bg-[#1a0000]' : 'border-[#3B5BFF] text-[#3B5BFF] hover:bg-[#001a1a]'} hover:text-white font-semibold px-6 py-2 rounded-none text-base flex items-center gap-2`}
              onClick={() => updateJobStatus(job.status === 'open' ? 'closed' : 'open')}
            >
              {job.status === 'open' ? (
                <><X className="w-5 h-5" /> CLOSE JOB</>
              ) : (
                <><Unlock className="w-5 h-5" /> OPEN JOB</>
              )}
            </Button>
          )}
        </div>
        <div className="text-zinc-300 text-sm mb-3">Manage applications to this job posting</div>
        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <span className="bg-[#393939] text-xs px-3 py-1 rounded text-white font-medium flex items-center gap-1">
            <FileText className="w-4 h-4 mr-1" />
            manual labor
          </span>
          <span className="bg-[#393939] text-xs px-3 py-1 rounded text-white font-medium flex items-center gap-1">
            <Globe className="w-4 h-4 mr-1" />
            Remote
          </span>
        </div>
        {/* Applications */}
        {applications.length === 0 ? (
          <div className="bg-[#232323] border border-[#393939] rounded p-8 flex items-center justify-center">
            <p className="text-zinc-400">No applications found for this job</p>
          </div>
        ) : (
          <div className="space-y-10">
            {applications.map((application) => (
              <div key={application.id} className="bg-[#232323] rounded-none px-8 pt-6 pb-4 relative w-full">
                {/* Date badge */}
                <span className="absolute top-6 right-8 text-xs bg-[#393939] text-white px-3 py-1 rounded font-semibold">{new Date(application.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
                {/* Email and status */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[#FF8000] text-lg mr-1"><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24'><path fill='#FF8000' d='M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4Zm0-2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z'/></svg></span>
                  <span className="text-white font-normal text-base">{application.applicant.email}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded ml-2 ${
                    application.status === 'in_progress' ? 'bg-[#3B5BFF] text-white' :
                    application.status === 'completed' ? 'bg-[#2ECC40] text-white' :
                    application.status === 'declined' ? 'bg-[#FF3B3B] text-white' :
                    'bg-[#393939] text-white'
                  }`}>
                    {application.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {/* Cover letter */}
                <div className="mb-3">
                  <div className="text-white text-xs font-bold mb-1 uppercase">COVER LETTER</div>
                  <div className="bg-black rounded-none px-4 py-2 text-white text-sm border-0 w-full">{application.message}</div>
                </div>
                {/* Resume */}
                <div className="mb-3">
                  <div className="text-white text-xs font-bold mb-1 uppercase">RESUME</div>
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-black text-white border-0 rounded-none px-5 py-2 text-xs font-bold hover:bg-[#181818] hover:text-[#FF8000] transition"
                  >
                    VIEW RESUME
                  </a>
                </div>
                {/* Action buttons */}
                {(application.status === 'applied' || application.status === 'pending') && (
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border border-[#3B5BFF] text-[#3B5BFF] hover:bg-[#001a1a] hover:text-white font-semibold px-8 py-2 rounded-none"
                      disabled={updating === application.id + 'in_progress'}
                      onClick={() => updateApplicationStatus(application.id, 'in_progress')}
                    >
                      {updating === application.id + 'in_progress' ? 'Accepting...' : 'ACCEPT'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border border-[#FF3B3B] text-[#FF3B3B] hover:bg-[#1a0000] hover:text-white font-semibold px-8 py-2 rounded-none"
                      disabled={updating === application.id + 'declined'}
                      onClick={() => updateApplicationStatus(application.id, 'declined')}
                    >
                      {updating === application.id + 'declined' ? 'Declining...' : 'DECLINE'}
                    </Button>
                  </div>
                )}
                {application.status === 'in_progress' && (
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border border-[#FF3B3B] text-[#FF3B3B] hover:bg-[#1a0000] hover:text-white font-semibold px-8 py-2 rounded-none"
                      onClick={() => updateApplicationStatus(application.id, 'declined')}
                    >
                      DECLINE
                    </Button>
                  </div>
                )}
                {application.status === 'completed' && (
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#2ECC40] border-0 text-white font-bold px-8 py-2 rounded-none cursor-default"
                      disabled
                    >
                      COMPLETED
                    </Button>
                  </div>
                )}
                {application.status === 'declined' && (
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#FF3B3B] border-0 text-white font-bold px-8 py-2 rounded-none cursor-default"
                      disabled
                    >
                      DECLINED
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
