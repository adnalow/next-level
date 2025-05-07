'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSessionContext } from '@/lib/SessionContext'
import { MapPin, Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import ClientLayout from '../components/ClientLayout'
import { Input } from '@/components/ui/input'
import { jobCategories } from '@/lib/constants'

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center text-white">Loading...</div>
      </div>
    )
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-black px-2 sm:px-4 py-6 sm:py-10">
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
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8 w-full items-stretch md:items-center">
                  <Input
                    placeholder="Search jobs..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-[#181818] text-white border border-[#222] rounded-none h-12 px-3 text-base min-w-0"
                  />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full md:w-48 h-12 bg-[#181818] text-white border border-[#222] rounded-none">
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
                    <SelectTrigger className="w-full md:w-48 h-12 bg-[#181818] text-white border border-[#222] rounded-none">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#232323] text-white">
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full md:w-48 h-12 bg-[#181818] text-white border border-[#222] rounded-none">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#232323] text-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
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
                                      <span className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-bold uppercase tracking-wide ${job.status === 'open' ? 'bg-[#ff9900] text-white shadow-[0_0_0_2px_#ff9900] border-2 border-[#ff9900]' : 'bg-gray-300 text-gray-700'}`}>{job.status === 'open' && <CheckCircle2 className="w-4 h-4 mr-1 text-white" />} {job.status === 'open' ? 'OPEN' : job.status.toUpperCase()}</span>
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
              userRole === 'job_seeker' ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="bg-[#232323] rounded shadow-lg flex flex-col min-h-[340px] border border-[#222] w-full"
                    >
                      <div className="p-4 sm:p-8 pb-4 flex-1 flex flex-col">
                        <div className="text-lg sm:text-2xl font-bold text-white leading-tight mb-4 uppercase tracking-wide" style={{letterSpacing: '1px'}}>
                          {application.job.title}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                          <span className="inline-flex items-center rounded bg-[#444] px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">{application.job.category}</span>
                          <span className="inline-flex items-center rounded bg-[#444] px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">{application.job.location}</span>
                          <span className={`inline-flex items-center rounded px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                            application.status === 'completed' ? 'bg-[#22c55e] text-white' :
                            application.status === 'declined' ? 'bg-red-600 text-white' :
                            application.status === 'in_progress' ? 'bg-blue-600 text-white' :
                            'bg-[#444] text-white'
                          }`}>
                            {application.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="text-[#ff8000] text-sm font-bold mb-1 uppercase tracking-wide">Cover Letter</div>
                          <div className="bg-[#181818] text-white text-sm rounded px-4 py-3 min-h-[56px]">{application.message}</div>
                        </div>
                        <div className="mb-3">
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
                      <div className="bg-[#2d2d2d] px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-b">
                        <div className="flex items-center gap-4 text-[#ff8000] text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Remote
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Applied: {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
                  {applications.map((application) => (
                    <Card key={application.id} className="w-full">
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
                              onClick={() => updateApplicationStatus(application.id, 'in_progress', application.job_id)}
                            >
                              Accept
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
              )
            )
          )}
        </div>
      </div>
    </ClientLayout>
  )
}