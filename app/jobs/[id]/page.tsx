'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { use } from 'react'
import { useSessionContext } from '@/lib/SessionContext'
import { toast } from "sonner"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { jobCategories } from '@/lib/constants'
import { Building2, Globe, CalendarDays, Tag, Mail, Clock } from 'lucide-react'
import ClientLayout from '../../components/ClientLayout'
import LoadingScreen from '@/components/ui/LoadingScreen'

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
  const { session, profile, loading: sessionLoading } = useSessionContext()

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      message: '',
      resume_url: '',
    },
  })

  useEffect(() => {
    fetchJob()
    if (!sessionLoading && session) {
      setUserRole(profile?.role || null)
    }
    // eslint-disable-next-line
  }, [id, sessionLoading, session, profile])

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

  async function onSubmit(data: z.infer<typeof applicationSchema>) {
    setError(null)
    setIsApplying(true)

    try {
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

      toast(`Application submitted successfully!`)
      router.push('/applications')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsApplying(false)
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!job) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-[#222] border border-orange-500">
          <CardContent className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">Job not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-[#222] flex justify-center px-2 sm:px-4 md:px-6">
        <div className="w-full max-w-4xl mx-auto py-6 sm:py-10">
          <div className="bg-[#222] rounded-lg shadow border border-[#333]">
            <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-orange-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-orange-500 tracking-wide">
                  {job.title}
                </h1>
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-xs text-white/70">Posted on</span>
                  <span className="text-sm font-semibold text-white border border-orange-500 rounded px-2 py-1 mt-1 whitespace-nowrap">
                    {new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                <span className="inline-flex items-center gap-1 text-xs text-white bg-[#181818] border border-[#333] rounded px-2 py-1">
                  <Globe className="w-4 h-4 text-orange-500" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-white bg-[#181818] border border-[#333] rounded px-2 py-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  {job.duration_days} {job.duration_days === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>

            <div className="px-4 sm:px-8 py-6 space-y-8">
              <section>
                <h2 className="text-base sm:text-lg font-semibold text-orange-500 mb-2 border-l-4 border-orange-500 pl-2">Description</h2>
                <p className="text-white/90 text-base leading-relaxed break-words">{job.description}</p>
              </section>

              <section>
                <h2 className="text-base sm:text-lg font-semibold text-orange-500 mb-2 border-l-4 border-orange-500 pl-2">Skills</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.skill_tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs text-white bg-[#181818] border border-[#333] rounded px-2 py-1">
                      <Tag className="w-4 h-4 text-orange-500" />
                      {tag}
                    </span>
                  ))}
                </div>
              </section>

              {userRole === 'job_seeker' && (
                <section className="bg-[#181818] border border-orange-500 rounded-lg px-2 sm:px-6 py-6 sm:py-8 mt-8">
                  <h2 className="text-lg sm:text-xl font-bold text-orange-500 mb-4 sm:mb-6">APPLY FOR THIS JOB</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                      <div>
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">COVER LETTER</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="bg-[#222] border border-orange-500 text-white placeholder:text-white/40 min-h-[100px] sm:min-h-[120px]"
                                  placeholder="Tell the job poster why you're the perfect candidate..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name="resume_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">RESUME URL</FormLabel>
                              <FormControl>
                                <Input
                                  className="bg-[#222] border border-orange-500 text-white placeholder:text-white/40"
                                  placeholder="https://your-resume-url.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {error && (
                        <div className="rounded bg-red-900/40 border border-red-700 text-red-400 px-4 py-2 text-sm">
                          {error}
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={isApplying}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded mt-2 shadow-none border-none"
                      >
                        {isApplying ? 'Submitting...' : 'SUBMIT APPLICATION'}
                      </Button>
                    </form>
                  </Form>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}