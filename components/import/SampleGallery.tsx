'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Users, DollarSign, Briefcase, Zap, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useDatasets } from '@/hooks/useDataset';
import { toast } from 'sonner';

const SAMPLES = [
  {
    key: 'sales',
    name: 'Sales Performance',
    description: 'Monthly revenue by region, product, and rep across a full year',
    icon: TrendingUp,
    color: '#6C63FF',
    rows: 48,
    tags: ['Revenue', 'Regions', 'Targets'],
  },
  {
    key: 'marketing',
    name: 'Marketing Analytics',
    description: 'Digital campaign ROI across channels — Search, Social, Email, Video',
    icon: BarChart3,
    color: '#22D3EE',
    rows: 25,
    tags: ['ROAS', 'Channels', 'Conversions'],
  },
  {
    key: 'hr',
    name: 'HR People Analytics',
    description: 'Workforce performance, satisfaction, salary, and attrition analysis',
    icon: Users,
    color: '#10B981',
    rows: 25,
    tags: ['Attrition', 'Salary', 'Performance'],
  },
  {
    key: 'finance',
    name: 'Budget Tracker',
    description: 'Departmental budget vs actuals with variance and status tracking',
    icon: DollarSign,
    color: '#F59E0B',
    rows: 30,
    tags: ['Budget', 'Variance', 'Departments'],
  },
  {
    key: 'projects',
    name: 'Project Portfolio',
    description: 'Cross-department project health, spend, progress, and risk signals',
    icon: Briefcase,
    color: '#EF4444',
    rows: 20,
    tags: ['Progress', 'Budget', 'Priority'],
  },
];

export default function SampleGallery() {
  const [loading, setLoading] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const { setActiveDatasetId } = useStore();
  const { mutate } = useDatasets();
  const router = useRouter();

  const handleOpen = async (key: string) => {
    setLoading(key);
    try {
      const res = await fetch(`/api/samples/${key}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const dataset = await res.json();

      // Track activity
      await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sample_opened',
          label: `Opened sample: ${dataset.name}`,
          datasetId: dataset._id,
          datasetName: dataset.name,
        }),
      }).catch(() => {});

      // Create notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'success',
          title: 'Sample dataset loaded',
          message: `${dataset.name} is ready — Executive Summary and Insights pre-generated.`,
          href: '/dashboard',
        }),
      }).catch(() => {});

      setActiveDatasetId(dataset._id);
      await mutate();
      setLoaded((prev) => new Set(prev).add(key));
      toast.success(`${dataset.name} loaded!`);
      router.push('/dashboard');
    } catch {
      toast.error('Failed to load sample dataset');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-accent" />
        <h2 className="text-sm font-semibold text-text">Sample Datasets</h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent">
          Instant • No Upload Required
        </span>
      </div>
      <p className="text-xs text-text-muted">
        Explore DataPulse with pre-built datasets — AI summaries and insights are already generated.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3" id="sample-gallery">
        {SAMPLES.map((s, i) => {
          const Icon = s.icon;
          const isLoading = loading === s.key;
          const isDone = loaded.has(s.key);

          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className="relative flex flex-col gap-3 p-4 rounded-xl border border-border bg-bg hover:border-accent/30 transition-all cursor-default group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: s.color + '20' }}
              >
                <Icon size={16} style={{ color: s.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text leading-tight">{s.name}</p>
                <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">{s.description}</p>
              </div>

              <div className="flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-bg-hover text-text-subtle">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-subtle">{s.rows} rows</span>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleOpen(s.key)}
                  disabled={isLoading || isDone}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-70"
                  style={{
                    background: isDone ? '#10B981' : isLoading ? s.color + '80' : s.color,
                    color: '#ffffff',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span key="spin" className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isDone ? (
                      <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 size={11} />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  {isDone ? 'Opened' : isLoading ? 'Loading...' : 'Open'}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
