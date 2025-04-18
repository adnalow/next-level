import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type UserRole = 'job_seeker' | 'job_poster'

export interface AuthFormData {
  email: string
  password: string
  role?: UserRole
}
