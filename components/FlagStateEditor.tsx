'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { FlagState, Rule } from '@/types'

type Props = {
  projectId: string
  flagId: string
  state: FlagState
  onChange: (updated: FlagState) => void
}

const OPERATORS: Rule['operator'][] = ['equals', 'not_equals', 'contains', 'gt', 'lt']

export default function FlagStateEditor({ projectId, flagId, state, onChange }: Props) {
  const [localRollout, setLocalRollout] = useState(state.rollout_percentage)
  const [localRules, setLocalRules] = useState<Rule[]>(state.rules)
  const [saving, setSaving] = useState<'toggle' | 'rollout' | 'rules' | null>(null)

  const rolloutDirty = localRollout !== state.rollout_percentage
  const rulesDirty = JSON.stringify(localRules) !== JSON.stringify(state.rules)

  async function put(patch: Partial<{ enabled: boolean; rollout_percentage: number; rules: Rule[] }>) {
    const body = {
      enabled: state.enabled,
      rollout_percentage: state.rollout_percentage,
      rules: state.rules,
      ...patch,
    }
    const raw = await apiFetch<FlagState>(
      `/projects/${projectId}/flags/${flagId}/environments/${state.environment_id}`,
      { method: 'PUT', body: JSON.stringify(body) }
    )
    // PUT returns a DB row without environment_name — preserve it from current state
    onChange({ ...raw, environment_name: state.environment_name })
  }

  async function handleToggle() {
    setSaving('toggle')
    try {
      await put({ enabled: !state.enabled })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update flag')
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveRollout() {
    setSaving('rollout')
    try {
      await put({ rollout_percentage: localRollout })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save rollout')
      setLocalRollout(state.rollout_percentage)
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveRules() {
    setSaving('rules')
    try {
      await put({ rules: localRules })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save rules')
      setLocalRules(state.rules)
    } finally {
      setSaving(null)
    }
  }

  function addRule() {
    setLocalRules(prev => [...prev, { attribute: '', operator: 'equals', value: '' }])
  }

  function removeRule(i: number) {
    setLocalRules(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateRule(i: number, field: keyof Rule, value: string) {
    setLocalRules(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      {/* Header: environment name + toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">{state.environment_name}</h2>
        <button
          onClick={handleToggle}
          disabled={saving === 'toggle'}
          role="switch"
          aria-checked={state.enabled}
          aria-label={`Toggle ${state.environment_name}`}
          className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${state.enabled ? 'bg-accent' : 'bg-border'}`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${state.enabled ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {state.enabled && (
        <div className="mt-5 space-y-6 border-t border-border pt-5">

          {/* Rollout percentage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Rollout</p>
              <span className="text-sm font-medium text-text-primary tabular-nums">{localRollout}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={localRollout}
              onChange={e => setLocalRollout(Number(e.target.value))}
              className="w-full accent-accent"
            />
            {rolloutDirty && (
              <button
                onClick={handleSaveRollout}
                disabled={saving === 'rollout'}
                className="mt-2 text-sm text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
              >
                {saving === 'rollout' ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>

          {/* Targeting rules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Targeting Rules</p>
              <button
                onClick={addRule}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                + Add Rule
              </button>
            </div>

            {localRules.length === 0 ? (
              <p className="text-xs text-text-muted">No rules — rollout applies to all users.</p>
            ) : (
              <div className="space-y-2">
                {localRules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rule.attribute}
                      onChange={e => updateRule(i, 'attribute', e.target.value)}
                      placeholder="attribute"
                      className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <select
                      value={rule.operator}
                      onChange={e => updateRule(i, 'operator', e.target.value)}
                      className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent shrink-0"
                    >
                      {OPERATORS.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={String(rule.value)}
                      onChange={e => updateRule(i, 'value', e.target.value)}
                      placeholder="value"
                      className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button
                      onClick={() => removeRule(i)}
                      className="text-text-muted hover:text-danger transition-colors text-xs shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {rulesDirty && (
              <button
                onClick={handleSaveRules}
                disabled={saving === 'rules'}
                className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
              >
                {saving === 'rules' ? 'Saving…' : 'Save Rules'}
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
