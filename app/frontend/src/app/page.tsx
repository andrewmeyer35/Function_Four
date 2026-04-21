// Root redirect: signed-in users go to /household, everyone else to /login.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/household')
  redirect('/login')
}
