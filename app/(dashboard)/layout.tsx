'use client'

import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <span className="text-accent font-semibold tracking-wide uppercase text-sm">Flagify</span>
        <button
          onClick={handleLogout}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          Sign out
        </button>
      </header>
      <main>{children}</main>
    </div>
  )
}
