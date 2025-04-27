'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { GoogleGenerativeAI } from "@google/generative-ai";

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

export default function CreateJobPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError)
        router.push('/auth/login')
        return
      }

      // Check if user is a job poster
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || profile?.role !== 'job_poster') {
        console.error('Profile error:', profileError)
        router.push('/')
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('Authentication error: ' + (sessionError?.message || 'No active session'))
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || profile?.role !== 'job_poster') {
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
          svg: badgeSvg
        })
      if (badgeError) {
        setError('Job created, but error saving badge: ' + badgeError.message)
        return
      }

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-500">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Logo Design Project" {...field} />
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
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
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
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Photoshop, Illustrator (comma-separated)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Manila, Philippines" {...field} />
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
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={7} 
                        value={field.value.toString()}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum duration is 7 days
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Post Job'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}