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
        setError(signInError.message)
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

        const redirectedFrom = searchParams.get('redirectedFrom')
        const defaultRedirect = profile?.role === 'job_poster' ? '/jobs/new' : '/jobs'
        router.push(redirectedFrom || defaultRedirect)
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#111010] flex flex-col items-center py-0">
      {/* Orange top border */}
      <div className="w-full h-[2px] bg-[#ff8800] mb-4" />
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center">
          <div className="w-full bg-[#232323] p-6 sm:p-8 md:p-10" style={{boxShadow: 'none', borderRadius: 0}}>
            <h1 className="text-3xl font-bold text-[#ff8800] uppercase tracking-wide mb-2 text-left">Welcome back</h1>
            <p className="mb-8 text-gray-300 text-base text-left">Sign in to continue your journey</p>
            {error && (
              <div className="mb-4 rounded-md bg-red-900/40 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-white font-bold tracking-wide">Email</FormLabel>
                      <FormControl>
                        <Input className="bg-black text-white border-none placeholder-gray-300 focus:ring-0 focus:border-none" placeholder="you@example.com" {...field} />
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
                      <FormLabel className="uppercase text-white font-bold tracking-wide">Password</FormLabel>
                      <FormControl>
                        <Input type="password" className="bg-black text-white border-none placeholder-gray-300 focus:ring-0 focus:border-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full bg-[#ff8800] text-black font-normal py-3 rounded-none hover:bg-[#ff8800] transition-colors uppercase tracking-wide text-lg">
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
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-[#ff8800] hover:underline font-bold">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
