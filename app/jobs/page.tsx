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
  const [selectedCategory, setSelectedCategory] = useState<JobCategory['value'] | 'all'>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (selectedCategory && selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory)
    }

    if (selectedLocation && selectedLocation !== 'all') {
      query = query.ilike('location', `%${selectedLocation}%`)
    }

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
      setBadges({})
      setLoading(false)
      return
    }
    setJobs(data as Job[])

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

  // Filter jobs whenever search terms or filters change
  useEffect(() => {
    fetchJobs()
  }, [searchTerm, selectedCategory, selectedLocation])

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as JobCategory['value'] | 'all')
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-black text-white flex flex-col items-center">
        {/* Available Jobs Banner */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1440px] mt-8 mb-8 bg-[#232323] border border-orange-500 rounded-sm p-8 flex flex-col gap-6 relative" style={{ boxShadow: 'none' }}>
            <div className="flex flex-row justify-between items-start w-full">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <FontAwesomeIcon icon={faBriefcase} className="text-2xl text-orange-500" />
                  <span className="text-2xl font-extrabold text-orange-500 tracking-wide">AVAILABLE JOBS</span>
                </div>
                <p className="text-base text-white font-normal mt-1">Find your next micro-apprenticeship opportunity</p>
              </div>
              <div className="flex items-center">
                <div className="flex flex-row items-center border-2 border-orange-500 bg-black rounded-sm px-6 py-4" style={{ boxShadow: 'none' }}>
                  <div className="flex items-center justify-center w-14 h-14 border-2 border-orange-500 mr-6">
                    <span className="text-orange-500 font-bold text-2xl">{jobs.length}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-base text-gray-400 leading-tight">Jobs available</span>
                    <span className="text-base text-white font-bold leading-tight">Ready to apply</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-row gap-4 mt-6 w-full items-center">
              {/* Search Field - full width, black background, uniform height */}
              <div className="flex items-center bg-black border border-[#222] rounded-none px-4 h-12 flex-1 min-w-0">
                <FontAwesomeIcon icon={faSearch} className="text-orange-500 mr-2 text-base" />
                <Input
                  placeholder="Search for jobs, skills or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-0 text-white focus:ring-0 placeholder:text-gray-400 h-12 px-0 text-base w-full min-w-0"
                  style={{ boxShadow: 'none', height: '48px', minHeight: '48px', lineHeight: '48px' }}
                />
              </div>
              {/* Category Dropdown - match search field style and height */}
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger
                  className="w-56 h-12 flex items-center px-4 border border-[#222] rounded-none bg-black text-white text-base font-normal focus:ring-0 focus:outline-none shadow-none min-w-0"
                  style={{ backgroundColor: '#000', borderRadius: 0, borderColor: '#222', color: '#fff', boxShadow: 'none', height: '48px', minHeight: '48px', lineHeight: '48px' }}
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
              {/* Location Dropdown - match search field style and height */}
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger
                  className="w-56 h-12 flex items-center px-4 border border-[#222] rounded-none bg-black text-white text-base font-normal focus:ring-0 focus:outline-none shadow-none min-w-0"
                  style={{ backgroundColor: '#000', borderRadius: 0, borderColor: '#222', color: '#fff', boxShadow: 'none', height: '48px', minHeight: '48px', lineHeight: '48px' }}
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 mr-2 text-base" />
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="bg-[#232323] border-orange-500 text-white">
                  <SelectItem value="all">All Locations</SelectItem>
                  {/* Optionally, you can map locations here if you have a list */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/* Job Cards Grid */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1440px] px-1 md:px-2 lg:px-4">
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
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => {
                  const maxSkillTags = 3;
                  const visibleTags = job.skill_tags.slice(0, maxSkillTags);
                  const extraTags = job.skill_tags.length - maxSkillTags;
                  return (
                    <div key={job.id} className="relative bg-[#232323] rounded-md flex flex-col min-h-[370px] p-7 border-t-4 border-orange-500 shadow-none overflow-visible w-full max-w-[500px] mx-auto h-full">
                      <div className="flex-1 flex flex-col">
                        {/* Title and Badge Row */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <CardTitle className="text-2xl font-bold text-white leading-snug text-left mb-2">
                              {job.title}
                            </CardTitle>
                            {/* Top row: status, category, remote */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="inline-block bg-orange-500 text-black text-xs font-bold rounded px-2 py-0.5">OPEN</span>
                              <span className="inline-block bg-[#444] text-white text-xs rounded px-2 py-0.5 capitalize">{jobCategories.find(c => c.value === job.category)?.label || job.category}</span>
                              <span className="inline-block bg-[#444] text-white text-xs rounded px-2 py-0.5">Remote</span>
                            </div>
                          </div>
                          {badges[job.id]?.svg && (
                            <span className="flex-shrink-0 ml-4 mt-1 w-20 h-20 flex items-center justify-center" style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: badges[job.id].svg }} />
                          )}
                        </div>
                        {/* Description */}
                        <p className="text-sm text-gray-200 mb-4 line-clamp-2 text-left">{job.description}</p>
                        {/* Location and Duration Row */}
                        <div className="flex items-center gap-8 text-gray-400 text-sm mb-4">
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            {job.location || 'Remote'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faClock} />
                            {job.duration_days} {job.duration_days === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        {/* Skill tags row with border */}
                        <div className="border-t border-[#444] pt-3 pb-5 flex flex-wrap gap-x-4 gap-y-2 items-center text-gray-400 text-sm">
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
                        className="w-full bg-[#2a2a2a] text-white font-bold hover:bg-orange-600 rounded-none h-12 text-base mt-0"
                        onClick={() => {
                          const cleanId = job.id.toString().trim()
                          router.push(`/jobs/${cleanId}`)
                        }}
                      >
                        VIEW DETAILS
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