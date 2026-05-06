'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { Flag } from '@/types'

type Props = {
  projectId: string
  onClose: () => void
  onCreated: (flag: Flag) => void
}

function toSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
}

export default function CreateFlagModal({ projectId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const [key, setKey] = useState('')
  const [keyTouched, setKeyTouched] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    if (!keyTouched) setKey(toSlug(value))
  }

  function handleKeyChange(value: string) {
    setKey(toSlug(value))
    setKeyTouched(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const flag = await apiFetch<Flag>(`/projects/${projectId}/flags`, {
        method: 'POST',
        body: JSON.stringify({ key, name }),
      })
      onCreated(flag)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create flag'
      setError(msg.includes('409') ? 'A flag with this key already exists.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-flag-title"
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm shadow-xl"
      >
        <h2 id="create-flag-title" className="text-base font-semibold text-text-primary mb-4">New Flag</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="flag-name" className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
            <input
              id="flag-name"
              autoFocus
              type="text"
              required
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="My Feature Flag"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="flag-key" className="block text-sm font-medium text-text-primary mb-1.5">Key</label>
            <input
              id="flag-key"
              type="text"
              required
              value={key}
              onChange={e => handleKeyChange(e.target.value)}
              placeholder="my-feature-flag"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border text-text-muted hover:text-text-primary text-sm py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
