'use client'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Printer } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { prepareChartData } from '@/lib/utils'
import { useMemo } from 'react'

function getNumericCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0,20).some(r => !isNaN(Number(r[h])) && r[h] !== '' && r[h] !== null))
}
function getCatCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h => rows.slice(0,20).some(r => isNaN(Number(r[h])) && r[h] !== '' && r[h] !== null))
}

const COLORS = ['#6366F1','#22D3EE','#10B981','#F59E0B','#EF4444','#8B5CF6']

export default function ReportPage() {
  const { activeDataset } = useDashboardStore()
  const reportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

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

  const handlePrint = () => window.print()

  const handleExportPDF = async () => {
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
          <p className="text-text-muted text-sm mt-0.5">Print or export as image</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrint}
            className="flex items-center gap-2 border border-border text-text-muted hover:text-text hover:bg-bg-hover px-4 py-2 rounded-lg text-sm transition-colors">
            <Printer size={14} /> Print
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleExportPDF} disabled={exporting}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
            <Download size={14} /> {exporting ? 'Exporting…' : 'Export PNG'}
          </motion.button>
        </div>
      </div>

      {/* Report body — white background for print */}
      <div ref={reportRef} className="bg-white text-gray-900 rounded-xl border border-gray-200 overflow-hidden print:border-0 print:rounded-none">

        {/* Cover header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white">
          <p className="text-indigo-200 text-xs font-mono uppercase tracking-widest mb-2">DataPulse Analytics</p>
          <h2 className="text-3xl font-bold mb-1">{activeDataset.name}</h2>
          <p className="text-indigo-200 text-sm">Executive Summary Report · Generated {today}</p>
          <div className="flex gap-6 mt-6">
            <div>
              <p className="text-indigo-200 text-xs">Total Records</p>
              <p className="text-2xl font-bold">{rows.length.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs">Columns</p>
              <p className="text-2xl font-bold">{headers.length}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs">Total {num0}</p>
              <p className="text-2xl font-bold">{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs">Average {num0}</p>
              <p className="text-2xl font-bold">{avgValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
          {chartData.slice(0,4).map((d, i) => (
            <div key={i} className="p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-mono mb-1">{d.name}</p>
              <p className="text-2xl font-bold text-gray-900">{d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          ))}
        </div>

        {/* Charts section */}
        <div className="p-6 grid grid-cols-2 gap-6">
          {/* Bar chart */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{num0} by {cat0}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366F1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{cat0} Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data table */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary Table</h3>
          <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-mono uppercase text-gray-400">{cat0}</th>
                <th className="px-4 py-2 text-right text-xs font-mono uppercase text-gray-400">{num0}</th>
                <th className="px-4 py-2 text-right text-xs font-mono uppercase text-gray-400">Share %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chartData.map((d, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-2 text-gray-700">{d.name}</td>
                  <td className="px-4 py-2 text-right text-gray-700 font-mono">
                    {d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-500">
                    {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400">Generated by DataPulse Analytics · {today}</p>
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
        }
      `}</style>
    </div>
  )
}
