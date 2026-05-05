'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import type { Project, Environment, Flag } from '@/types'
import EnvironmentBar from '@/components/EnvironmentBar'
import FlagList from '@/components/FlagList'
import CreateFlagModal from '@/components/CreateFlagModal'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <p className="p-8 text-text-muted text-sm">Loading…</p>
  if (!project) return <p className="p-8 text-text-muted text-sm">Project not found.</p>

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-text-muted mb-1">
            <Link href="/dashboard" className="hover:text-text-primary transition-colors">
              Projects
            </Link>
            {' / '}
            <span className="text-text-primary">{project.name}</span>
          </p>
          <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
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
        />
      </div>

      {showModal && (
        <CreateFlagModal
          projectId={id}
          onClose={() => setShowModal(false)}
          onCreated={flag => {
            setFlags(prev => [flag, ...prev])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
