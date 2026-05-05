'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { Project } from '@/types'

type Props = {
  onClose: () => void
  onCreated: (project: Project) => void
}

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const project = await apiFetch<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      onCreated(project)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create project'
      setError(msg.includes('409') ? 'A project with this name already exists.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-base font-semibold text-text-primary mb-4">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Project name</label>
            <input
              autoFocus
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="my-project"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
