"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Globe, Unlock, X, ArrowLeft } from "lucide-react"
import ClientLayout from '../../components/ClientLayout'
import { toast } from "sonner"
import LoadingScreen from '@/components/ui/LoadingScreen'

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
  const [undoDecline, setUndoDecline] = useState<{id: string, prevStatus: Application['status']} | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
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

  const updateApplicationStatus = async (applicationId: string, newStatus: Application['status'], showUndo = false, prevStatus?: Application['status']) => {
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
      if (showUndo && prevStatus) {
        setUndoDecline({ id: applicationId, prevStatus })
        toast("Applicant declined", {
          action: {
            label: "Undo",
            onClick: async () => {
              setUndoDecline(null)
              await updateApplicationStatus(applicationId, prevStatus)
            }
          },
          duration: 5000,
        })
      } else {
        toast(`Application status updated to '${newStatus.replace('_', ' ')}' successfully.`, {
          description: newStatus === 'declined' ? 'Application declined.' : newStatus === 'in_progress' ? 'Application accepted.' : undefined,
          duration: 3000,
        })
      }
    }
    setUpdating(null)
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-destructive">{error}</div>
  }

  return (
    <ClientLayout>
      <div className="min-h-screen text-white">
        <div className="max-w-5xl mx-auto py-8 px-2 sm:px-4">
          {/* Back link */}
          <div className="flex items-center mb-4">
            <button
              className="flex items-center gap-2 text-[#FF8000] text-lg font-bold px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#FF8000] hover:underline hover:text-[#ffa94d] transition"
              onClick={() => router.back()}
              aria-label="Back to Applications"
            >
              <ArrowLeft className="w-7 h-7" />
              <span>Back to Applications</span>
            </button>
          </div>
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 mt-2 gap-2">
            <div className="flex flex-col gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[#FF8000] text-2xl sm:text-3xl"><svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='none' viewBox='0 0 24 24'><path fill='#FF8000' d='M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-4.828-4.828A2 2 0 0 0 13.172 2H6Zm0 2h7.172L20 8.828V20H6V4Zm2 4v2h8V8H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z'/></svg></span>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#FF8000] tracking-wide uppercase break-words drop-shadow-lg">
                  {job?.title}
                </h1>
              </div>
              {/* Job tags below title */}
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="bg-[#232323] text-xs px-2 py-1 rounded-full text-[#FF8000] font-semibold flex items-center gap-1 border border-[#393939] shadow-sm">
                  <FileText className="w-4 h-4 mr-1" />
                  manual labor
                </span>
                <span className="bg-[#232323] text-xs px-2 py-1 rounded-full text-[#3B5BFF] font-semibold flex items-center gap-1 border border-[#393939] shadow-sm">
                  <Globe className="w-4 h-4 mr-1" />
                  Remote
                </span>
              </div>
            </div>
            {job && (
              <Button
                variant="outline"
                size="sm"
                className={`border ${job.status === 'open' ? 'border-[#FF3B3B] text-[#FF3B3B] bg-[#2a0000] hover:bg-[#3a0000]' : 'border-[#3B5BFF] text-[#3B5BFF] bg-[#001a1a] hover:bg-[#002a2a]'} hover:text-white font-extrabold px-4 sm:px-6 py-2 rounded-none text-base flex items-center gap-2 w-full sm:w-auto transition`}
                onClick={async () => {
                  if (job.status === 'open') {
                    if (window.confirm('Are you sure you want to close this job? This action cannot be undone.')) {
                      await updateJobStatus('closed')
                    }
                  } else {
                    if (window.confirm('Are you sure you want to reopen this job?')) {
                      await updateJobStatus('open')
                    }
                  }
                }}
                aria-label={job.status === 'open' ? 'Close Job' : 'Open Job'}
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
          {/* Applications */}
          {applications.length === 0 ? (
            <div className="bg-[#232323] border border-[#393939] rounded p-8 flex items-center justify-center">
              <p className="text-zinc-400">No applications found for this job</p>
            </div>
          ) : (
            <div className="block space-y-10">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className={`bg-[#232323] rounded-lg px-8 pt-6 pb-4 relative w-full shadow-sm transition hover:shadow-lg hover:border-[#FF8000] border border-transparent group${activeCardId === application.id ? ' border-[#FF8000] ring-2 ring-[#FF8000]' : ''}`}
                  tabIndex={0}
                  aria-label={`Application from ${application.applicant.email}`}
                  role="region"
                  aria-labelledby={`applicant-email-${application.id}`}
                >
                  {/* Email, status, and date in a single block */}
                  <div className="flex flex-col gap-0.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 bg-[#181818] rounded-full" aria-hidden="true">
                        <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24'><path fill='#FF8000' d='M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4Zm0-2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z'/></svg>
                      </span>
                      <span id={`applicant-email-${application.id}`} className="text-white font-medium text-base">
                        {application.applicant.email}
                      </span>
                      <span className="text-zinc-500 mx-1">•</span>
                      <span
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded select-none
                          ${application.status === 'in_progress' ? 'bg-[#3B5BFF] text-white' :
                            application.status === 'completed' ? 'bg-[#2ECC40] text-white' :
                            application.status === 'declined' ? 'bg-[#FF3B3B] text-white' :
                            'bg-[#393939] text-white'}
                        `}
                        aria-label={`Status: ${application.status.replace('_', ' ')}`}
                        role="status"
                      >
                        {application.status === 'completed' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                        {application.status === 'in_progress' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                        )}
                        {application.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 pl-9 mt-0.5">
                      {new Date(application.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  {/* Cover letter */}
                  <div className="mb-3">
                    <div className="text-white text-xs font-bold mb-1 uppercase">COVER LETTER</div>
                    <div
                      className="bg-black rounded-none px-4 py-3 text-white text-base border-0 w-full max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed tracking-wide"
                      style={{ wordBreak: 'break-word' }}
                      tabIndex={0}
                      aria-label="Applicant cover letter"
                      role="document"
                    >
                      {application.message}
                    </div>
                  </div>
                  {/* Resume */}
                  <div className="mb-3">
                    <div className="text-white text-xs font-bold mb-1 uppercase">RESUME</div>
                    <a
                      href={application.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 bg-black text-white border-0 rounded-none px-5 py-2 text-xs font-bold hover:bg-[#181818] hover:text-[#FF8000] hover:shadow focus:outline-none focus:ring-2 focus:ring-[#FF8000] transition mr-3${activeCardId === application.id ? ' ring-2 ring-[#FF8000]' : ''}`}
                      tabIndex={0}
                      aria-label="View applicant resume (opens in new tab)"
                      role="button"
                      onClick={() => setActiveCardId(application.id)}
                    >
                      <FileText className="w-4 h-4" /> VIEW RESUME
                    </a>
                  </div>
                  {/* Action buttons */}
                  {(application.status === 'applied' || application.status === 'pending') && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 justify-end w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border border-[#3B5BFF] text-[#3B5BFF] hover:bg-[#001a1a] hover:text-white font-semibold px-8 py-2 rounded-none transition focus:outline-none focus:ring-2 focus:ring-[#3B5BFF] w-full sm:w-auto"
                        disabled={updating === application.id + 'in_progress'}
                        onClick={() => updateApplicationStatus(application.id, 'in_progress')}
                        tabIndex={0}
                        aria-label="Accept application"
                      >
                        {updating === application.id + 'in_progress' ? (
                          <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Accepting...</span>
                        ) : 'ACCEPT'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border border-[#FF3B3B] text-[#FF3B3B] hover:bg-[#1a0000] hover:text-white font-semibold px-8 py-2 rounded-none transition focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] w-full sm:w-auto"
                        disabled={updating === application.id + 'declined'}
                        onClick={() => {
                          if (window.confirm('Are you sure you want to decline this applicant?')) {
                            updateApplicationStatus(application.id, 'declined', true, application.status)
                          }
                        }}
                        tabIndex={0}
                        aria-label="Decline application"
                      >
                        {updating === application.id + 'declined' ? (
                          <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Declining...</span>
                        ) : 'DECLINE'}
                      </Button>
                    </div>
                  )}
                  {application.status === 'in_progress' && (
                    <div className="flex gap-4 mt-4 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border border-[#FF3B3B] text-[#FF3B3B] hover:bg-[#1a0000] hover:text-white font-semibold px-8 py-2 rounded-none transition focus:outline-none focus:ring-2 focus:ring-[#FF3B3B]"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to decline this application?')) {
                            updateApplicationStatus(application.id, 'declined')
                          }
                        }}
                        tabIndex={0}
                        aria-label="Decline application"
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
    </ClientLayout>
  )
}
