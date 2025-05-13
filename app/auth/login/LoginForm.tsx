"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { toast } from "sonner"
import LoadingScreen from '@/components/ui/LoadingScreen'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null)
    setIsLoading(true)
    try {
      const { error: signInError, data: { session } } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (signInError) {
        // If refresh token error, clear local session and prompt re-login
        if (signInError.message?.toLowerCase().includes('refresh token')) {
          await supabase.auth.signOut();
          setError('Session expired or invalid. Please log in again.');
        } else {
          setError(signInError.message)
        }
        return
      }

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        // Debug: Log session, email, and user type
        console.log('LOGIN SUCCESS:', {
          session,
          email: values.email,
          userType: profile?.role
        })

        toast(`Login successful! Welcome back, ${values.email}.`)

        const redirectedFrom = searchParams.get('redirectedFrom')
        const defaultRedirect = profile?.role === 'job_poster' ? '/jobs/new' : '/jobs'
        router.push(redirectedFrom || defaultRedirect)
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Branding/logo - centered above form */}
      <div className="flex flex-col items-center justify-center w-full mt-12 mb-6">
        <Link href="/">
          <img
            src="/next-logo.png"
            alt="NextLevel Logo"
            className="h-25 w-auto max-w-[200px] mb-2 mx-auto drop-shadow-lg object-contain"
            style={{ maxWidth: '60vw' }}
          />
        </Link>
      </div>
      <div className="w-full max-w-md px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center">
        <div className="w-full bg-white dark:bg-[#232323] p-8 sm:p-10 md:p-12 shadow-xl rounded-2xl border border-gray-200 dark:border-[#232323] transition-all">
          <h1 className="text-3xl font-bold text-[#ff8800] uppercase tracking-wide mb-2 text-left">Welcome back</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-300 text-base text-left">Sign in to continue your journey</p>
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
                      <Input type="password" className="bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-md placeholder-gray-400 focus:ring-2 focus:ring-[#ff8800] focus:border-[#ff8800] transition-all" placeholder="Enter your password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-[#ff8800] text-black font-semibold py-3 rounded-lg shadow-md hover:bg-[#ffa733] hover:shadow-lg hover:scale-[1.03] focus:scale-[1.03] transition-all duration-150 uppercase tracking-wide text-lg focus:outline-none focus:ring-2 focus:ring-[#ff8800] focus:ring-offset-2 border border-[#ff8800]">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    Signing In...
                  </span>
                ) : 'Sign In'}
              </Button>
            </form>
          </Form>
          <div className="flex justify-center mt-8">
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-300">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-gray-700 dark:text-gray-100 font-bold underline underline-offset-2 hover:text-[#ff8800] transition-colors">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
