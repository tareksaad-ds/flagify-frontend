'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { getSdkKeysForProject } from '@/lib/sdkKeyStore'
import { useSSEFlags } from '@/hooks/useSSEFlags'
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

  useEffect(() => {
    if (flag?.name) document.title = `Flagify — ${flag.name}`
  }, [flag?.name])

  function handleStateChange(updated: FlagState) {
    setFlag(prev =>
      prev
        ? { ...prev, states: prev.states.map(s => s.environment_id === updated.environment_id ? updated : s) }
        : prev
    )
  }

  const stateEnvIds = flag?.states.map(s => s.environment_id).join(',') ?? ''
  const sseConnections = useMemo(
    () => flag ? getSdkKeysForProject(id, flag.states.map(s => s.environment_id)) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, stateEnvIds]
  )

  useSSEFlags(sseConnections, (environmentId, update) => {
    if (!flag || update.flagKey !== flag.key) return
    const currentState = flag.states.find(s => s.environment_id === environmentId)
    if (!currentState) return
    handleStateChange({
      ...currentState,
      enabled: update.enabled,
      rollout_percentage: update.rollout_percentage,
      rules: update.rules,
    })
  })

  if (!loading && !flag) notFound()

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 animate-pulse">
          <div className="h-3 bg-border rounded w-48 mb-3" />
          <div className="h-6 bg-border rounded w-56 mb-1" />
          <div className="h-3 bg-border rounded w-32" />
        </div>
        <div className="space-y-4 mb-12 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-border rounded w-24" />
                <div className="h-6 w-10 bg-border rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-xs text-text-muted mb-1">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">Projects</Link>
          {' / '}
          <Link href={`/projects/${id}`} className="hover:text-text-primary transition-colors">{projectName}</Link>
          {' / '}
          <span className="text-text-primary">{flag!.name}</span>
        </p>
        <h1 className="text-xl font-semibold text-text-primary">{flag!.name}</h1>
        <p className="text-sm text-text-muted font-mono mt-0.5">{flag!.key}</p>
      </div>

      <div className="space-y-4 mb-12">
        {flag!.states.length === 0 ? (
          <p className="text-sm text-text-muted">No environments configured for this project yet.</p>
        ) : (
          flag!.states.map(state => (
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
