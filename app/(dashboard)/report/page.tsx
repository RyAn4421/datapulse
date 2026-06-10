'use client'
import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Printer, Share2, X, CheckCircle2, AlertTriangle, Presentation } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { prepareChartData } from '@/lib/utils'

function getNumericCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0,20).some(r => !isNaN(Number(r[h])) && r[h] !== '' && r[h] !== null))
}
function getCatCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0,20).some(r => isNaN(Number(r[h])) && r[h] !== '' && r[h] !== null))
}

const COLORS = ['#6366F1','#22D3EE','#10B981','#F59E0B','#EF4444','#8B5CF6']
const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ReportPage() {
  const { activeDatasetId, activeDataset } = useDashboardStore()
  const reportRef = useRef<HTMLDivElement>(null)
  
  const [exporting, setExporting] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  const { data: aiData, isLoading: aiLoading } = useSWR(
    activeDatasetId ? `/api/ai-insights/summary?datasetId=${activeDatasetId}` : null, 
    fetcher
  )

  const rows = useMemo(() => activeDataset?.rows ?? [], [activeDataset])
  const headers = useMemo(() => activeDataset?.headers ?? [], [activeDataset])
  const numCols = useMemo(() => getNumericCols(rows, headers), [rows, headers])
  const catCols = useMemo(() => getCatCols(rows, headers), [rows, headers])

  const cat0 = catCols[0] ?? headers[0] ?? ''
  const num0 = numCols[0] ?? headers[1] ?? ''

  const chartData = useMemo(() => {
    if (!cat0 || !num0 || rows.length === 0) return []
    return prepareChartData(rows, headers, cat0, num0, 'sum').slice(0, 8)
  }, [rows, headers, cat0, num0])

  const totalValue = chartData.reduce((a, b) => a + b.value, 0)
  const avgValue = totalValue / (chartData.length || 1)
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // ── Exports ────────────────────────────────────────────────────────────────

  const handlePrint = () => window.print()

  const handleExportPDF = async () => {
    // We export to PNG for "PDF" requirement via browser print, but we also allow PNG download.
    if (!reportRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#ffffff', scale: 2 })
      const link = document.createElement('a')
      link.download = `${activeDataset?.name ?? 'report'}-report.png`
      link.href = canvas.toDataURL()
      link.click()
    } finally {
      setExporting(false)
    }
  }

  const handleExportPPTX = async () => {
    if (!reportRef.current || !aiData?.summary) return
    setExporting(true)
    try {
      const PptxGenJS = (await import('pptxgenjs')).default
      const html2canvas = (await import('html2canvas')).default
      const pres = new PptxGenJS()
      pres.layout = 'LAYOUT_16x9'
      pres.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: "FFFFFF" },
        objects: [
          { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: "6366F1" } } },
          { text: { text: "DataPulse Analytics", options: { x: 0.5, y: 0.1, w: 3, h: 0.3, color: "FFFFFF", fontSize: 10 } } }
        ]
      })

      const addTextSlide = (title: string, body: string) => {
        const slide = pres.addSlide({ masterName: "MASTER_SLIDE" })
        slide.addText(title, { x: 0.5, y: 0.8, w: '90%', h: 1, fontSize: 32, bold: true, color: '111827' })
        slide.addText(body, { x: 0.5, y: 2.0, w: '90%', h: 4, fontSize: 18, color: '374151', align: 'left', valign: 'top' })
      }

      // Title Slide
      const slide1 = pres.addSlide({ masterName: "MASTER_SLIDE" })
      slide1.addText("Executive Report", { x: 0.5, y: 1.5, w: '90%', h: 1, fontSize: 44, bold: true, color: '111827' })
      slide1.addText(activeDataset?.name ?? '', { x: 0.5, y: 2.5, w: '90%', h: 1, fontSize: 24, color: '6366F1' })
      slide1.addText(`Generated on ${today}`, { x: 0.5, y: 3.5, w: '90%', h: 1, fontSize: 14, color: '9CA3AF' })

      // Text Slides
      const sum = aiData.summary
      addTextSlide("1. Executive Summary", sum.overview || 'N/A')
      addTextSlide("2. Key Findings", sum.topCategory || 'N/A')
      addTextSlide("3. Risks", sum.risk || 'N/A')
      addTextSlide("4. Opportunities", sum.opportunities || 'N/A')
      addTextSlide("5. Recommendations", sum.recommendation || 'N/A')

      // Charts Slide (capture via html2canvas)
      const chartContainers = document.querySelectorAll('.recharts-responsive-container')
      if (chartContainers.length >= 2) {
        const chart1Canvas = await html2canvas(chartContainers[0] as HTMLElement, { scale: 2, backgroundColor: '#ffffff' })
        const chart2Canvas = await html2canvas(chartContainers[1] as HTMLElement, { scale: 2, backgroundColor: '#ffffff' })
        
        const chartSlide = pres.addSlide({ masterName: "MASTER_SLIDE" })
        chartSlide.addText("6. Visualizations & Charts", { x: 0.5, y: 0.8, w: '90%', h: 1, fontSize: 32, bold: true, color: '111827' })
        chartSlide.addImage({ data: chart1Canvas.toDataURL(), x: 0.5, y: 2.0, w: 4.2, h: 2.5 })
        chartSlide.addImage({ data: chart2Canvas.toDataURL(), x: 5.0, y: 2.0, w: 4.2, h: 2.5 })
      }

      await pres.writeFile({ fileName: `${activeDataset?.name ?? 'report'}.pptx` })
    } catch (err) {
      console.error('PPTX Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  // ── Share Link ─────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!aiData?.summary) return
    setShareLoading(true)
    setShareError(null)
    
    try {
      const payload = {
        datasetId: activeDatasetId,
        executiveSummary: aiData.summary,
        metrics: {
          rowCount: rows.length,
          colCount: headers.length,
          totalValue,
          avgValue,
          numColName: num0,
          catColName: cat0
        },
        charts: chartData
      }

      const res = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate link')
      
      const fullUrl = `${window.location.origin}${data.url}`
      setShareUrl(fullUrl)
    } catch (err: any) {
      setShareError(err.message)
    } finally {
      setShareLoading(false)
    }
  }

  const copyLink = () => {
    if (shareUrl) navigator.clipboard.writeText(shareUrl)
  }

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <FileText size={48} className="text-text-muted mb-4 opacity-40" />
        <p className="text-text font-semibold mb-2">No dataset selected</p>
      </div>
    )
  }

  return (
    <div className="p-5">
      {/* Action bar — hidden on print */}
      <div className="flex items-center justify-between mb-5 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-text">Executive Report</h1>
          <p className="text-text-muted text-sm mt-0.5">Generate, share, and export</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleShare} disabled={shareLoading || aiLoading || !aiData?.summary}
            className="flex items-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
            <Share2 size={14} /> {shareLoading ? 'Generating…' : 'Share Link'}
          </motion.button>
          
          <div className="h-6 w-px bg-border mx-1" />

          <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrint}
            className="flex items-center gap-2 border border-border text-text-muted hover:text-text hover:bg-bg-hover px-4 py-2 rounded-lg text-sm transition-colors">
            <Printer size={14} /> Print
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleExportPDF} disabled={exporting}
            className="flex items-center gap-2 border border-border text-text-muted hover:text-text hover:bg-bg-hover px-4 py-2 rounded-lg text-sm transition-colors">
            <Download size={14} /> PNG
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleExportPPTX} disabled={exporting || aiLoading || !aiData?.summary}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
            <Presentation size={14} /> {exporting ? 'Exporting…' : 'Export PPTX'}
          </motion.button>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {shareUrl && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start justify-between">
            <div className="flex gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Share link generated successfully</h3>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mb-3 mt-1 max-w-lg">
                  This link provides read-only access to a static snapshot of this report. It does not grant access to the raw dataset.
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white dark:bg-black/20 px-3 py-1.5 rounded border border-emerald-500/20 select-all font-mono">
                    {shareUrl}
                  </code>
                  <button onClick={copyLink} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-white dark:bg-black/20 px-3 py-1.5 rounded border border-emerald-500/20 transition-colors">
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => setShareUrl(null)} className="text-emerald-700/50 hover:text-emerald-700">
              <X size={16} />
            </button>
          </motion.div>
        )}
        {shareError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{shareError}</p>
            <button onClick={() => setShareError(null)} className="ml-auto text-danger/50 hover:text-danger"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report body */}
      <div ref={reportRef} className="bg-white text-gray-900 rounded-xl border border-gray-200 overflow-hidden print:border-0 print:rounded-none">
        
        {/* Cover header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 md:p-12 text-white">
          <p className="text-indigo-200 text-xs font-mono uppercase tracking-widest mb-3">Executive Report</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">{activeDataset.name}</h2>
          <p className="text-indigo-200 text-sm">Generated {today}</p>
          <div className="flex flex-wrap gap-8 mt-10">
            <div>
              <p className="text-indigo-200 text-xs uppercase font-mono tracking-wider mb-1">Total Records</p>
              <p className="text-2xl font-bold">{rows.length.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs uppercase font-mono tracking-wider mb-1">Columns</p>
              <p className="text-2xl font-bold">{headers.length}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs uppercase font-mono tracking-wider mb-1">Total {num0}</p>
              <p className="text-2xl font-bold">{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs uppercase font-mono tracking-wider mb-1">Average {num0}</p>
              <p className="text-2xl font-bold">{avgValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
            </div>
          </div>
        </div>

        {/* Narrative Sections */}
        <div className="p-8 md:p-12 space-y-8 border-b border-gray-100">
          {aiLoading ? (
            <div className="animate-pulse space-y-8">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="h-6 bg-gray-200 rounded w-48 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : !aiData?.summary ? (
             <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
               <FileText size={32} className="mx-auto text-gray-400 mb-3" />
               <p className="text-gray-600 font-semibold">AI Summary Not Available</p>
               <p className="text-sm text-gray-500 mt-1">Please ensure the dataset has enough rows to generate insights.</p>
             </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                  Executive Summary
                </h2>
                <p className="text-gray-700 leading-relaxed ml-8">{aiData.summary.overview}</p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                  Key Findings
                </h2>
                <p className="text-gray-700 leading-relaxed ml-8">{aiData.summary.topCategory}</p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
                  Risks
                </h2>
                <p className="text-gray-700 leading-relaxed ml-8">{aiData.summary.risk}</p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">4</span>
                  Opportunities
                </h2>
                <p className="text-gray-700 leading-relaxed ml-8">{aiData.summary.opportunities}</p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">5</span>
                  Recommendations
                </h2>
                <p className="text-gray-700 leading-relaxed ml-8">{aiData.summary.recommendation}</p>
              </div>
            </>
          )}
        </div>

        {/* Charts section */}
        <div className="p-8 md:p-12 bg-gray-50">
          <h2 className="text-lg font-bold text-indigo-900 mb-6 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">6</span>
            Visualizations & Charts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-8">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-6 text-center">{num0} by {cat0}</h3>
              <ResponsiveContainer width="100%" height={260} className="recharts-responsive-container">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <RechartsTooltip cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="value" fill="#6366F1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-6 text-center">{cat0} Share</h3>
              <ResponsiveContainer width="100%" height={260} className="recharts-responsive-container">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white border-t border-gray-100 flex justify-between items-center print:border-t-0">
          <p className="text-xs text-gray-400">Generated by DataPulse Analytics</p>
          <p className="text-xs text-gray-400">Confidential</p>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
