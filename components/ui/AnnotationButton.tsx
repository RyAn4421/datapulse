'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Save, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'

interface AnnotationButtonProps {
  chartKey: string   // unique key for this chart, e.g. "distribution-bar"
}

export default function AnnotationButton({ chartKey }: AnnotationButtonProps) {
  const { activeDatasetId } = useStore()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)

  // Load existing annotation
  useEffect(() => {
    if (!activeDatasetId) return
    fetch(`/api/annotations?datasetId=${activeDatasetId}`)
      .then(r => r.json())
      .then(data => {
        const existing = data.annotations?.find((a: any) => a.chartKey === chartKey)
        if (existing) {
          setNote(existing.note)
          setSaved(existing.note)
        }
      })
      .catch(() => {})
  }, [activeDatasetId, chartKey])

  const handleSave = async () => {
    if (!activeDatasetId) return
    setSaving(true)
    try {
      await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: activeDatasetId, chartKey, note }),
      })
      setSaved(note)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeDatasetId) return
    await fetch(`/api/annotations?datasetId=${activeDatasetId}&chartKey=${chartKey}`, { method: 'DELETE' })
    setNote('')
    setSaved('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors
          ${saved ? 'text-accent bg-accent-subtle' : 'text-text-muted hover:text-text hover:bg-bg-hover'}`}
        title={saved ? 'View/edit annotation' : 'Add annotation'}
      >
        <MessageSquare size={11} />
        {saved ? 'Note' : 'Add note'}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-72 bg-bg-card border border-border rounded-xl p-4 z-50 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-text">Chart Annotation</p>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text">
                <X size={12} />
              </button>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add your analysis or note here…"
              rows={4}
              className="w-full bg-bg-hover border border-border rounded-lg px-3 py-2 text-xs text-text placeholder-text-muted resize-none focus:outline-none focus:border-accent transition-colors"
            />
            <div className="flex gap-2 mt-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving || !note.trim()}
                className="flex items-center gap-1 bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 flex-1">
                <Save size={10} /> {saving ? 'Saving…' : 'Save'}
              </motion.button>
              {saved && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleDelete}
                  className="flex items-center gap-1 border border-danger/30 text-danger hover:bg-danger/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  <Trash2 size={10} /> Delete
                </motion.button>
              )}
            </div>
            {saved && note === saved && (
              <p className="text-xs text-text-muted mt-2 italic">{'"'}{saved.slice(0,60)}{saved.length > 60 ? '…' : ''}{'"'}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
