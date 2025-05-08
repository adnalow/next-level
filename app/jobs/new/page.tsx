'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSessionContext } from '@/lib/SessionContext'
import ClientLayout from '../../components/ClientLayout'
import { toast } from "sonner"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const jobCategories = [
  { value: 'digital_design', label: 'Digital Design' },
  { value: 'programming', label: 'Programming' },
  { value: 'writing', label: 'Writing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'manual_labor', label: 'Manual Labor' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'other', label: 'Other' },
] as const

// Input schema (what the form accepts)
const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.enum(['digital_design', 'programming', 'writing', 'marketing', 'manual_labor', 'tutoring', 'gardening', 'carpentry', 'other']),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  skillTags: z.string(),
  location: z.string().min(3, 'Location is required'),
  durationDays: z.coerce.number().min(1).max(7, 'Duration cannot exceed 7 days'),
})

type FormInput = z.input<typeof formSchema>
type FormOutput = z.output<typeof formSchema>

export default function NewJobPage() {
  return (
    <ClientLayout>
      <CreateJobPage />
    </ClientLayout>
  );
}

function CreateJobPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { session, profile, loading: sessionLoading } = useSessionContext()

  useEffect(() => {
    if (!sessionLoading) {
      if (!session) {
        router.push('/auth/login')
        return
      }
      if (profile?.role !== 'job_poster') {
        router.push('/')
        return
      }
      setIsLoading(false)
    }
    // eslint-disable-next-line
  }, [sessionLoading, session, profile])

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      skillTags: '',
      location: '',
      durationDays: 1,
    },
  })

  async function onSubmit(data: FormInput) {
    setError(null)
    setIsLoading(true)

    try {
      if (!session) {
        setError('Authentication error: No active session')
        return
      }

      if (profile?.role !== 'job_poster') {
        setError('You must be a job poster to create listings')
        return
      }

      // Convert comma-separated string to array
      const skillTagsArray = data.skillTags.split(',').map(tag => tag.trim()).filter(Boolean)

      const jobData = {
        title: data.title,
        category: data.category,
        description: data.description,
        skill_tags: skillTagsArray,
        location: data.location,
        duration_days: data.durationDays,
        poster_id: session.user.id,
      }

      // Insert job and get the new job's ID
      const { data: insertedJobs, error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select('id')

      if (jobError || !insertedJobs || insertedJobs.length === 0) {
        setError('Error creating job: ' + (jobError?.message || 'Unknown error'))
        return
      }
      const jobId = insertedJobs[0].id

      // Call the server-side API route for badge generation
      let badgeTitle = ''
      let badgeDescription = ''
      let badgeSvg = ''
      try {
        const badgeRes = await fetch('/api/generate-badge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            category: data.category,
            description: data.description,
            skillTagsArray,
            location: data.location
          })
        })
        const badgeData = await badgeRes.json()
        badgeTitle = badgeData.title || 'Badge'
        badgeDescription = badgeData.description || 'Badge for job completion.'
        badgeSvg = badgeData.svg || ''
      } catch (err) {
        badgeTitle = `Achievement: ${data.title}`
        badgeDescription = `Badge for completing the job: ${data.title}`
        badgeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#4F46E5" /><text x="50%" y="54%" text-anchor="middle" fill="#fff" font-size="16" font-family="Arial" dy=".3em">Badge</text></svg>'
      }

      // Insert badge into badges table
      const { error: badgeError } = await supabase
        .from('badges')
        .insert({
          job_id: jobId,
          title: badgeTitle,
          description: badgeDescription,
          svg: badgeSvg,
          category: data.category, // include category
          location: data.location  // include location
        })
      if (badgeError) {
        setError('Job created, but error saving badge: ' + badgeError.message)
        return
      }

      toast(`Job posted successfully!`)
      router.push('/jobs')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111010] flex flex-col items-center py-0">
      {/* Orange top border */}
      <div className="w-full h-[2px] bg-[#ff8800] mb-4" />
      {/* Title and icon left-aligned, responsive */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-start sm:items-center px-4 sm:px-6 mb-6 gap-2 sm:gap-0">
        <div className="flex items-center mb-2 sm:mb-0">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mr-2" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="#ff8800" strokeWidth="2"/>
            <path d="M16 7V5a4 4 0 0 0-8 0v2" stroke="#ff8800" strokeWidth="2" fill="none"/>
          </svg>
          <h1 className="text-2xl sm:text-3xl font-normal text-[#ff8800] uppercase tracking-wide">Post a New Job</h1>
        </div>
      </div>
      {/* Card */}
      <div className="w-full max-w-4xl px-2 sm:px-6">
        <div className="w-full bg-[#232323] p-4 sm:p-8" style={{boxShadow: 'none', borderRadius: 0}}>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-500">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-white font-bold tracking-wide">JOB TITLE</FormLabel>
                    <FormControl>
                      <Input className="bg-black text-white border-none placeholder-gray-300 focus:ring-0 focus:border-none" placeholder="e.g., Logo Design Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-white font-bold tracking-wide">CATEGORY</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black text-white border-none focus:ring-0 focus:border-none">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#262626] text-white border-none">
                        {jobCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value} className="hover:bg-black focus:bg-black">
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-white font-bold tracking-wide">DESCRIPTION</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="bg-black text-white border-none placeholder-gray-300 focus:ring-0 focus:border-none min-h-[120px]"
                        placeholder="Describe the job requirements and expectations..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skillTags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-white font-bold tracking-wide">REQUIRED SKILLS</FormLabel>
                    <FormControl>
                      <Input 
                        className="bg-black text-white border-none placeholder-gray-300 focus:ring-0 focus:border-none" 
                        placeholder="e.g., Photoshop, Illustrator (comma-separated)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Enter skills separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-white font-bold tracking-wide">LOCATION</FormLabel>
                    <FormControl>
                      <Input className="bg-black text-white border-none placeholder-gray-300 focus:ring-0 focus:border-none" placeholder="e.g., Manila, Philippines" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-white font-bold tracking-wide">DURATION (DAYS)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={7} 
                        className="bg-black text-white border-none focus:ring-0 focus:border-none" 
                        value={field.value.toString()}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Maximum duration is 7 days
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full bg-[#ff8800] text-black font-normal py-3 rounded-none hover:bg-[#ff8800] transition-colors uppercase tracking-wide text-lg">
                {isLoading ? 'Creating...' : 'POST JOB'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}