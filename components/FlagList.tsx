'use client'

import Link from 'next/link'
import type { Flag } from '@/types'

type Props = {
  projectId: string
  flags: Flag[]
  flashFlagKey?: string | null
}

export default function FlagList({ projectId, flags, flashFlagKey }: Props) {
  if (flags.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-xl">
        <p className="text-text-muted text-sm">No flags yet.</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {flags.map((flag, i) => (
        <Link
          key={flag.id}
          href={`/projects/${projectId}/flags/${flag.id}`}
          className={`flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors group ${i < flags.length - 1 ? 'border-b border-border' : ''} ${flashFlagKey === flag.key ? 'ring-1 ring-inset ring-accent/50' : ''}`}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
              {flag.name}
            </p>
            <p className="text-xs text-text-muted font-mono mt-0.5 truncate">{flag.key}</p>
          </div>
          <span className="text-text-muted group-hover:text-accent transition-colors ml-4 shrink-0">→</span>
        </Link>
      ))}
    </div>
  )
}
