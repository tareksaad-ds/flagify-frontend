'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ToastProvider'
import type { Project, SdkKey } from '@/types'
import GenerateKeyModal from '@/components/GenerateKeyModal'

export default function SdkKeysPage() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [keys, setKeys] = useState<SdkKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [proj, keyList] = await Promise.all([
          apiFetch<Project>(`/projects/${id}`),
          apiFetch<SdkKey[]>(`/sdk/keys/${id}`),
        ])
        setProject(proj)
        setKeys(keyList)
      } catch {
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (project?.name) document.title = `Flagify — SDK Keys · ${project.name}`
  }, [project?.name])

  async function handleRevoke(keyId: string) {
    if (!confirm('Revoke this SDK key? Any clients using it will lose access immediately.')) return
    setRevoking(keyId)
    try {
      await apiFetch(`/sdk/keys/${id}/${keyId}`, { method: 'DELETE' })
      setKeys(prev => prev.map(k => k.id === keyId ? { ...k, revoked: true } : k))
      toast('Key revoked')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to revoke key', 'error')
    } finally {
      setRevoking(null)
    }
  }

  if (!loading && !project) notFound()

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8 animate-pulse">
          <div>
            <div className="h-3 bg-border rounded w-48 mb-3" />
            <div className="h-6 bg-border rounded w-28" />
          </div>
          <div className="h-9 w-28 bg-border rounded-lg" />
        </div>
        <div className="border border-border rounded-lg overflow-hidden animate-pulse">
          <div className="h-10 bg-surface border-b border-border" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i < 2 ? 'border-b border-border' : ''}`}>
              <div className="h-4 bg-border rounded w-24 flex-1" />
              <div className="h-4 bg-border rounded w-20" />
              <div className="h-4 bg-border rounded w-12" />
              <div className="h-4 bg-border rounded w-12" />
            </div>
          ))}
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
            <Link href={`/projects/${id}`} className="hover:text-text-primary transition-colors">
              {project!.name}
            </Link>
            {' / '}
            <span className="text-text-primary">SDK Keys</span>
          </p>
          <h1 className="text-xl font-semibold text-text-primary">SDK Keys</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Generate Key
        </button>
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-text-muted">No SDK keys yet. Generate one to start using the API.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                  Environment
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                  Created
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((key, i) => (
                <tr key={key.id} className={i < keys.length - 1 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-3 text-text-primary">{key.environment_name}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {key.revoked ? (
                      <span className="text-xs text-danger font-medium">Revoked</span>
                    ) : (
                      <span className="text-xs text-accent font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!key.revoked && (
                      <button
                        onClick={() => handleRevoke(key.id)}
                        disabled={revoking === key.id}
                        className="text-xs text-text-muted hover:text-danger transition-colors disabled:opacity-50"
                      >
                        {revoking === key.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <GenerateKeyModal
          projectId={id}
          onClose={() => setShowModal(false)}
          onCreated={key => {
            setKeys(prev => [key, ...prev])
          }}
        />
      )}
    </div>
  )
}
