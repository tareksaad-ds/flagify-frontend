'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { storeSdkKey } from '@/lib/sdkKeyStore'
import type { Environment, SdkKey, SdkKeyCreated } from '@/types'

interface Props {
  projectId: string
  onClose: () => void
  onCreated: (key: SdkKey) => void
}

export default function GenerateKeyModal({ projectId, onClose, onCreated }: Props) {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [envId, setEnvId] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Don't close on ESC after the key has been revealed — user should copy it first
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !createdKey) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, createdKey])

  useEffect(() => {
    apiFetch<Environment[]>(`/projects/${projectId}/environments`).then(envs => {
      setEnvironments(envs)
      if (envs.length > 0) setEnvId(envs[0].id)
    })
  }, [projectId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiFetch<SdkKeyCreated>('/sdk/keys', {
        method: 'POST',
        body: JSON.stringify({ projectId, environmentId: envId, name }),
      })
      setCreatedKey(result.key)
      storeSdkKey(projectId, result.environment_id, result.key)
      const env = environments.find(e => e.id === envId)
      onCreated({
        id: result.id,
        project_id: result.project_id,
        environment_id: result.environment_id,
        environment_name: env?.name ?? '',
        revoked: result.revoked,
        created_at: result.created_at,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate key')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!createdKey) return
    await navigator.clipboard.writeText(createdKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-key-title"
        className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 p-6"
      >
        <h2 id="generate-key-title" className="text-base font-semibold text-text-primary mb-5">
          Generate SDK Key
        </h2>

        {!createdKey ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="sdk-env" className="block text-xs text-text-muted mb-1">Environment</label>
              <select
                id="sdk-env"
                value={envId}
                onChange={e => setEnvId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {environments.map(env => (
                  <option key={env.id} value={env.id}>{env.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sdk-key-name" className="block text-xs text-text-muted mb-1">Key Name</label>
              <input
                id="sdk-key-name"
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. production-dashboard"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !envId}
                className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
              <p className="text-xs text-amber-400 font-medium">
                Copy this key now — you won't be able to see it again.
              </p>
            </div>
            <div>
              <label htmlFor="sdk-key-value" className="block text-xs text-text-muted mb-1">SDK Key</label>
              <div className="flex gap-2">
                <input
                  id="sdk-key-value"
                  type="text"
                  readOnly
                  value={createdKey}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="bg-surface border border-border hover:border-accent text-sm text-text-muted hover:text-text-primary px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={onClose}
                className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
