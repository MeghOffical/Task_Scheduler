import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LandingContent from '@/components/landing-content'

export default async function Home() {
  // If user is logged in, redirect to dashboard
  const token = cookies().get('auth_token')
  if (token) {
    redirect('/dashboard')
  }

  return <LandingContent />
}