import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-7xl font-bold text-border mb-6 select-none">404</p>
        <p className="text-text-primary text-lg font-semibold mb-1">Page not found</p>
        <p className="text-text-muted text-sm mb-8">
          This project, flag, or page doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="text-accent hover:text-accent-hover text-sm font-medium transition-colors"
        >
          ← Back to projects
        </Link>
      </div>
    </div>
  )
}
