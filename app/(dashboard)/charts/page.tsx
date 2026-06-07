'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, BarChart2, LineChart, PieChart, Activity,
         ScatterChart, TriangleRight, Layers, TrendingUp, AlignLeft } from 'lucide-react'
import {
  BarChart, Bar, LineChart as ReLineChart, Line, AreaChart, Area,
  PieChart as RePieChart, Pie, Cell, ScatterChart as ReScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from 'recharts'
import { useDashboardStore } from '@/lib/store'
import SimpleDropdown from '@/components/ui/SimpleDropdown'
import { prepareChartData } from '@/lib/utils'

// Define outside component — stable reference
const fetcher = (url: string) => fetch(url).then(r => r.json())

// Helper: detect numeric columns
function getNumericCols(rows: Record<string, unknown>[], headers: string[]): string[] {
  return headers.filter(h =>
    rows.slice(0, 20).some(r => !isNaN(Number(r[h])) && r[h] !== '' && r[h] !== null)
  )
}

const CHART_TYPES = [
  { id: 'bar',        label: 'Bar',        icon: BarChart2 },
  { id: 'line',       label: 'Line',       icon: LineChart },
  { id: 'area',       label: 'Area',       icon: Activity },
  { id: 'pie',        label: 'Pie',        icon: PieChart },
  { id: 'donut',      label: 'Donut',      icon: PieChart },
  { id: 'radar',      label: 'Radar',      icon: TriangleRight },
  { id: 'scatter',    label: 'Scatter',    icon: ScatterChart },
  { id: 'stacked',    label: 'Stacked',    icon: Layers },
  { id: 'horizontal', label: 'H. Bar',     icon: AlignLeft },
]

const COLORS = ['#6366F1','#22D3EE','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6']

const tooltipStyle = {
  contentStyle: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--text)',
  },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
}

const gridStyle = { stroke: 'rgba(255,255,255,0.05)', strokeDasharray: '3 3' }
const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 }

export default function ChartsPage() {
  const { activeDatasetId, activeDataset, chartXCol, chartYCol, chartAggType, chartType,
          setChartXCol, setChartYCol, setChartAggType, setChartType } = useDashboardStore()

  const chartRef = useRef<HTMLDivElement>(null)

  // Derive data from active dataset
  const rows = useMemo(() => activeDataset?.rows ?? [], [activeDataset])
  const headers = useMemo(() => activeDataset?.headers ?? [], [activeDataset])
  const numericCols = useMemo(() => getNumericCols(rows, headers), [rows, headers])

  // Auto-set defaults when dataset loads
  useEffect(() => {
    if (headers.length > 0 && !chartXCol) setChartXCol(headers[0])
    if (numericCols.length > 0 && !chartYCol) setChartYCol(numericCols[0])
    if (!chartAggType) setChartAggType('sum')
    if (!chartType) setChartType('bar')
  }, [headers, numericCols]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build chart data from config
  const chartData = useMemo(() => {
    if (!chartXCol || !chartYCol || rows.length === 0) return []
    return prepareChartData(rows, headers, chartXCol, chartYCol, chartAggType as any)
  }, [rows, headers, chartXCol, chartYCol, chartAggType])

  // Dynamic title
  const chartTitle = chartXCol && chartYCol
    ? `${chartAggType?.toUpperCase()} of ${chartYCol} by ${chartXCol}`
    : 'Configure options above'

  // Export PNG
  const handleExport = async () => {
    if (!chartRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#111113' })
      const link = document.createElement('a')
      link.download = `${chartTitle}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (e) {
      console.error('Export failed', e)
    }
  }

  // Render the selected chart type
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <BarChart2 size={48} className="text-text-muted mb-3 opacity-40" />
          <p className="text-text-muted text-sm">Configure the options above to build a chart</p>
        </div>
      )
    }

    const commonProps = { isAnimationActive: true, animationDuration: 700, animationEasing: 'ease-out' as const }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="cBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="url(#cBarGrad)" radius={[4,4,0,0]} {...commonProps} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={chartData}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1', r: 3 }} {...commonProps} />
            </ReLineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill="url(#cAreaGrad)" {...commonProps} />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={chartType === 'donut' ? 70 : 0}
                outerRadius={110}
                paddingAngle={2}
                {...commonProps}
              >
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
            </RePieChart>
          </ResponsiveContainer>
        )

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData.slice(0, 8)}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} {...commonProps} />
              <Tooltip {...tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ReScatterChart>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="name" name={chartXCol} tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis dataKey="value" name={chartYCol} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={chartData} fill="#6366F1" fillOpacity={0.7} {...commonProps} />
            </ReScatterChart>
          </ResponsiveContainer>
        )

      case 'stacked':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid {...gridStyle} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
              <Bar dataKey="value" name={chartYCol} stackId="s" fill="#6366F1" radius={[0,0,0,0]} {...commonProps} />
              <Bar dataKey="count" name="Count" stackId="s" fill="#22D3EE" radius={[4,4,0,0]} {...commonProps} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'horizontal':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.slice(0, 10)} layout="vertical">
              <CartesianGrid {...gridStyle} horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="#22D3EE" radius={[0,4,4,0]} {...commonProps}>
                <LabelList dataKey="value" position="right" style={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  // No dataset state
  if (!activeDatasetId || !activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <BarChart2 size={48} className="text-text-muted mb-4 opacity-40" />
        <p className="text-text font-semibold mb-2">No dataset selected</p>
        <p className="text-text-muted text-sm mb-6">Go to Import to upload a dataset first</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="p-5 space-y-5"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text">Chart Builder</h1>
        <p className="text-text-muted text-sm mt-0.5">
          Building from: <span className="text-accent font-medium">{activeDataset.name}</span>
          <span className="text-text-subtle ml-2">({rows.length} rows)</span>
        </p>
      </div>

      {/* Config Bar */}
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">X Axis (Category)</label>
            <SimpleDropdown
              label="Select column"
              options={headers}
              value={chartXCol}
              onChange={setChartXCol}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Y Axis (Value)</label>
            <SimpleDropdown
              label="Select column"
              options={numericCols.length > 0 ? numericCols : headers}
              value={chartYCol}
              onChange={setChartYCol}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Aggregation</label>
            <SimpleDropdown
              label="Aggregation"
              options={['sum', 'avg', 'count', 'min', 'max']}
              value={chartAggType}
              onChange={(val) => setChartAggType(val as any)}
            />
          </div>
        </div>
      </div>

      {/* Chart Type Picker */}
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-3">Chart Type</p>
        <div className="flex flex-wrap gap-2">
          {CHART_TYPES.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setChartType(id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${chartType === id
                  ? 'bg-accent text-white'
                  : 'bg-bg-hover text-text-muted hover:text-text border border-border'
                }`}
            >
              <Icon size={12} />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart Preview */}
      <div className="bg-bg-card border border-border rounded-xl p-5 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text truncate">{chartTitle}</h3>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-text-muted hover:text-text hover:bg-bg-hover transition-colors flex-shrink-0 ml-2"
          >
            <Download size={12} />
            Export PNG
          </motion.button>
        </div>
        <div ref={chartRef} className="h-[360px]">
          {renderChart()}
        </div>
      </div>
    </motion.div>
  )
}
