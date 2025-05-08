'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['job_seeker', 'job_poster'], {
    required_error: "Please select a role",
  }),
})

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'job_seeker',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            role: values.role,
          },
        },
      })

      if (error) {
        setError(error.message)
      } else {
        // Fetch session and profile after sign up for debug
        const { data: { session } } = await supabase.auth.getSession()
        let userType = values.role
        let email = values.email
        if (session) {
          // Try to fetch user profile role if available
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single()
          if (profile?.role) userType = profile.role
          if (session.user?.email) email = session.user.email
        }
        // Debug: Log session, email, and user type
        console.log('SIGNUP SUCCESS:', {
          session,
          email,
          userType
        })
        router.push('/jobs')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#232526] via-[#414345] to-[#232526] dark:from-[#18181b] dark:via-[#232323] dark:to-[#18181b] transition-colors">
      {/* Branding/logo - centered above form */}
      <div className="flex flex-col items-center justify-center w-full mt-12 mb-6">
        <img src="/globe.svg" alt="Logo" className="h-12 w-12 mb-2 mx-auto" />
        <span className="text-2xl font-bold tracking-wide text-[#ff8800] text-center">NextLevel</span>
      </div>
      <div className="w-full max-w-md px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center">
        <div className="w-full bg-white dark:bg-[#232323] p-8 sm:p-10 md:p-12 shadow-xl rounded-2xl border border-gray-200 dark:border-[#232323] transition-all">
          <h1 className="text-3xl font-bold text-[#ff8800] uppercase tracking-wide mb-2 text-left">Create an account</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-300 text-base text-left">Choose your role and start exploring opportunities</p>
          {error && (
            <div className="mb-4 rounded-md bg-red-100 dark:bg-red-900/40 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-gray-800 dark:text-white font-bold tracking-wide">Email</FormLabel>
                    <FormControl>
                      <Input className="bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md placeholder-gray-400 focus:ring-2 focus:ring-[#ff8800] focus:border-[#ff8800] transition-all" placeholder="Enter your email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-gray-800 dark:text-white font-bold tracking-wide">Password</FormLabel>
                    <FormControl>
                      <Input type="password" className="bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md placeholder-gray-400 focus:ring-2 focus:ring-[#ff8800] focus:border-[#ff8800] transition-all" placeholder="Enter your password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="uppercase text-gray-800 dark:text-white font-bold tracking-wide">I want to...</FormLabel>
                      <span className="text-xs text-gray-500 dark:text-gray-400" title="Select your role for the platform">(Select your role)</span>
                    </div>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-[#ff8800] focus:border-[#ff8800] transition-all flex items-center justify-between group">
                          <SelectValue placeholder="Select your role" />
                          <svg className="ml-2 h-4 w-4 text-gray-400 group-hover:text-[#ff8800] transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-[#262626] text-gray-900 dark:text-white border-none">
                        <SelectItem value="job_seeker" className="hover:bg-gray-100 dark:hover:bg-black focus:bg-gray-100 dark:focus:bg-black">Find Opportunities</SelectItem>
                        <SelectItem value="job_poster" className="hover:bg-gray-100 dark:hover:bg-black focus:bg-gray-100 dark:focus:bg-black">Post Jobs</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#ff8800] to-[#ffa733] text-black font-semibold py-3 rounded-lg shadow-md border border-[#ff8800] hover:from-[#ffa733] hover:to-[#ff8800] hover:shadow-lg hover:scale-[1.03] focus:scale-[1.03] transition-all duration-150 uppercase tracking-wide text-lg focus:outline-none focus:ring-2 focus:ring-[#ff8800] focus:ring-offset-2">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    Signing Up...
                  </span>
                ) : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <div className="flex justify-center mt-8">
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-300">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gray-700 dark:text-gray-100 font-bold underline underline-offset-2 hover:text-[#ff8800] transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}