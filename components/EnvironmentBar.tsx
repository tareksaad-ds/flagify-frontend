'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { Environment } from '@/types'

type Props = {
  projectId: string
  environments: Environment[]
  onChange: (envs: Environment[]) => void
}

export default function EnvironmentBar({ projectId, environments, onChange }: Props) {
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setAdding(true)
    try {
      const env = await apiFetch<Environment>(`/projects/${projectId}/environments`, {
        method: 'POST',
        body: JSON.stringify({ name: input.trim() }),
      })
      onChange([...environments, env])
      setInput('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add environment')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(envId: string, name: string) {
    if (!confirm(`Delete environment "${name}"? This will remove all flag states for this environment.`)) return
    try {
      await apiFetch(`/projects/${projectId}/environments/${envId}`, { method: 'DELETE' })
      onChange(environments.filter(e => e.id !== envId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete environment')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {environments.map(env => (
        <span
          key={env.id}
          className="group flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1 text-sm text-text-primary"
        >
          {env.name}
          <button
            onClick={() => handleDelete(env.id, env.name)}
            aria-label={`Delete ${env.name}`}
            className="text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100 text-base leading-none"
          >
            ×
          </button>
        </span>
      ))}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add environment…"
          className="bg-transparent border-b border-border focus:border-accent text-sm text-text-primary placeholder:text-text-muted focus:outline-none py-1 px-1 w-36 transition-colors"
        />
        {input.trim() && (
          <button
            type="submit"
            disabled={adding}
            className="text-accent hover:text-accent-hover text-sm transition-colors disabled:opacity-50"
          >
            Add
          </button>
        )}
      </form>
    </div>
  )
}
