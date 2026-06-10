'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp, BarChart2, Zap
} from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { useDataset } from '@/hooks/useDataset'
import posthog from 'posthog-js'

// ── Types ─────────────────────────────────────────────────────────────────────

interface InsightMetrics {
  value: number
  average: number
  delta: string
}

interface Insight {
  number: number
  title: string
  finding: string
  action: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  // Sprint 1B additions
  confidence?: 'High' | 'Medium' | 'Low'
  basedOn?: string
  evidence?: string[]
  metrics?: InsightMetrics
}

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'CRITICAL' },
  HIGH:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'HIGH' },
  MEDIUM:   { color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  label: 'MEDIUM' },
  LOW:      { color: '#71717A', bg: 'rgba(113,113,122,0.1)', label: 'LOW' },
}

const CONFIDENCE_CONFIG: Record<string, { color: string; bg: string }> = {
  High:   { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  Low:    { color: '#71717A', bg: 'rgba(113,113,122,0.1)' },
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SmartInsightsPage() {
  const { activeDatasetId } = useDashboardStore()
  const { dataset: activeDataset, isLoading: datasetLoading } = useDataset(activeDatasetId)
  
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const rows = useMemo(() => activeDataset?.rows ?? [], [activeDataset])
  const headers = useMemo(() => activeDataset?.headers ?? [], [activeDataset])

  const toggleExpand = (num: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(num) ? next.delete(num) : next.add(num)
      return next
    })
  }

  const generateInsights = async () => {
    if (rows.length === 0) return
    setLoading(true)
    setError(null)
    setExpandedIds(new Set())

    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetName: activeDataset?.name ?? 'Dataset',
          headers,
          sampleRows: rows.slice(0, 50),
          totalRows: rows.length,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? 'Failed to generate insights')
      }

      const data = await res.json()
      setInsights(data.insights)
      setGenerated(true)
    } catch (e: any) {
      setError(e.message ?? 'Could not generate insights. Please try again.')
    } finally {
      setLoading(false)
      setCooldown(true)
      setTimeout(() => setCooldown(false), 1000)
    }
  }

  // ── Empty / No dataset ─────────────────────────────────────────────────────

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        {datasetLoading ? (
          <RefreshCw size={48} className="text-text-muted mb-4 opacity-40 animate-spin" />
        ) : (
          <Sparkles size={48} className="text-text-muted mb-4 opacity-40" />
        )}
        <p className="text-text font-semibold mb-2">{datasetLoading ? 'Loading dataset...' : 'No dataset selected'}</p>
        {!datasetLoading && <p className="text-text-muted text-sm">Import a dataset to generate AI insights</p>}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text flex items-center gap-2">
            <Sparkles size={20} className="text-accent" />
            AI Insights
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Powered by Groq · Analysing{' '}
            <span className="text-accent">{activeDataset.name}</span> · {rows.length} rows ·{' '}
            {headers.length} columns
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={generateInsights}
          disabled={loading || datasetLoading || cooldown}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Analysing…
            </>
          ) : (
            <>
              <Sparkles size={14} /> {generated ? 'Regenerate' : 'Generate Insights'}
            </>
          )}
        </motion.button>
      </div>

      {/* Dataset summary card */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
          Dataset Summary
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-text-muted">Total Rows</p>
            <p className="text-lg font-semibold text-text">{rows.length.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Columns</p>
            <p className="text-lg font-semibold text-text">{headers.length}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Dataset</p>
            <p className="text-sm font-medium text-accent truncate">{activeDataset.name}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Fields</p>
            <p className="text-xs text-text-muted truncate">
              {headers.slice(0, 4).join(', ')}
              {headers.length > 4 ? '…' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-bg-hover rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-bg-hover rounded w-1/3" />
                  <div className="h-3 bg-bg-hover rounded w-3/4" />
                  <div className="h-3 bg-bg-hover rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insight cards */}
      <AnimatePresence>
        {!loading && insights.length > 0 && (
          <motion.div className="space-y-3">
            {insights.map((insight, i) => {
              const p = PRIORITY_CONFIG[insight.priority] ?? PRIORITY_CONFIG.MEDIUM
              const c = CONFIDENCE_CONFIG[insight.confidence ?? 'Medium'] ?? CONFIDENCE_CONFIG.Medium
              const isExpanded = expandedIds.has(insight.number)
              const hasEvidence =
                (insight.evidence && insight.evidence.length > 0) ||
                (insight.metrics && insight.metrics.delta !== 'N/A')

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-bg-card border border-border rounded-xl p-5 relative overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="flex items-start gap-4">
                    {/* Number badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-serif text-lg font-bold"
                      style={{ background: p.bg, color: p.color }}
                    >
                      #{insight.number}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-text">{insight.title}</h3>

                        {/* Priority badge */}
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0"
                          style={{ background: p.bg, color: p.color }}
                        >
                          {insight.priority}
                        </span>

                        {/* Confidence badge — Sprint 1B */}
                        {insight.confidence && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono flex-shrink-0"
                            style={{ background: c.bg, color: c.color }}
                          >
                            {insight.confidence} confidence
                          </span>
                        )}
                      </div>

                      {/* Finding */}
                      <p className="text-sm text-text-muted mb-3">{insight.finding}</p>

                      {/* Action box */}
                      {insight.action && (
                        <div
                          className="flex items-start gap-2 p-3 rounded-lg mb-3"
                          style={{ background: p.bg }}
                        >
                          <Zap size={12} style={{ color: p.color }} className="flex-shrink-0 mt-0.5" />
                          <p className="text-xs font-medium" style={{ color: p.color }}>
                            <span className="font-bold">Action:</span> {insight.action}
                          </p>
                        </div>
                      )}

                      {/* Why? toggle — Sprint 1B & 2 */}
                      {hasEvidence && (
                        <button
                          onClick={() => {
                            toggleExpand(insight.number);
                            posthog.capture('why_button_clicked', { insight_number: insight.number });
                            if (!isExpanded) {
                              posthog.capture('evidence_expanded', { insight_number: insight.number });
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {isExpanded ? 'Hide evidence' : 'Why?'}
                        </button>
                      )}

                      {/* Evidence panel — inline, no modal */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 p-3 rounded-lg border border-border/60 bg-bg-hover/30 space-y-3">
                              {/* Evidence list */}
                              {insight.evidence && insight.evidence.length > 0 ? (
                                <div>
                                  <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
                                    Evidence
                                  </p>
                                  <ul className="space-y-1">
                                    {insight.evidence.map((ev, ei) => (
                                      <li key={ei} className="flex items-start gap-2 text-xs text-text-muted">
                                        <span className="text-accent mt-0.5 flex-shrink-0">·</span>
                                        {ev}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-xs text-text-muted">
                                  Insufficient evidence available for this insight.
                                </p>
                              )}

                              {/* Explanation of confidence */}
                              {insight.basedOn && (
                                <div className="border-t border-border/40 pt-3">
                                  <p className="text-xs text-text-muted leading-relaxed">
                                    <span className="font-semibold text-text">Confidence:</span> {insight.confidence}. <span className="font-semibold text-text">Based on:</span> {insight.basedOn}
                                  </p>
                                </div>
                              )}

                              {/* Metrics block */}
                              {insight.metrics && insight.metrics.delta !== 'N/A' && (
                                <div className="border-t border-border/40 pt-3">
                                  <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                                    <BarChart2 size={10} />
                                    Supporting Metrics
                                  </p>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <p className="text-[10px] text-text-muted">Value</p>
                                      <p className="text-xs font-semibold text-text">
                                        {insight.metrics.value.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-text-muted">Average</p>
                                      <p className="text-xs font-semibold text-text">
                                        {insight.metrics.average.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-text-muted">Delta</p>
                                      <p className="text-xs font-semibold text-accent">
                                        {insight.metrics.delta}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty — not yet generated */}
      {!loading && !generated && insights.length === 0 && (
        <div className="bg-bg-card border border-border border-dashed rounded-xl p-12 text-center">
          <Sparkles size={40} className="text-text-muted mx-auto mb-4 opacity-40" />
          <p className="text-text font-semibold mb-2">Ready to analyse</p>
          <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
            Click &quot;Generate Insights&quot; and the AI will analyse your data and produce
            numbered, prioritised findings with confidence levels and supporting evidence.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={generateInsights}
            className="bg-accent hover:bg-accent-hover text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors inline-flex items-center gap-2"
          >
            <Sparkles size={14} /> Generate Insights
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
