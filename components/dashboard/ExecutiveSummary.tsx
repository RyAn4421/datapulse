'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExecutiveSummaryData {
  overview: string
  topCategory: string
  risk: string
  recommendation: string
}

export interface ExecutiveSummaryProps {
  /** Active dataset MongoDB _id */
  datasetId: string | null
  /** Used to enforce the 20-row minimum before calling the API */
  rowCount: number
  /** Optional extra class for the outer container */
  className?: string
  /**
   * When true, hides the "Regenerate" button.
   * Use this for Reports and Shared Report View where the user
   * should not trigger a new generation.
   */
  readonly?: boolean
}

// ── Config ───────────────────────────────────────────────────────────────────

const SECTIONS: {
  key: keyof ExecutiveSummaryData
  label: string
  color: string
}[] = [
  { key: 'overview',       label: 'Overview',       color: '#6366F1' },
  { key: 'topCategory',    label: 'Key Finding',    color: '#10B981' },
  { key: 'risk',           label: 'Risk',           color: '#F59E0B' },
  { key: 'recommendation', label: 'Recommendation', color: '#22D3EE' },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ── Main Component ────────────────────────────────────────────────────────────

export default function ExecutiveSummary({
  datasetId,
  rowCount,
  className = '',
  readonly = false,
}: ExecutiveSummaryProps) {
  const [regenerating, setRegenerating] = useState(false)
  // forceGen bumps the SWR key to bypass client-side cache on regenerate
  const [forceGen, setForceGen] = useState(0)

  const swrKey =
    datasetId
      ? `/api/ai-insights/summary?datasetId=${datasetId}&_v=${forceGen}`
      : null

  const { data, error, isLoading, mutate } = useSWR<{
    summary?: ExecutiveSummaryData
    cached?: boolean
    stale?: boolean
    error?: string
    message?: string
  }>(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  // ── Guards ───────────────────────────────────────────────────────────────────

  if (!datasetId) return null

  // Below minimum — show informational message, not an error
  if (rowCount > 0 && rowCount < 20) {
    return (
      <div className={`bg-bg-card border border-border rounded-xl p-5 ${className}`}>
        <Header />
        <p className="text-sm text-text-muted mt-3 leading-relaxed">
          Dataset too small for meaningful analysis. Minimum 20 records recommended.
        </p>
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) return <Skeleton className={className} />

  // ── Error / failure states ───────────────────────────────────────────────────

  const apiError = data?.error
  if (error || (apiError && apiError !== 'too_small')) {
    const isTimeout = apiError === 'timeout'

    const handleRetry = async () => {
      setRegenerating(true)
      try {
        await fetch(`/api/ai-insights/summary?datasetId=${datasetId}&force=true`)
        setForceGen((n) => n + 1)
      } finally {
        setRegenerating(false)
      }
    }

    return (
      <div className={`bg-bg-card border border-border rounded-xl p-5 ${className}`}>
        <Header />
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-text-muted flex-1">
            {isTimeout
              ? 'Summary taking longer than expected.'
              : 'Unable to generate summary.'}
          </p>
          {!readonly && (
            <button
              onClick={handleRetry}
              disabled={regenerating}
              className="text-xs text-accent hover:underline disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
            >
              {regenerating && <RefreshCw size={11} className="animate-spin" />}
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  const summary = data?.summary
  if (!summary) return <Skeleton className={className} />

  // ── Regenerate handler ───────────────────────────────────────────────────────

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch(
        `/api/ai-insights/summary?datasetId=${datasetId}&force=true`
      )
      const json = await res.json()
      // Optimistically update SWR cache without a refetch
      await mutate(json, { revalidate: false })
    } finally {
      setRegenerating(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-bg-card border border-border rounded-xl p-5 ${className}`}
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <Header cached={data?.cached} stale={data?.stale} />

        {!readonly && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors disabled:opacity-50 flex-shrink-0"
            title="Force regenerate AI summary"
          >
            <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
            Regenerate
          </button>
        )}
      </div>

      {/* 2×2 section grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence mode="wait">
          {SECTIONS.map(({ key, label, color }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.18 }}
              className="p-3 rounded-lg border border-border/60 bg-bg-hover/30"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <p
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color }}
                >
                  {label}
                </p>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {summary[key]}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Header({
  cached,
  stale,
}: {
  cached?: boolean
  stale?: boolean
} = {}) {
  return (
    <div className="flex items-center gap-2">
      <FileText size={15} className="text-accent flex-shrink-0" />
      <h3 className="text-sm font-semibold text-text">Executive Summary</h3>

      {/* Badge: fresh AI call */}
      {cached === false && !stale && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono">
          AI
        </span>
      )}

      {/* Badge: served from cache */}
      {cached === true && !stale && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono flex items-center gap-1">
          <CheckCircle2 size={9} />
          cached
        </span>
      )}

      {/* Badge: stale cache served after timeout */}
      {stale && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono">
          stale
        </span>
      )}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-card border border-border rounded-xl p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FileText size={15} className="text-accent" />
        <div className="h-3.5 bg-bg-hover rounded w-32 animate-pulse" />
      </div>
      <p className="text-xs text-text-muted mb-4 animate-pulse">Generating insights…</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-lg border border-border/60 bg-bg-hover/30 space-y-2 animate-pulse"
          >
            <div className="h-2 bg-bg-hover rounded w-1/3" />
            <div className="h-3 bg-bg-hover rounded w-full" />
            <div className="h-3 bg-bg-hover rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
