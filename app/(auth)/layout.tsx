export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-surface rounded-xl border border-border p-8">
        {children}
      </div>
    </div>
  )
}
