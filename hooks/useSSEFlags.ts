'use client'

import { useEffect, useRef } from 'react'
import type { Rule } from '@/types'

export type SSEFlagUpdate = {
  flagKey: string
  enabled: boolean
  rollout_percentage: number
  rules: Rule[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const MAX_BACKOFF_MS = 30000

export function useSSEFlags(
  connections: Array<{ environmentId: string; sdkKey: string }>,
  onFlagUpdated: (environmentId: string, update: SSEFlagUpdate) => void
) {
  const callbackRef = useRef(onFlagUpdated)
  useEffect(() => { callbackRef.current = onFlagUpdated })

  const connectionsKey = connections.map(c => `${c.environmentId}:${c.sdkKey}`).join(',')

  useEffect(() => {
    if (connections.length === 0) return

    const abortControllers: AbortController[] = []
    const timeoutIds: ReturnType<typeof setTimeout>[] = []

    for (const { environmentId, sdkKey } of connections) {
      let delay = 1000
      const ac = new AbortController()
      abortControllers.push(ac)

      async function connect() {
        if (ac.signal.aborted) return
        try {
          const res = await fetch(`${API_URL}/sdk/stream`, {
            headers: { 'x-sdk-key': sdkKey },
            signal: ac.signal,
          })
          if (!res.ok || !res.body) return

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            let boundary: number
            while ((boundary = buffer.indexOf('\n\n')) !== -1) {
              const block = buffer.slice(0, boundary)
              buffer = buffer.slice(boundary + 2)

              let eventName = ''
              let dataLine = ''
              for (const line of block.split('\n')) {
                if (line.startsWith('event:')) eventName = line.slice(6).trim()
                else if (line.startsWith('data:')) dataLine = line.slice(5).trim()
              }

              if (eventName === 'flag_updated' && dataLine) {
                try {
                  const update: SSEFlagUpdate = JSON.parse(dataLine)
                  callbackRef.current(environmentId, update)
                } catch {}
              }
            }
          }
          delay = 1000
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return
        }

        if (!ac.signal.aborted) {
          const tid = setTimeout(connect, delay)
          timeoutIds.push(tid)
          delay = Math.min(delay * 2, MAX_BACKOFF_MS)
        }
      }

      connect()
    }

    return () => {
      abortControllers.forEach(ac => ac.abort())
      timeoutIds.forEach(clearTimeout)
    }
  }, [connectionsKey]) // eslint-disable-line react-hooks/exhaustive-deps
}
