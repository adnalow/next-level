'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { use } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { jobCategories } from '../page'

type Job = {
  id: string
  title: string
  category: string
  description: string
  skill_tags: string[]
  location: string
  duration_days: number
  created_at: string
  status: string
  poster_email?: string
}

const applicationSchema = z.object({
  message: z.string().min(20, 'Cover letter must be at least 20 characters'),
  resume_url: z.string().url('Please enter a valid URL to your resume'),
})

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      message: '',
      resume_url: '',
    },
  })

  useEffect(() => {
    fetchJob()
    checkUserRole()
  }, [id])

  const fetchJob = async () => {
    try {
      const cleanId = id.toString().trim()
      
      // First get the job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', cleanId)
        .single()

      if (jobError) {
        console.error('Error loading job:', jobError)
        setError('Error loading job details')
        setLoading(false)
        return
      }

      if (!job) {
        setError('Job not found')
        setLoading(false)
        return
      }

      // Then get the poster's email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', job.poster_id)
        .single()

      if (profileError) {
        console.error('Error loading poster profile:', profileError)
      }

      // Combine the data
      const jobWithPoster: Job = {
        ...job,
        poster_email: profile?.email
      }

      setJob(jobWithPoster)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const checkUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profile) {
      setUserRole(profile.role)
    }
  }

  async function onSubmit(data: z.infer<typeof applicationSchema>) {
    setError(null)
    setIsApplying(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          applicant_id: session.user.id,
          message: data.message,
          resume_url: data.resume_url,
        })

      if (applicationError) {
        if (applicationError.code === '23505') {
          setError('You have already applied to this job')
        } else {
          setError('Error submitting application: ' + applicationError.message)
        }
        return
      }

      router.push('/applications')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">Job not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{job.title}</CardTitle>
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
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="mt-2 text-muted-foreground">{job.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Required Skills</h3>
            <div className="mt-2 flex flex-wrap gap-1">
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

          {userRole === 'job_seeker' && (
            <>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Apply for this Job</h3>
                {error && (
                  <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Letter</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell the job poster why you're the perfect candidate..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="resume_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resume URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://your-resume-url.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isApplying}>
                      {isApplying ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}