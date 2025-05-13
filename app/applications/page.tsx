'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSessionContext } from '@/lib/SessionContext'
import { MapPin, Clock, ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import ClientLayout from '../components/ClientLayout'
import { Input } from '@/components/ui/input'
import { jobCategories } from '@/lib/constants'
import LoadingScreen from '@/components/ui/LoadingScreen'

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

type Job = {
  id: string
  title: string
  category: string
  location: string
  status: string
  created_at: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [location, setLocation] = useState('all')
  const [status, setStatus] = useState('all')
  const [openCategories, setOpenCategories] = useState<{[cat:string]:boolean}>({})
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { session, profile, loading: sessionLoading } = useSessionContext()
  const userRole = profile?.role || null

  useEffect(() => {
    if (sessionLoading) return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if (userRole) {
      if (userRole === 'job_poster') {
        fetchJobs()
      } else {
        fetchApplications()
      }
    }
    // eslint-disable-next-line
  }, [session, userRole, sessionLoading])

  const fetchApplications = async () => {
    setLoading(true)
    if (!session) return
    try {
      let data, error
      if (userRole === 'job_seeker') {
        ({ data, error } = await supabase
          .from('applications')
          .select(`*, job:jobs(title, category, location)`)
          .eq('applicant_id', session.user.id)
          .order('created_at', { ascending: false })
        )
      } else {
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('id')
          .eq('poster_id', session.user.id)
        if (jobsError) throw jobsError
        const jobIds = jobs?.map(j => j.id) || []
        if (jobIds.length === 0) {
          setApplications([])
          setLoading(false)
          return
        }
        ({ data, error } = await supabase
          .from('applications')
          .select(`*, job:jobs(title, category, location), applicant:profiles!applications_applicant_id_fkey(email)`)
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
        )
      }
      if (error) {
        setError('Error loading applications')
      } else {
        setApplications(data || [])
      }
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Error loading applications')
    }
    setLoading(false)
  }

  const fetchJobs = async () => {
    setLoading(true)
    if (!session) return
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('poster_id', session.user.id)
        .order('created_at', { ascending: false })
      if (error) {
        setError('Error loading jobs')
      } else {
        setJobs(data || [])
      }
    } catch (err) {
      setError('Error loading jobs')
    }
    setLoading(false)
  }

  // Enhanced: Accepting an applicant closes the job and declines others
  const updateApplicationStatus = async (applicationId: string, newStatus: Application['status'], jobId?: string) => {
    setError(null)
    if (newStatus === 'in_progress' && jobId) {
      // Accept this application, decline others, and close the job
      const { error: acceptError } = await supabase
        .from('applications')
        .update({ status: 'in_progress' })
        .eq('id', applicationId)
      const { error: declineError } = await supabase
        .from('applications')
        .update({ status: 'declined' })
        .neq('id', applicationId)
        .eq('job_id', jobId)
      const { error: closeJobError } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', jobId)
      if (acceptError || declineError || closeJobError) {
        setError('Error updating application/job status')
      } else {
        fetchApplications()
      }
      return
    }
    // Default: just update the application status
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

  // Get unique locations for filter
  const locations = useMemo(() => {
    const locs = Array.from(new Set(jobs.map(j => (j.location || '').trim()).filter(Boolean)))
    return locs.length ? locs : ['Remote']
  }, [jobs])

  // Get unique locations for filter (for applications)
  const applicationLocations = useMemo(() => {
    const locs = Array.from(new Set(applications.map(a => (a.job.location || '').trim()).filter(Boolean)))
    return locs.length ? locs : ['Remote']
  }, [applications])

  // Filter and group applications (for job seekers)
  const filteredApplications = useMemo(() => {
    let filtered = applications
    if (search) filtered = filtered.filter(a => a.job.title.toLowerCase().includes(search.toLowerCase()))
    if (category !== 'all') filtered = filtered.filter(a => a.job.category === category)
    if (location !== 'all') filtered = filtered.filter(a => a.job.location === location)
    if (status !== 'all') filtered = filtered.filter(a => a.status === status)
    return filtered
  }, [applications, search, category, location, status])

  const applicationsByCategory = useMemo(() => {
    const grouped: {[cat:string]: Application[]} = {}
    filteredApplications.forEach(a => {
      const cat = a.job.category || 'Other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(a)
    })
    return grouped
  }, [filteredApplications])

  // Filter and group jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs
    if (search) filtered = filtered.filter(j => j.title.toLowerCase().includes(search.toLowerCase()))
    if (category !== 'all') filtered = filtered.filter(j => j.category === category)
    if (location !== 'all') filtered = filtered.filter(j => j.location === location)
    if (status !== 'all') filtered = filtered.filter(j => j.status === status)
    return filtered
  }, [jobs, search, category, location, status])

  const jobsByCategory = useMemo(() => {
    const grouped: {[cat:string]: Job[]} = {}
    filteredJobs.forEach(j => {
      const cat = j.category || 'Other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(j)
    })
    return grouped
  }, [filteredJobs])

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ClientLayout>
      <div className="min-h-screen px-2 sm:px-4 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto w-full">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#ff8000] mb-6 sm:mb-10 tracking-wide uppercase" style={{letterSpacing: '2px'}}>
            {userRole === 'job_seeker' ? 'MY APPLICATIONS' : 'MY POSTED JOBS'}
          </h1>
          {error && (
            <div className="rounded-md bg-red-900/40 p-3 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}
          {userRole === 'job_poster' ? (
            jobs.length === 0 ? (
              <Card className="bg-[#232323] border-none shadow-lg">
                <CardContent className="flex items-center justify-center py-10">
                  <p className="text-gray-400">No jobs found</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Search & Filters (Unified for both job posters and job seekers) */}
                <div className="flex flex-col gap-3 [@media(min-width:950px)]:flex-row [@media(min-width:950px)]:items-center [@media(min-width:950px)]:gap-4 mb-8 w-full">
                  <div className="flex flex-col [@media(min-width:950px)]:flex-row gap-3 w-full">
                    <div className="relative flex-1 min-w-0">
                      <Input
                        placeholder="Search jobs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#181818] text-white border-2 border-[#ff8000] rounded-none h-12 px-12 text-base focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] transition-all duration-150 shadow-none"
                        style={{ boxShadow: 'none' }}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8000]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff8000"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" /></svg>
                      </span>
                    </div>
                    <div className="flex flex-col [@media(min-width:950px)]:flex-row gap-3 w-full [@media(min-width:950px)]:w-auto">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full [@media(min-width:950px)]:w-48 h-12 bg-[#181818] text-white border-2 border-[#ff8000] rounded-none pl-12 focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] relative min-h-[3rem]" style={{height: '3rem'}}>
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8000]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff8000"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                          </span>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#232323] text-white">
                          <SelectItem value="all">All Categories</SelectItem>
                          {jobCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="w-full [@media(min-width:950px)]:w-48 h-12 bg-[#181818] text-white border-2 border-[#ff8000] rounded-none pl-12 focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] relative min-h-[3rem]" style={{height: '3rem'}}>
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8000]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff8000"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414A6 6 0 1 0 12.414 13.414l4.243 4.243a1 1 0 0 0 1.414-1.414Z" /></svg>
                          </span>
                          <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#232323] text-white">
                          <SelectItem value="all">All Locations</SelectItem>
                          {(userRole === 'job_poster' ? locations : applicationLocations).map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full [@media(min-width:950px)]:w-48 h-12 bg-[#181818] text-white border-2 border-[#ff8000] rounded-none pl-12 focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] relative min-h-[3rem]" style={{height: '3rem'}}>
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8000]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff8000"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                          </span>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#232323] text-white">
                          <SelectItem value="all">All Statuses</SelectItem>
                          {userRole === 'job_poster' ? (
                            <>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="declined">Declined</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="h-12 w-full [@media(min-width:950px)]:w-48 px-5 font-bold border-2 border-[#ff8000] text-white bg-[#ff8000] transition-all duration-150 rounded-none flex items-center justify-center min-h-[3rem] hover:bg-[#ff9900] hover:text-black hover:border-[#ff9900] focus:outline-none mt-2 [@media(min-width:950px)]:mt-0"
                    style={{ minWidth: '12rem', backgroundColor: '#ff8000', color: '#fff', borderColor: '#ff8000', height: '3rem' }}
                    onClick={() => {
                      setSearch('');
                      setCategory('all');
                      setLocation('all');
                      setStatus('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
                {/* Grouped by Category, Collapsible */}
                <div className="space-y-6">
                  {Object.entries(jobsByCategory).map(([cat, jobsInCat]) => {
                    const catLabel = jobCategories.find(c => c.value === cat)?.label || cat
                    const isOpen = openCategories[cat] ?? true
                    return (
                      <div key={cat} className="bg-[#181818] rounded-md border border-[#232323]">
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 text-lg font-bold text-white bg-[#232323] rounded-t-md focus:outline-none"
                          onClick={() => setOpenCategories(prev => ({...prev, [cat]: !isOpen}))}
                        >
                          <span>{catLabel}</span>
                          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        {isOpen && (
                          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
                            {jobsInCat.map(job => (
                              <div
                                key={job.id}
                                className="bg-[#23272f] rounded-xl shadow-lg flex flex-col min-h-[290px] border border-[#222] w-full transition-transform duration-150 hover:scale-[1.02] hover:shadow-[0_0_0_2px_#ff8000,0_8px_32px_0_rgba(0,0,0,0.25)] group"
                              >
                                <div className="flex-1 flex flex-col justify-between p-6 pb-0">
                                  <div>
                                    <div className="text-2xl font-bold text-white leading-tight mb-3 uppercase break-words" style={{letterSpacing: '1px'}}>{job.title}</div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-sm text-gray-300">
                                      <span className="inline-flex items-center gap-1 font-medium">
                                        <span className="text-xs font-semibold text-gray-400">Category:</span>
                                        <span>{jobCategories.find(c => c.value === job.category)?.label || job.category}</span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 font-medium">
                                        <span className="text-xs font-semibold text-gray-400">Location:</span>
                                        <span>{job.location}</span>
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-bold uppercase tracking-wide ${job.status === 'open' ? 'bg-[#ff9900] text-white shadow-[0_0_0_2px_#ff9900] border-2 border-[#ff9900]' : 'bg-gray-300 text-gray-700'}`}>{job.status === 'open' && <CheckCircle2 className="w-4 h-4 mr-1 text-[#ff8000]" />} {job.status === 'open' ? 'OPEN' : job.status.toUpperCase()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-auto p-6 pt-0 flex items-end">
                                  <button
                                    className="w-full border border-[#ff9900] text-white font-bold py-3 rounded-lg bg-[#232323] hover:bg-[#ff9900] hover:text-black transition-all duration-150 text-base tracking-wide uppercase shadow group-hover:shadow-[0_0_0_2px_#ff9900] focus:outline-none"
                                    onClick={() => router.push(`/applications/${job.id}`)}
                                  >
                                    VIEW DETAILS
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )
          ) : (
            applications.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-10">
                  <p className="text-muted-foreground">No applications found</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Search & Filters (Unified for both job posters and job seekers) */}
                <div className="flex flex-col gap-3 [@media(min-width:950px)]:flex-row [@media(min-width:950px)]:items-center [@media(min-width:950px)]:gap-4 mb-8 w-full">
                  <div className="flex flex-col [@media(min-width:950px)]:flex-row gap-3 w-full">
                    <div className="relative flex-1 min-w-0">
                      <Input
                        placeholder="Search jobs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#181818] text-white border-2 border-[#ff8000] rounded-none h-12 px-12 text-base focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] transition-all duration-150 shadow-none"
                        style={{ boxShadow: 'none' }}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8000]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff8000"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" /></svg>
                      </span>
                    </div>
                    <div className="flex flex-col [@media(min-width:950px)]:flex-row gap-3 w-full [@media(min-width:950px)]:w-auto">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full [@media(min-width:950px)]:w-48 h-12 bg-[#181818] text-white border-2 border-[#ff8000] rounded-none pl-12 focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] relative min-h-[3rem]" style={{height: '3rem'}}>
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8000]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff8000"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                          </span>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#232323] text-white">
                          <SelectItem value="all">All Categories</SelectItem>
                          {jobCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger className="w-full [@media(min-width:950px)]:w-48 h-12 bg-[#181818] text-white border-2 border-[#ff8000] rounded-none pl-12 focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] relative min-h-[3rem]" style={{height: '3rem'}}>
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8000]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff8000"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414A6 6 0 1 0 12.414 13.414l4.243 4.243a1 1 0 0 0 1.414-1.414Z" /></svg>
                          </span>
                          <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#232323] text-white">
                          <SelectItem value="all">All Locations</SelectItem>
                          {(userRole === 'job_poster' ? locations : applicationLocations).map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full [@media(min-width:950px)]:w-48 h-12 bg-[#181818] text-white border-2 border-[#ff8000] rounded-none pl-12 focus:ring-2 focus:ring-[#ff8000] focus:border-[#ff8000] relative min-h-[3rem]" style={{height: '3rem'}}>
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8000]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff8000"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                          </span>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#232323] text-white">
                          <SelectItem value="all">All Statuses</SelectItem>
                          {userRole === 'job_poster' ? (
                            <>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="applied">Applied</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="declined">Declined</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="h-12 w-full [@media(min-width:950px)]:w-48 px-5 font-bold border-2 border-[#ff8000] text-white bg-[#ff8000] transition-all duration-150 rounded-none flex items-center justify-center min-h-[3rem] hover:bg-[#ff9900] hover:text-black hover:border-[#ff9900] focus:outline-none mt-2 [@media(min-width:950px)]:mt-0"
                    style={{ minWidth: '12rem', backgroundColor: '#ff8000', color: '#fff', borderColor: '#ff8000', height: '3rem' }}
                    onClick={() => {
                      setSearch('');
                      setCategory('all');
                      setLocation('all');
                      setStatus('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
                {/* Grouped by Category, Collapsible */}
                <div className="space-y-6">
                  {Object.entries(applicationsByCategory).map(([cat, appsInCat]) => {
                    const catLabel = jobCategories.find(c => c.value === cat)?.label || cat
                    const isOpen = openCategories[cat] ?? true
                    return (
                      <div key={cat} className="bg-[#181818] rounded-md border border-[#232323]">
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 text-lg font-bold text-white bg-[#232323] rounded-t-md focus:outline-none"
                          onClick={() => setOpenCategories(prev => ({...prev, [cat]: !isOpen}))}
                        >
                          <span>{catLabel}</span>
                          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        {isOpen && (
                          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
                            {appsInCat.map(application => (
                              <div
                                key={application.id}
                                className="bg-[#23272f] rounded-xl shadow-lg flex flex-col min-h-[390px] max-h-[500px] border border-[#222] w-full transition-transform duration-150 hover:scale-[1.02] hover:shadow-[0_0_0_2px_#ff8000,0_8px_32px_0_rgba(0,0,0,0.25)] group"
                                style={{ height: 500 }}
                              >
                                <div className="flex-1 flex flex-col justify-between p-6 pb-0">
                                  <div>
                                    <div className="text-2xl font-bold text-white leading-tight mb-3 uppercase break-words" style={{letterSpacing: '1px'}}>{application.job.title}</div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-sm text-gray-300">
                                      <span className="inline-flex items-center gap-1 font-medium">
                                        <span className="text-xs font-semibold text-gray-400">Category:</span>
                                        <span>{jobCategories.find(c => c.value === application.job.category)?.label || application.job.category}</span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 font-medium">
                                        <span className="text-xs font-semibold text-gray-400">Location:</span>
                                        <span>{application.job.location}</span>
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                                        application.status === 'completed' ? 'bg-[#22c55e] text-white' :
                                        application.status === 'declined' ? 'bg-red-600 text-white' :
                                        application.status === 'in_progress' ? 'bg-blue-600 text-white' :
                                        'bg-[#ff9900] text-white shadow-[0_0_0_2px_#ff9900] border-2 border-[#ff9900]'
                                      }`}>
                                        {application.status === 'completed' && <CheckCircle2 className="w-4 h-4 mr-1 text-[#ff8000]" />} 
                                        {application.status === 'declined' && <XCircle className="w-4 h-4 mr-1 text-[#ff8000]" />} 
                                        {application.status === 'in_progress' && <Loader2 className="w-4 h-4 mr-1 animate-spin text-[#ff8000]" />} 
                                        {application.status === 'applied' && <Clock className="w-4 h-4 mr-1 text-[#ff8000]" />} 
                                        {application.status.replace('_', ' ').toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <div className="text-[#ff8000] text-sm font-bold mb-1 uppercase tracking-wide">Cover Letter</div>
                                    <div
                                      className="bg-[#181818] text-white text-sm rounded px-4 py-3 min-h-[56px] max-h-32 overflow-y-auto flex items-start"
                                      style={{maxHeight: '128px', minHeight: '56px', height: '128px', display: 'flex', alignItems: 'flex-start'}}
                                    >
                                      <span className="w-full break-words whitespace-pre-line">{application.message}</span>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="text-[#ff8000] text-sm font-bold mb-1 uppercase tracking-wide">Resume</div>
                                    <a
                                      href={application.resume_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 bg-black text-white font-bold px-4 py-3 rounded-none w-full justify-center text-base border border-[#222] hover:bg-[#181818] transition-colors duration-150"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6h6v6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h3.5a1 1 0 01.7.3l5.5 5.5a1 1 0 01.3.7V19a2 2 0 01-2 2z" />
                                      </svg>
                                      VIEW RESUME
                                    </a>
                                  </div>
                                </div>
                                <div className="mt-auto p-6 pt-0 flex items-end">
                                  <div className="flex flex-col w-full">
                                    <div className="flex items-center gap-4 text-[#ff8000] text-sm font-medium mb-2">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {application.job.location}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Applied: {new Date(application.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {/* No VIEW DETAILS button for job seekers */}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </ClientLayout>
  )
}