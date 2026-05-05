'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import type { Project } from '@/types'
import CreateProjectModal from '@/components/CreateProjectModal'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function loadProjects() {
    try {
      const data = await apiFetch<Project[]>('/projects')
      setProjects(data)
    } catch {
      // empty state handles this
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProjects() }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' })
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Projects</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          New Project
        </button>
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-xl">
          <p className="text-text-muted text-sm">No projects yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-accent hover:text-accent-hover text-sm font-medium transition-colors"
          >
            Create your first one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div
              key={project.id}
              className="relative group bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-colors"
            >
              <Link href={`/projects/${project.id}`} className="block">
                <p className="font-medium text-text-primary">{project.name}</p>
                <p className="text-xs text-text-muted mt-1">
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </Link>
              <button
                onClick={() => handleDelete(project.id, project.name)}
                className="absolute top-4 right-4 text-xs text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={project => {
            setProjects(prev => [...prev, project])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
