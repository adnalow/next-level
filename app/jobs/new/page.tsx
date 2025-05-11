'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, forwardRef } from 'react'
import axios from 'axios'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSessionContext } from '@/lib/SessionContext'
import ClientLayout from '../../components/ClientLayout'
import { toast } from "sonner"
import LoadingScreen from '@/components/ui/LoadingScreen'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

const locationOptions = [
  'Manila, Philippines',
  'Cebu, Philippines',
  'Remote',
  'Other (specify...)',
]

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
      {/* Animate page entry */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="min-h-screen bg-[#181818] flex flex-col items-center py-0 relative"
      >
        {/* Subtle background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="absolute inset-0 bg-gradient-to-br from-[#181818] via-[#232323] to-[#181818] pointer-events-none z-0"
        />
        <CreateJobPage />
      </motion.div>
    </ClientLayout>
  );
}

function SkillTagsInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [input, setInput] = useState('')
  const [tags, setTags] = useState<string[]>(value ? value.split(',').map(t => t.trim()).filter(Boolean) : [])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value)
  }
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      if (!tags.includes(input.trim())) {
        const newTags = [...tags, input.trim()]
        setTags(newTags)
        onChange(newTags.join(','))
      }
      setInput('')
    } else if (e.key === 'Backspace' && !input && tags.length) {
      const newTags = tags.slice(0, -1)
      setTags(newTags)
      onChange(newTags.join(','))
    }
  }
  function removeTag(idx: number) {
    const newTags = tags.filter((_, i) => i !== idx)
    setTags(newTags)
    onChange(newTags.join(','))
  }
  return (
    <div className="flex flex-wrap gap-2 items-center bg-black px-2 py-2 rounded border border-gray-700 focus-within:border-[#ff8800]">
      {tags.map((tag, idx) => (
        <span key={tag} className="flex items-center bg-[#ff8800] text-black px-2 py-1 rounded text-xs font-semibold">
          {tag}
          <button type="button" aria-label={`Remove skill ${tag}`} onClick={() => removeTag(idx)} className="ml-1 focus:outline-none">
            <X className="w-3 h-3 text-black hover:text-red-600" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className="bg-black text-white border-none outline-none flex-1 min-w-[120px] placeholder-gray-400"
        placeholder={tags.length ? '' : 'Press Enter after each skill'}
        aria-label="Add skill"
      />
    </div>
  )
}

// MotionButton wraps Button for Framer Motion animation support
const MotionButton = motion(
  forwardRef(function MotionButton(props: any, ref) {
    return <Button ref={ref} {...props} />
  })
)

function CreateJobPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locationType, setLocationType] = useState(locationOptions[0])
  const [customLocation, setCustomLocation] = useState('')
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
        setIsLoading(false)
        return
      }

      if (profile?.role !== 'job_poster') {
        setError('You must be a job poster to create listings')
        setIsLoading(false)
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
        setIsLoading(false)
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
        setIsLoading(false)
        return
      }

      // Only after all DB actions are done, show toast and redirect
      setIsLoading(false)
      toast(`Job posted successfully!`)
      router.push('/jobs')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    // Fade out loading spinner when done
    return (
      <AnimatePresence>
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoadingScreen />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Animation variants for staggered form fields
  const formVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };
  const fieldVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen w-full flex flex-col items-center py-0 relative z-10"
    >
      {/* Orange top border */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full h-[2px] bg-[#ff8800] mb-4 origin-left"
      />
      {/* Header with drop-down and underline reveal */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.35 }}
        className="w-full max-w-4xl flex flex-col sm:flex-row items-start sm:items-center px-4 sm:px-6 mb-6 gap-2 sm:gap-0"
      >
        <div className="flex items-center mb-2 sm:mb-0 relative">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="mr-3" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="#ff8800" strokeWidth="2"/>
            <path d="M16 7V5a4 4 0 0 0-8 0v2" stroke="#ff8800" strokeWidth="2" fill="none"/>
          </svg>
          <span className="relative">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#ff8800] uppercase tracking-widest drop-shadow">POST A NEW JOB</h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="absolute left-0 right-0 -bottom-1 h-1 bg-[#ff8800] rounded origin-left"
            />
          </span>
        </div>
      </motion.div>
      {/* Card */}
      <div className="w-full max-w-4xl px-2 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full bg-[#232323] p-6 sm:p-10 rounded-lg shadow-lg border border-[#222]"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 rounded-md bg-red-50 p-4 text-red-500"
            >
              {error}
            </motion.div>
          )}
          <Form {...form}>
            <motion.form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Staggered form fields */}
              <motion.div variants={fieldVariants}>
                {/* ...existing FormField for title... */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-white font-bold tracking-wide flex items-center">JOB TITLE <span className="ml-1 text-[#ff8800]">*</span></FormLabel>
                      <FormControl>
                        <Input className={`bg-black text-white border border-gray-700 focus:border-[#ff8800] focus:ring-0 placeholder-gray-400 ${form.formState.errors.title ? 'border-red-500' : ''}`} placeholder="Enter job title, e.g., Logo Design Project" aria-label="Job title input field" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              <motion.div variants={fieldVariants}>
                {/* ...existing FormField for category... */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-white font-bold tracking-wide flex items-center">CATEGORY <span className="ml-1 text-[#ff8800]">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black text-white border border-gray-700 focus:border-[#ff8800] focus:ring-0 flex items-center">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#262626] text-white border-none">
                          {jobCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value} className="hover:bg-black focus:bg-black transition-all duration-200">
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              <motion.div variants={fieldVariants}>
                {/* ...existing FormField for description... */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-white font-bold tracking-wide flex items-center">DESCRIPTION <span className="ml-1 text-[#ff8800]">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          className={`bg-black text-white border border-gray-700 focus:border-[#ff8800] focus:ring-0 min-h-[180px] placeholder-gray-400 ${form.formState.errors.description ? 'border-red-500' : ''}`}
                          placeholder="Describe the job requirements and expectations in detail..." 
                          aria-label="Job description input field"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              <motion.div variants={fieldVariants}>
                {/* ...existing FormField for skillTags... */}
                <FormField
                  control={form.control}
                  name="skillTags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-white font-bold tracking-wide flex items-center">REQUIRED SKILLS <span className="ml-1 text-[#ff8800]">*</span></FormLabel>
                      <FormControl>
                        <SkillTagsInput value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription className="text-gray-400">Press Enter after each skill</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              <motion.div variants={fieldVariants}>
                {/* ...existing FormField for location... */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-white font-bold tracking-wide flex items-center">LOCATION <span className="ml-1 text-[#ff8800]">*</span></FormLabel>
                      <FormControl>
                        <Input
                          className={`bg-black text-white border border-gray-700 focus:border-[#ff8800] focus:ring-0 placeholder-gray-400 ${form.formState.errors.location ? 'border-red-500' : ''}`}
                          placeholder="e.g., Manila, Philippines"
                          aria-label="Location input field"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              <motion.div variants={fieldVariants}>
                {/* ...existing FormField for durationDays... */}
                <FormField
                  control={form.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel className="uppercase text-white font-bold tracking-wide flex items-center">DURATION (DAYS) <span className="ml-1 text-[#ff8800]">*</span></FormLabel>
                        <span className="text-xs text-gray-400" title="Maximum duration is 7 days">(max 7)</span>
                      </div>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={7} 
                          className={`bg-black text-white border border-gray-700 focus:border-[#ff8800] focus:ring-0 w-32 ${form.formState.errors.durationDays ? 'border-red-500' : ''}`} 
                          value={field.value.toString()}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          aria-label="Duration in days"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              {/* Buttons with bounce and pulse */}
              <motion.div variants={fieldVariants} className="flex gap-4 mt-8">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                  className="flex-1"
                >
                  <MotionButton
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#ff8800] text-black font-bold py-3 rounded-lg hover:bg-orange-400 hover:shadow-lg transition-colors uppercase tracking-wide text-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#ff8800] focus:ring-offset-2 animate-bounce-once"
                    aria-label="Post job button"
                    whileHover={{ scale: 1.05, boxShadow: '0 0 0 4px #ff8800aa' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isLoading && <span className="loader border-2 border-t-2 border-t-black border-[#ff8800] rounded-full w-5 h-5 animate-spin" />}
                    {isLoading ? 'Posting...' : 'POST JOB'}
                  </MotionButton>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.25 }}
                  className="flex-1"
                >
                  <MotionButton
                    type="button"
                    variant="outline"
                    className="w-full border border-gray-600 text-white bg-transparent hover:bg-gray-800 rounded-lg py-3 font-bold uppercase tracking-wide text-lg"
                    onClick={() => router.push('/jobs')}
                    aria-label="Cancel job posting"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </MotionButton>
                </motion.div>
              </motion.div>
            </motion.form>
          </Form>
        </motion.div>
      </div>
    </motion.div>
  )
}