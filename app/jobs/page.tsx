'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type JobCategory = {
  value: 'digital_design' | 'programming' | 'writing' | 'marketing' | 'manual_labor' | 'tutoring' | 'gardening' | 'carpentry' | 'other'
  label: string
}

export const jobCategories: JobCategory[] = [
  { value: 'digital_design', label: 'Digital Design' },
  { value: 'programming', label: 'Programming' },
  { value: 'writing', label: 'Writing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'manual_labor', label: 'Manual Labor' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'other', label: 'Other' },
]

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<JobCategory['value'] | 'all'>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
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

    if (selectedLocation) {
      query = query.ilike('location', `%${selectedLocation}%`)
    }

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
    } else {
      setJobs(data as Job[])
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
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Available Jobs</h1>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {jobCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full md:w-44"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="text-center">Loading jobs...</div>
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">No jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-2">{job.title}</CardTitle>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                        {jobCategories.find(c => c.value === job.category)?.label || job.category}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
                        {job.location}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
                        {job.duration_days} {job.duration_days === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {job.description}
                </p>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {job.skill_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => {
                    const cleanId = job.id.toString().trim()
                    router.push(`/jobs/${cleanId}`)
                  }}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}