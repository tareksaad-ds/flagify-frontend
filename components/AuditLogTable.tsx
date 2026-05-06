'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { AuditEntry, Rule } from '@/types'

type Props = {
  projectId: string
  flagId: string
}

const LIMIT = 50

type DiffSide = { enabled: boolean; rollout_percentage: number; rules: Rule[] } | null

function formatDiff(before: DiffSide, after: DiffSide): string[] {
  if (!after) return []
  if (!before) return ['State initialized']
  const changes: string[] = []
  if (before.enabled !== after.enabled)
    changes.push(`enabled: ${before.enabled} → ${after.enabled}`)
  if (before.rollout_percentage !== after.rollout_percentage)
    changes.push(`rollout: ${before.rollout_percentage}% → ${after.rollout_percentage}%`)
  if (JSON.stringify(before.rules) !== JSON.stringify(after.rules))
    changes.push(`rules: ${before.rules.length} rule${before.rules.length !== 1 ? 's' : ''} → ${after.rules.length} rule${after.rules.length !== 1 ? 's' : ''}`)
  return changes.length ? changes : ['No changes recorded']
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const actionColor: Record<string, string> = {
  enabled: 'text-accent',
  disabled: 'text-danger',
  created: 'text-text-muted',
  updated: 'text-text-muted',
}

export default function AuditLogTable({ projectId, flagId }: Props) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    apiFetch<AuditEntry[]>(`/projects/${projectId}/flags/${flagId}/audit?limit=${LIMIT}&offset=0`)
      .then(data => {
        setLogs(data)
        setHasMore(data.length === LIMIT)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId, flagId])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const more = await apiFetch<AuditEntry[]>(
        `/projects/${projectId}/flags/${flagId}/audit?limit=${LIMIT}&offset=${logs.length}`
      )
      setLogs(prev => [...prev, ...more])
      setHasMore(more.length === LIMIT)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div>
      <h2 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-4">Audit Log</h2>

      {loading ? (
        <div className="border border-border rounded-xl overflow-hidden animate-pulse">
          <div className="h-9 bg-surface border-b border-border" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-3 ${i < 2 ? 'border-b border-border' : ''}`}>
              <div className="h-3 bg-border rounded w-24 shrink-0" />
              <div className="h-3 bg-border rounded flex-1" />
              <div className="h-3 bg-border rounded w-16 shrink-0" />
              <div className="h-3 bg-border rounded w-10 shrink-0" />
              <div className="h-3 bg-border rounded w-28 shrink-0" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-text-muted">No changes recorded yet.</p>
      ) : (
        <>
          <div className="border border-border rounded-xl overflow-x-auto">
            {/* Header */}
            <div
              className="grid bg-surface px-5 py-2.5 border-b border-border text-xs font-medium text-text-muted uppercase tracking-wide"
              style={{ gridTemplateColumns: '130px 1fr 110px 70px 1fr' }}
            >
              <span>When</span>
              <span>Who</span>
              <span>Environment</span>
              <span>Action</span>
              <span>Changes</span>
            </div>

            {logs.map((log, i) => {
              const changes = formatDiff(log.diff.before, log.diff.after)
              return (
                <div
                  key={log.id}
                  className={`grid items-start px-5 py-3 ${i < logs.length - 1 ? 'border-b border-border' : ''}`}
                  style={{ gridTemplateColumns: '130px 1fr 110px 70px 1fr' }}
                >
                  <span className="text-xs text-text-muted pt-0.5">{formatDate(log.created_at)}</span>
                  <span className="text-sm text-text-primary truncate pr-3">{log.user_email}</span>
                  <span className="text-xs text-text-muted pt-0.5">{log.environment_name}</span>
                  <span className={`text-xs font-medium pt-0.5 ${actionColor[log.action] ?? 'text-text-muted'}`}>
                    {log.action}
                  </span>
                  <div className="space-y-0.5">
                    {changes.map((c, j) => (
                      <p key={j} className="text-xs text-text-muted font-mono">{c}</p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 text-sm text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
