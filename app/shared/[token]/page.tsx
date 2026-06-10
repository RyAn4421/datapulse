'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, Printer, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366F1','#22D3EE','#10B981','#F59E0B','#EF4444','#8B5CF6'];

export default function SharedReportPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/share/${params.token}`)
      .then(res => res.json().then(json => ({ status: res.status, json })))
      .then(({ status, json }) => {
        if (status !== 200) throw new Error(json.error || 'Failed to load report');
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-bg text-text">
        <div className="h-8 w-48 bg-bg-card border border-border rounded animate-pulse mb-8" />
        <div className="w-full max-w-4xl h-64 bg-bg-card border border-border rounded animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-bg text-text">
        <AlertTriangle size={48} className="text-danger mb-4 opacity-80" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  const { datasetName, executiveSummary, metrics, charts, generatedAt } = data;
  const dateStr = new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8 font-sans text-text">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex items-center gap-2 text-accent">
            <BarChart2 size={24} />
            <span className="font-bold text-lg tracking-wide">DataPulse Shared Report</span>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-bg-hover hover:bg-border text-text px-4 py-2 rounded-lg text-sm transition-colors">
            <Printer size={16} /> Print Report
          </button>
        </div>

        <div className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-200 print:shadow-none print:border-none">
          {/* Cover Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 md:p-12 text-white">
            <p className="text-indigo-200 text-xs font-mono uppercase tracking-widest mb-3">Executive Report</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{datasetName}</h1>
            <p className="text-indigo-200 text-sm">Generated on {dateStr}</p>
            <div className="flex flex-wrap gap-8 mt-10">
              <div>
                <p className="text-indigo-200 text-xs uppercase font-mono tracking-wider mb-1">Rows</p>
                <p className="text-2xl font-bold">{metrics.rowCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-indigo-200 text-xs uppercase font-mono tracking-wider mb-1">Columns</p>
                <p className="text-2xl font-bold">{metrics.colCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-indigo-200 text-xs uppercase font-mono tracking-wider mb-1">Total {metrics.numColName}</p>
                <p className="text-2xl font-bold">{metrics.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-indigo-200 text-xs uppercase font-mono tracking-wider mb-1">Average {metrics.numColName}</p>
                <p className="text-2xl font-bold">{metrics.avgValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
              </div>
            </div>
          </div>

          {/* AI Narrative Sections */}
          <div className="p-8 md:p-12 space-y-8 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                Executive Summary
              </h2>
              <p className="text-gray-700 leading-relaxed ml-8">{executiveSummary.overview}</p>
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                Key Findings
              </h2>
              <p className="text-gray-700 leading-relaxed ml-8">{executiveSummary.topCategory}</p>
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
                Risks
              </h2>
              <p className="text-gray-700 leading-relaxed ml-8">{executiveSummary.risk}</p>
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">4</span>
                Opportunities
              </h2>
              <p className="text-gray-700 leading-relaxed ml-8">{executiveSummary.opportunities}</p>
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">5</span>
                Recommendations
              </h2>
              <p className="text-gray-700 leading-relaxed ml-8">{executiveSummary.recommendation}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="p-8 md:p-12 bg-gray-50">
            <h2 className="text-lg font-bold text-indigo-900 mb-6 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">6</span>
              Visualizations & Charts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-8">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-6 text-center">{metrics.numColName} by {metrics.catColName}</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={charts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <RechartsTooltip cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="value" fill="#6366F1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-6 text-center">{metrics.catColName} Share</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={charts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                      {charts.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-white border-t border-gray-100 flex justify-between items-center print:border-t-0">
            <p className="text-xs text-gray-400">Generated by DataPulse Analytics</p>
            <p className="text-xs text-gray-400">Confidential</p>
          </div>
        </div>
      </div>
    </div>
  );
}
