'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import type { Project, FlagWithStates, FlagState } from '@/types'
import FlagStateEditor from '@/components/FlagStateEditor'
import AuditLogTable from '@/components/AuditLogTable'

export default function FlagDetailPage() {
  const { id, flagId } = useParams<{ id: string; flagId: string }>()
  const [flag, setFlag] = useState<FlagWithStates | null>(null)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<FlagWithStates>(`/projects/${id}/flags/${flagId}`),
      apiFetch<Project>(`/projects/${id}`),
    ])
      .then(([f, p]) => {
        setFlag(f)
        setProjectName(p.name)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, flagId])

  function handleStateChange(updated: FlagState) {
    setFlag(prev =>
      prev
        ? { ...prev, states: prev.states.map(s => s.environment_id === updated.environment_id ? updated : s) }
        : prev
    )
  }

  if (loading) return <p className="p-8 text-text-muted text-sm">Loading…</p>
  if (!flag) return <p className="p-8 text-text-muted text-sm">Flag not found.</p>

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-xs text-text-muted mb-1">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">Projects</Link>
          {' / '}
          <Link href={`/projects/${id}`} className="hover:text-text-primary transition-colors">{projectName}</Link>
          {' / '}
          <span className="text-text-primary">{flag.name}</span>
        </p>
        <h1 className="text-xl font-semibold text-text-primary">{flag.name}</h1>
        <p className="text-sm text-text-muted font-mono mt-0.5">{flag.key}</p>
      </div>

      <div className="space-y-4 mb-12">
        {flag.states.length === 0 ? (
          <p className="text-sm text-text-muted">No environments configured for this project yet.</p>
        ) : (
          flag.states.map(state => (
            <FlagStateEditor
              key={state.environment_id}
              projectId={id}
              flagId={flagId}
              state={state}
              onChange={handleStateChange}
            />
          ))
        )}
      </div>

      <AuditLogTable projectId={id} flagId={flagId} />
    </div>
  )
}
