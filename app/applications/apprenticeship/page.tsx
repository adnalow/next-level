// New page for "Apprenticeship" tab for posters
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSessionContext } from '@/lib/SessionContext'
import { User } from "lucide-react"
import ClientLayout from '../../components/ClientLayout';

export default function ApprenticeshipPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [apprentices, setApprentices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const { session, loading: sessionLoading } = useSessionContext()

  useEffect(() => {
    if (!sessionLoading && session) {
      fetchApprenticeships()
      fetchApprentices()
    }
    // eslint-disable-next-line
  }, [sessionLoading, session])

  const fetchApprenticeships = async () => {
    setLoading(true)
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
    setLoading(false)
  }

  const fetchApprentices = async () => {
    setLoading(true)
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
        setLoading(false)
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
    setLoading(false)
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
    fetchApprentices()
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-black">Loading...</div>
  }

  // Only show the first apprentice as in the image
  const apprentice = apprentices[0]

  return (
    <ClientLayout>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto pt-12 px-2 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-500 text-2xl"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368M18 21.75a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg></span>
            <h1 className="text-3xl font-bold tracking-wide text-orange-500">APPRENTICESHIP</h1>
          </div>
          <div className="text-gray-300 mb-8 text-base">Track ongoing and completed apprenticeships</div>
          {error && (
            <div className="rounded-md bg-red-900/40 p-3 text-sm text-red-400 mb-6">{error}</div>
          )}
          {apprentice ? (
            <div className="bg-[#222] border border-[#333] max-w-full mx-auto mt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-6 sm:py-10 gap-4">
                <div className="flex-1 min-w-0 w-full">
                  <div className="text-lg sm:text-[1.5rem] font-bold text-white uppercase mb-2" style={{letterSpacing: '0px'}}>{apprentice.jobTitle}</div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-1">
                    <span className="flex items-center text-white text-base"><User className="mr-1 text-orange-500 w-5 h-5" />{apprentice.applicantEmail}</span>
                    <span className="bg-[#2563eb] text-white text-[0.85rem] font-bold rounded-none px-2 py-1 sm:ml-2 uppercase" style={{lineHeight:'1.1',letterSpacing:'0.5px'}}>IN PROGRESS</span>
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Accepted: {apprentice.accepted_at ? new Date(apprentice.accepted_at).toLocaleString() : new Date(apprentice.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center h-full w-full sm:w-auto ml-0 sm:ml-8">
                  <button
                    className="w-full sm:w-auto bg-[#FF8800] text-black font-bold px-6 sm:px-8 py-3 text-base uppercase tracking-normal shadow-none border-none rounded-none hover:bg-[#ff9900] transition-colors duration-150"
                    style={{minWidth:'120px'}}
                    onClick={() => markApprenticeCompleted(apprentice.id)}
                  >
                    COMPLETE
                  </button>
                </div>
              </div>
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
