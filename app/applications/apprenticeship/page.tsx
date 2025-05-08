// New page for "Apprenticeship" tab for posters
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSessionContext } from '@/lib/SessionContext'
import { User } from "lucide-react"
import ClientLayout from '../../components/ClientLayout';
import { toast } from "sonner"
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function ApprenticeshipPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [apprentices, setApprentices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [apprenticesLoading, setApprenticesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const supabase = createClientComponentClient()
  const { session, loading: sessionLoading } = useSessionContext()

  useEffect(() => {
    if (!sessionLoading && session) {
      fetchApprenticeships()
      fetchApprentices()
    }
    // eslint-disable-next-line
  }, [sessionLoading, session])

  useEffect(() => {
    setLoading(jobsLoading || apprenticesLoading)
  }, [jobsLoading, apprenticesLoading])

  const fetchApprenticeships = async () => {
    setJobsLoading(true)
    setError(null)
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
    setJobsLoading(false)
  }

  const fetchApprentices = async () => {
    setApprenticesLoading(true)
    setError(null)
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
        setApprenticesLoading(false)
        return
      }
      // Get all in_progress applications for these jobs, including accepted_at
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('id, job_id, applicant_id, status, created_at, accepted_at')
        .in('job_id', jobIds)
        .eq('status', 'in_progress')
        .order('accepted_at', { ascending: false })
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
    setApprenticesLoading(false)
  }

  // Helper function to get the next acquisition number for a badge
  const getNextAcquisitionNumber = async (badgeId: string) => {
    const { count, error } = await supabase
      .from('user_badges')
      .select('id', { count: 'exact', head: true })
      .eq('badge_id', badgeId)
    if (error) {
      console.error('Error counting badge acquisitions:', error)
      return 1
    }
    const nextAcquisitionNumber = (count || 0) + 1
    console.log(`Current count for badge ${badgeId}:`, count)
    console.log(`Next acquisition number:`, nextAcquisitionNumber)
    return nextAcquisitionNumber
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
    // Fetch the application to get job_id and applicant_id
    const { data: appData, error: appFetchError } = await supabase
      .from('applications')
      .select('job_id, applicant_id')
      .eq('id', applicationId)
      .single()
    if (appFetchError || !appData) {
      setError('Error fetching application details')
      return
    }
    // Update application status to completed
    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', applicationId)
    if (updateError) {
      setError('Error updating apprenticeship status')
      return
    }
    // Fetch the badge for the job
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .eq('job_id', appData.job_id)
      .single()
    if (badgeError || !badge) {
      setError('Error fetching badge for job')
      return
    }
    // Get the next acquisition number using the helper
    const nextAcquisitionNumber = await getNextAcquisitionNumber(badge.id)
    // Insert into user_badges
    const { error: insertError } = await supabase
      .from('user_badges')
      .insert({
        user_id: appData.applicant_id,
        badge_id: badge.id,
        acquisition_number: nextAcquisitionNumber,
        acquired_at: new Date().toISOString(),
      })
    if (insertError) {
      setError('Error assigning badge to user')
      return
    }
    toast('Apprenticeship marked as complete!')
    fetchApprentices()
  }

  const filteredApprentices = apprentices.filter(apprentice => {
    const matchesSearch = apprentice.jobTitle.toLowerCase().includes(search.toLowerCase()) || apprentice.applicantEmail.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || apprentice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-[#18191b] text-white">
        <div className="max-w-4xl mx-auto pt-12 px-2 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-500 text-3xl sm:text-4xl"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 sm:w-10 sm:h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368M18 21.75a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg></span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wide text-orange-500 drop-shadow-lg">APPRENTICESHIP</h1>
          </div>
          <div className="text-gray-400 mb-8 text-base sm:text-lg font-medium">Track ongoing and completed apprenticeships</div>
          {error && (
            <div className="rounded-md bg-red-900/40 p-3 text-sm text-red-400 mb-6">{error}</div>
          )}
          <div className="sr-only" role="region" aria-live="polite">
            {loading ? 'Loading apprenticeships...' : ''}
            {error ? `Error: ${error}` : ''}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <input
              type="text"
              placeholder="Search by job title or email..."
              className="w-full sm:w-72 px-4 py-2 rounded-md border border-[#ff8800] bg-[#181818] text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff8800]"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search apprenticeships by job title or email"
            />
            <select
              className="w-full sm:w-48 px-4 py-2 rounded-md border border-[#ff8800] bg-[#181818] text-white focus:outline-none focus:ring-2 focus:ring-[#ff8800]"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter apprenticeships by status"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {apprentices.length > 0 ? (
            <div className="flex flex-col gap-8">
              {filteredApprentices.map((apprentice, idx) => (
                <div
                  key={apprentice.id}
                  className="bg-[#23242a] border border-[#ff8800] rounded-xl shadow-lg w-full transition-all duration-200 hover:shadow-[0_0_0_2px_#ff8800,0_8px_32px_0_rgba(0,0,0,0.25)] hover:border-[#ffa733] group mb-8"
                  tabIndex={0}
                  aria-label={`Apprenticeship card for ${apprentice.jobTitle} with ${apprentice.applicantEmail}`}
                  role="article"
                  style={{ marginBottom: 32 }}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 sm:px-14 py-10 sm:py-12 gap-8">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="text-2xl sm:text-3xl font-extrabold text-white/95 uppercase mb-4 flex items-center gap-3" style={{letterSpacing: '0px'}}>
                        <span className="inline-flex items-center justify-center bg-[#ff8800]/10 border border-[#ff8800] rounded-full w-9 h-9"><User className="text-[#ff8800] w-6 h-6" aria-hidden="true" /></span>
                        {apprentice.jobTitle}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3">
                        <span className="flex items-center text-white/90 text-base font-medium"><User className="mr-2 text-[#ff8800] w-5 h-5" aria-hidden="true" />{apprentice.applicantEmail}</span>
                        <span className={`flex items-center gap-1 text-xs font-bold rounded px-2 py-1 sm:ml-2 uppercase shadow-sm ${apprentice.status === 'completed' ? 'bg-green-600 text-white' : 'bg-[#2563eb] text-white'}`}
                          aria-label={`Status: ${apprentice.status === 'completed' ? 'Completed' : 'In Progress'}`}
                        >
                          {apprentice.status === 'completed' ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                          )}
                          {apprentice.status === 'completed' ? 'COMPLETED' : 'IN PROGRESS'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm mt-1">
                        <svg className="w-4 h-4 text-[#ff8800]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="#ff8800" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                        Accepted: {apprentice.accepted_at ? new Date(apprentice.accepted_at).toLocaleString() : new Date(apprentice.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 w-full sm:w-auto ml-0 sm:ml-8">
                      {apprentice.status !== 'completed' && (
                        <button
                          className={`w-full sm:w-auto bg-[#FF8800] text-black font-bold px-8 sm:px-12 py-3 text-lg uppercase tracking-normal shadow-none border-none rounded-lg hover:bg-[#ffa733] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#ff8800] focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                          style={{minWidth:'160px'}}
                          onClick={async () => {
                            setLoading(true);
                            await markApprenticeCompleted(apprentice.id);
                            setLoading(false);
                          }}
                          aria-label={`Mark apprenticeship for ${apprentice.applicantEmail} as complete`}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                              Completing...
                            </span>
                          ) : 'COMPLETE'}
                        </button>
                      )}
                      <a
                        href={`/applications/${apprentice.job_id}`}
                        className="text-[#ff8800] text-sm font-semibold underline underline-offset-2 hover:text-[#ffa733] focus:underline focus:text-[#ffa733] transition-colors mt-1"
                        tabIndex={0}
                        aria-label={`View details for ${apprentice.jobTitle}`}
                        style={{display: 'inline-block'}}
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#232323] rounded-md shadow-lg max-w-3xl mx-auto">
              <div className="flex items-center justify-center py-16">
                <p className="text-gray-400 text-lg">No apprenticeships found</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
