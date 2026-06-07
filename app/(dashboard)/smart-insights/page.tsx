'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, AlertTriangle, TrendingUp, Info, Zap, RefreshCw } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'

// Priority config
const PRIORITY: Record<string, { color: string, bg: string, label: string }> = {
  CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'CRITICAL' },
  HIGH:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'HIGH' },
  MEDIUM:   { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', label: 'MEDIUM' },
  LOW:      { color: '#71717A', bg: 'rgba(113,113,122,0.1)', label: 'LOW' },
}

interface Insight {
  number: number
  title: string
  finding: string
  action: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export default function SmartInsightsPage() {
  const { activeDataset } = useDashboardStore()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  const rows = useMemo(() => activeDataset?.rows ?? [], [activeDataset])
  const headers = useMemo(() => activeDataset?.headers ?? [], [activeDataset])

  const generateInsights = async () => {
    if (rows.length === 0) return
    setLoading(true)
    setError(null)

    try {
      // Send sample data to our API route which calls Claude
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetName: activeDataset?.name ?? 'Dataset',
          headers,
          sampleRows: rows.slice(0, 50), // send first 50 rows as sample
          totalRows: rows.length,
        }),
      })

      if (!res.ok) throw new Error('Failed to generate insights')
      const data = await res.json()
      setInsights(data.insights)
      setGenerated(true)
    } catch (e) {
      setError('Could not generate insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Sparkles size={48} className="text-text-muted mb-4 opacity-40" />
        <p className="text-text font-semibold mb-2">No dataset selected</p>
        <p className="text-text-muted text-sm">Import a dataset to generate AI insights</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }} className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text flex items-center gap-2">
            <Sparkles size={20} className="text-accent" />
            AI Insights
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Powered by Claude · Analysing <span className="text-accent">{activeDataset.name}</span> · {rows.length} rows · {headers.length} columns
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          {loading
            ? <><RefreshCw size={14} className="animate-spin" /> Analysing…</>
            : <><Sparkles size={14} /> {generated ? 'Regenerate' : 'Generate Insights'}</>
          }
        </motion.button>
      </div>

      {/* Dataset summary card */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Dataset Summary</p>
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
            <p className="text-xs text-text-muted">Columns</p>
            <p className="text-xs text-text-muted truncate">{headers.slice(0,4).join(', ')}{headers.length > 4 ? '…' : ''}</p>
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

      {/* Loading state */}
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

      {/* Insights list */}
      <AnimatePresence>
        {!loading && insights.length > 0 && (
          <motion.div className="space-y-3">
            {insights.map((insight, i) => {
              const p = PRIORITY[insight.priority] ?? PRIORITY.MEDIUM
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-serif text-lg font-bold"
                      style={{ background: p.bg, color: p.color }}>
                      #{insight.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-text">{insight.title}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0"
                          style={{ background: p.bg, color: p.color }}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted mb-3">{insight.finding}</p>
                      {insight.action && (
                        <div className="flex items-start gap-2 p-3 rounded-lg"
                          style={{ background: p.bg }}>
                          <Zap size={12} style={{ color: p.color }} className="flex-shrink-0 mt-0.5" />
                          <p className="text-xs font-medium" style={{ color: p.color }}>
                            <span className="font-bold">Action:</span> {insight.action}
                          </p>
                        </div>
                      )}
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
            Click &quot;Generate Insights&quot; and Claude will analyse your data and produce numbered, prioritised findings with action steps.
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
