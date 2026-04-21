import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/ui/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userRow } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .maybeSingle()

  const userName = userRow?.name ?? userRow?.email?.split('@')[0] ?? 'you'
  const userEmail = userRow?.email ?? ''

  return (
    <div className="md:flex min-h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar userName={userName} userEmail={userEmail} />

      {/* Page content pushed right of sidebar on desktop */}
      <div className="flex-1 min-w-0 md:pl-56">
        {children}
      </div>
    </div>
  )
}
