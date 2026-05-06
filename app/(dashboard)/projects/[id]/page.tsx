'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { getSdkKeysForProject } from '@/lib/sdkKeyStore'
import { useSSEFlags } from '@/hooks/useSSEFlags'
import { useToast } from '@/components/ToastProvider'
import type { Project, Environment, Flag } from '@/types'
import EnvironmentBar from '@/components/EnvironmentBar'
import FlagList from '@/components/FlagList'
import CreateFlagModal from '@/components/CreateFlagModal'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [flashFlagKey, setFlashFlagKey] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [proj, envs, flagList] = await Promise.all([
          apiFetch<Project>(`/projects/${id}`),
          apiFetch<Environment[]>(`/projects/${id}/environments`),
          apiFetch<Flag[]>(`/projects/${id}/flags`),
        ])
        setProject(proj)
        setEnvironments(envs)
        setFlags(flagList)
      } catch {
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (project?.name) document.title = `Flagify — ${project.name}`
  }, [project?.name])

  const envIds = useMemo(() => environments.map(e => e.id), [environments])
  const sseConnections = useMemo(
    () => getSdkKeysForProject(id, envIds),
    [id, envIds]
  )

  useSSEFlags(sseConnections, (_, update) => {
    setFlashFlagKey(update.flagKey)
    setTimeout(() => setFlashFlagKey(prev => prev === update.flagKey ? null : prev), 1200)
  })

  if (!loading && !project) notFound()

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 animate-pulse">
          <div className="h-3 bg-border rounded w-40 mb-3" />
          <div className="h-6 bg-border rounded w-48" />
        </div>
        <div className="mb-8 animate-pulse">
          <div className="h-3 bg-border rounded w-24 mb-3" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-7 w-20 bg-border rounded-full" />
            ))}
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-3 bg-border rounded w-16 mb-4" />
          <div className="border border-border rounded-xl overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < 3 ? 'border-b border-border' : ''}`}>
                <div className="space-y-2">
                  <div className="h-4 bg-border rounded w-36" />
                  <div className="h-3 bg-border rounded w-24" />
                </div>
                <div className="h-4 w-4 bg-border rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-text-muted mb-1">
            <Link href="/dashboard" className="hover:text-text-primary transition-colors">
              Projects
            </Link>
            {' / '}
            <span className="text-text-primary">{project!.name}</span>
          </p>
          <h1 className="text-xl font-semibold text-text-primary">{project!.name}</h1>
        </div>
        <Link
          href={`/projects/${id}/sdk-keys`}
          className="text-sm text-text-muted hover:text-text-primary transition-colors mt-1"
        >
          SDK Keys
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Environments</p>
        <EnvironmentBar
          projectId={id}
          environments={environments}
          onChange={setEnvironments}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Flags</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            New Flag
          </button>
        </div>

        <FlagList
          projectId={id}
          flags={flags}
          flashFlagKey={flashFlagKey}
        />
      </div>

      {showModal && (
        <CreateFlagModal
          projectId={id}
          onClose={() => setShowModal(false)}
          onCreated={flag => {
            setFlags(prev => [flag, ...prev])
            setShowModal(false)
            toast('Flag created')
          }}
        />
      )}
    </div>
  )
}
