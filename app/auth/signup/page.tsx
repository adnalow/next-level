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
  }

  return (
    <div className="min-h-screen bg-[#111010] flex flex-col items-center py-0">
      {/* Orange top border */}
      <div className="w-full h-[2px] bg-[#ff8800] mb-4" />
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center">
          <div className="w-full bg-[#232323] p-6 sm:p-8 md:p-10" style={{boxShadow: 'none', borderRadius: 0}}>
            <h1 className="text-3xl font-bold text-[#ff8800] uppercase tracking-wide mb-2 text-left">Create an account</h1>
            <p className="mb-8 text-gray-300 text-base text-left">Choose your role and start exploring opportunities</p>
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
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-white font-bold tracking-wide">I want to...</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black text-white border-none focus:ring-0 focus:border-none">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#262626] text-white border-none">
                          <SelectItem value="job_seeker" className="hover:bg-black focus:bg-black">Find Opportunities</SelectItem>
                          <SelectItem value="job_poster" className="hover:bg-black focus:bg-black">Post Jobs</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-[#ff8800] text-black font-normal py-3 rounded-none hover:bg-[#ff8800] transition-colors uppercase tracking-wide text-lg">Sign Up</Button>
              </form>
            </Form>
            <div className="flex justify-center mt-8">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-[#ff8800] hover:underline font-bold">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}