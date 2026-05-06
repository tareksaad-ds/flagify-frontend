'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import supabase from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useUser()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/flagify.png" alt="Flagify" width={22} height={22} />
          <span className="text-accent font-semibold tracking-wide uppercase text-sm">Flagify</span>
        </div>
        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="text-sm text-text-muted hidden sm:block truncate max-w-[220px]">{user.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
