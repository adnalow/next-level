'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMapMarkerAlt, faClock, faTag, faBriefcase, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons'
import ClientLayout from '../components/ClientLayout'
import { jobCategories } from "@/lib/constants"
import LoadingScreen from '@/components/ui/LoadingScreen';

type JobCategory = {
  value: 'digital_design' | 'programming' | 'writing' | 'marketing' | 'manual_labor' | 'tutoring' | 'gardening' | 'carpentry' | 'other'
  label: string
}

type Job = {
  id: string
  title: string
  category: JobCategory['value']
  description: string
  skill_tags: string[]
  location: string
  duration_days: number
  created_at: string
  status: string
}

type Badge = {
  id: string
  job_id: string
  title: string
  description: string
  svg: string
  created_at: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [badges, setBadges] = useState<{ [jobId: string]: Badge }>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<JobCategory['value'] | 'all'>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [locations, setLocations] = useState<string[]>([])
  const [sortOption, setSortOption] = useState('date_desc')
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Debounce searchTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Initial load (show LoadingScreen)
  useEffect(() => {
    setLoading(true)
    fetchJobs()
  }, [])

  // Fetch jobs when filters or debounced search change (no LoadingScreen for search)
  useEffect(() => {
    // If search is cleared, show all jobs (do not show LoadingScreen)
    if (debouncedSearchTerm === '' && selectedCategory === 'all' && selectedLocation === 'all' && sortOption === 'date_desc') {
      fetchJobs(false)
    } else if (debouncedSearchTerm !== '' || selectedCategory !== 'all' || selectedLocation !== 'all' || sortOption !== 'date_desc') {
      fetchJobs(false)
    }
    // eslint-disable-next-line
  }, [debouncedSearchTerm, selectedCategory, selectedLocation, sortOption])

  // Update fetchJobs to accept loading param
  const fetchJobs = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')

    // Sorting logic
    if (sortOption === 'date_desc') {
      query = query.order('created_at', { ascending: false })
    } else if (sortOption === 'date_asc') {
      query = query.order('created_at', { ascending: true })
    } else if (sortOption === 'location_asc') {
      query = query.order('location', { ascending: true })
    } else if (sortOption === 'title_asc') {
      query = query.order('title', { ascending: true })
    }

    if (selectedCategory && selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory)
    }

    if (selectedLocation && selectedLocation !== 'all') {
      query = query.ilike('location', `%${selectedLocation}%`)
    }

    if (debouncedSearchTerm) {
      query = query.or(`title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
      setBadges({})
      setLocations([])
      setLoading(false)
      return
    }
    setJobs(data as Job[])

    // Extract unique locations from jobs (trim and normalize case)
    const uniqueLocations = Array.from(
      new Set(
        (data as Job[])
          .map(j => (j.location || '').trim())
          .filter(Boolean)
          .map(loc => loc.toLowerCase() === 'remote' ? 'Remote' : loc)
      )
    )
    setLocations(uniqueLocations)

    // Fetch badges for all jobs
    const jobIds = (data as Job[]).map(j => j.id)
    if (jobIds.length > 0) {
      const { data: badgeData, error: badgeError } = await supabase
        .from('badges')
        .select('*')
        .in('job_id', jobIds)
      if (!badgeError && badgeData) {
        const badgeMap: { [jobId: string]: Badge } = {}
        badgeData.forEach((b: Badge) => { badgeMap[b.job_id] = b })
        setBadges(badgeMap)
      }
    }
    setLoading(false)
  }

  // Always update locations list based on all jobs, not just filtered jobs
  useEffect(() => {
    const fetchAllLocations = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('location')
        .eq('status', 'open')
      if (!error && data) {
        const uniqueLocations = Array.from(
          new Set(
            (data as { location: string }[])
              .map(j => (j.location || '').trim())
              .filter(Boolean)
              .map(loc => loc.toLowerCase() === 'remote' ? 'Remote' : loc)
          )
        )
        setLocations(uniqueLocations)
      }
    }
    fetchAllLocations()
    // eslint-disable-next-line
  }, [jobs.length]) // update locations whenever jobs change

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as JobCategory['value'] | 'all')
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-black text-white flex flex-col items-center">
        {/* Available Jobs Banner */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1440px] mt-8 mb-8 bg-[#232323] border border-orange-500 rounded-sm p-4 sm:p-6 md:p-8 flex flex-col gap-6 relative" style={{ boxShadow: 'none' }}>
            {/* Move search bar to the top for prominence */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 w-full items-stretch md:items-center">
              <div className="flex items-center bg-black border border-[#222] rounded-none px-3 sm:px-4 h-12 flex-1 min-w-0 group focus-within:border-orange-400 transition-all duration-300">
                <FontAwesomeIcon icon={faSearch} className="text-orange-500 mr-2 text-base transition-transform duration-300 group-focus-within:scale-110 group-focus-within:rotate-12" />
                <Input
                  placeholder="Search for jobs, skills or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-0 text-white focus:ring-0 placeholder:text-gray-400 h-12 px-0 text-base w-full min-w-0 focus:outline-none transition-all duration-300"
                  style={{ boxShadow: 'none', height: '48px', minHeight: '48px', lineHeight: '48px' }}
                />
              </div>
              {/* Category Dropdown with distinct style */}
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger
                  className="w-full md:w-56 h-12 flex items-center px-3 sm:px-4 border-2 border-orange-500 rounded bg-[#181818] text-white text-base font-semibold focus:ring-0 focus:outline-none shadow-none min-w-0 mt-2 md:mt-0"
                  style={{ backgroundColor: '#181818', borderRadius: 6, borderColor: '#ff9800', color: '#fff', boxShadow: 'none', height: '48px', minHeight: '48px', lineHeight: '48px' }}
                >
                  <FontAwesomeIcon icon={faFilter} className="text-orange-500 mr-2 text-base" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-[#232323] border-orange-500 text-white">
                  <SelectItem value="all">All Categories</SelectItem>
                  {jobCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="hover:bg-orange-500/20">{category.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Location Dropdown with distinct style */}
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger
                  className="w-full md:w-56 h-12 flex items-center px-3 sm:px-4 border-2 border-orange-500 rounded bg-[#181818] text-white text-base font-semibold focus:ring-0 focus:outline-none shadow-none min-w-0 mt-2 md:mt-0"
                  style={{ backgroundColor: '#181818', borderRadius: 6, borderColor: '#ff9800', color: '#fff', boxShadow: 'none', height: '48px', minHeight: '48px', lineHeight: '48px' }}
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 mr-2 text-base" />
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="bg-[#232323] border-orange-500 text-white">
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc} className="hover:bg-orange-500/20">{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Sorting Dropdown */}
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger
                  className="w-full md:w-56 h-12 flex items-center px-3 sm:px-4 border-2 border-orange-500 rounded bg-[#181818] text-white text-base font-semibold focus:ring-0 focus:outline-none shadow-none min-w-0 mt-2 md:mt-0"
                  style={{ backgroundColor: '#181818', borderRadius: 6, borderColor: '#ff9800', color: '#fff', boxShadow: 'none', height: '48px', minHeight: '48px', lineHeight: '48px' }}
                >
                  <FontAwesomeIcon icon={faFilter} className="text-orange-500 mr-2 text-base" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#232323] border-orange-500 text-white">
                  <SelectItem value="date_desc">Date Posted (Newest)</SelectItem>
                  <SelectItem value="date_asc">Date Posted (Oldest)</SelectItem>
                  <SelectItem value="location_asc">Location (A-Z)</SelectItem>
                  <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
              {/* Clear Filters Button */}
              <Button
                className="h-12 px-5 bg-gradient-to-r from-gray-700 to-orange-500 text-white font-bold rounded border-2 border-orange-500 hover:from-orange-500 hover:to-orange-600 hover:text-black transition-colors mt-2 md:mt-0"
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setSortOption('date_desc');
                }}
                type="button"
              >
                Clear Filters
              </Button>
            </div>
            {/* Header and jobs count row below search bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 md:gap-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <FontAwesomeIcon icon={faBriefcase} className="text-3xl md:text-4xl text-orange-500" />
                  <span className="text-3xl md:text-4xl font-black text-orange-400 tracking-wider drop-shadow-lg uppercase" style={{ letterSpacing: '0.08em' }}>AVAILABLE JOBS</span>
                </div>
                <p className="text-base text-white font-normal mt-1">Find your next micro-apprenticeship opportunity</p>
              </div>
              <div className="flex items-center mt-4 md:mt-0">
                <div className="flex flex-row items-center border-2 border-orange-400 bg-gradient-to-r from-orange-400 to-orange-500 rounded-md px-4 sm:px-6 py-3 sm:py-4 shadow-lg relative overflow-hidden rounded-md">
                  <div className="absolute -top-2 -left-2 w-14 h-14 rounded-full border-4 border-orange-400 animate-pulse opacity-60 z-0 hidden sm:block"></div>
                  <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 border-2 border-orange-500 bg-black rounded-full mr-4 sm:mr-6 z-10">
                    <span className="text-orange-500 font-extrabold text-xl sm:text-2xl">{jobs.length}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-sm sm:text-base text-black font-semibold leading-tight">Jobs available</span>
                    <span className="text-sm sm:text-base text-white font-extrabold leading-tight tracking-wide">JOBS READY TO APPLY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Responsive Job Cards Grid */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1440px] px-1 sm:px-2 md:px-4">
            {loading ? (
              <div className="flex justify-center">
                <div className="text-center text-orange-400">Loading jobs...</div>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="bg-[#232323] border border-gray-700">
                <CardContent className="flex items-center justify-center py-10">
                  <p className="text-gray-400">No jobs found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => {
                  const maxSkillTags = 3;
                  const visibleTags = job.skill_tags.slice(0, maxSkillTags);
                  const extraTags = job.skill_tags.length - maxSkillTags;
                  return (
                    <div
                      key={job.id}
                      className="relative bg-[#232323] rounded-lg flex flex-col min-h-[370px] p-5 sm:p-8 border-t-4 border-orange-500 shadow-none overflow-visible w-full max-w-full md:max-w-[500px] mx-auto h-full transition-all duration-300 hover:scale-[1.035] hover:shadow-2xl hover:shadow-orange-400/30 hover:bg-orange-500/10 cursor-pointer focus-within:ring-4 focus-within:ring-orange-400 focus-within:ring-opacity-50 animate-fade-in mb-6"
                      tabIndex={0}
                      style={{ margin: '12px' }}
                    >
                      <div className="flex-1 flex flex-col">
                        {/* Title and Badge Row */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-50 leading-snug text-left mb-2">
                              {job.title}
                            </CardTitle>
                            {/* Top row: status, category, remote */}
                            <div className="flex flex-wrap gap-2 mb-2 items-center">
                              <span className="inline-flex items-center gap-1 bg-orange-500 text-black text-xs font-bold rounded px-2 py-0.5 animate-pulse-slow shadow-orange-400/40 shadow-md">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                OPEN
                              </span>
                              <span className="inline-block bg-[#444] text-white text-xs rounded px-2 py-0.5 capitalize">
                                {jobCategories.find(c => c.value === job.category)?.label || job.category}
                              </span>
                              {job.location && job.location.trim().toLowerCase() === 'remote' && (
                                <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold rounded px-2 py-0.5 animate-pulse-slow">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white text-xs" />
                                  REMOTE
                                </span>
                              )}
                              {job.location && job.location.trim() !== '' && job.location.trim().toLowerCase() !== 'remote' && (
                                <span className="inline-flex items-center gap-1 bg-gray-700 text-white text-xs font-bold rounded px-2 py-0.5">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white text-xs" />
                                  {job.location}
                                </span>
                              )}
                            </div>
                          </div>
                          {badges[job.id]?.svg && (
                            <span className="flex-shrink-0 ml-2 sm:ml-4 mt-1 w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center" style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: badges[job.id].svg }} />
                          )}
                        </div>
                        {/* Description */}
                        <p className="text-sm text-gray-100 mb-6 line-clamp-2 text-left">{job.description}</p>
                        {/* Location and Duration Row */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-gray-300 text-sm mb-6">
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            {job.location && job.location.trim() !== '' ? job.location : 'Remote'}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-orange-400 text-base">
                            <FontAwesomeIcon icon={faClock} />
                            {job.duration_days === 1 ? '1 day' : `${job.duration_days} days`}
                          </span>
                        </div>
                        {/* Skill tags row with border */}
                        <div className="border-t border-[#444] pt-4 pb-6 flex flex-wrap gap-x-4 gap-y-2 items-center text-gray-300 text-sm">
                          {visibleTags.map((tag, index) => (
                            <span key={index} className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faTag} />
                              {tag}
                            </span>
                          ))}
                          {extraTags > 0 && (
                            <span className="flex items-center gap-1">+{extraTags} more</span>
                          )}
                        </div>
                      </div>
                      <Button
                        className="group w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-2 border-orange-500 hover:from-orange-600 hover:to-orange-700 hover:text-white rounded-md h-14 text-base mt-2 transition-all duration-200 shadow-md text-center focus:outline-none focus:ring-4 focus:ring-orange-400 focus:ring-opacity-50 transform hover:scale-105 flex items-center justify-center gap-2 animate-pulse-slow"
                        style={{ minHeight: 56, fontSize: '1.1rem', padding: '0.75rem 0' }}
                        onClick={() => {
                          const cleanId = job.id.toString().trim()
                          router.push(`/jobs/${cleanId}`)
                        }}
                      >
                        APPLY NOW
                        <span className="inline-block transition-all duration-200 transform group-hover:translate-x-1 group-hover:scale-110">→</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}