'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X, CheckCircle2 } from 'lucide-react';
import { Alert } from '@/lib/analytics/alerts';

interface AlertPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  info: {
    icon: Info,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
};

export default function AlertPanel({ alerts, isLoading }: AlertPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Reset dismissed alerts when new dataset is loaded (alerts array changes length or ids)
  useEffect(() => {
    setDismissedIds(new Set());
  }, [alerts]);

  const activeAlerts = alerts.filter(a => !dismissedIds.has(a.id));

  if (isLoading) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-5 w-full h-48 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Analyzing dataset for anomalies...</p>
        </div>
      </div>
    );
  }

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-5 w-full flex items-center justify-center min-h-[120px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-sm text-text-muted">No smart alerts found. Dataset looks clean.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl w-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center bg-bg-card/50">
        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
          <AlertCircle size={16} className="text-accent" />
          Smart Alerts
          <span className="bg-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full ml-1">
            {activeAlerts.length}
          </span>
        </h3>
      </div>
      
      <div className="p-4 flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {activeAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                className={`relative flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}
              >
                <div className={`mt-0.5 ${config.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-sm font-medium text-text mb-0.5">{alert.title}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{alert.description}</p>
                </div>
                <button
                  onClick={() => setDismissedIds(prev => new Set(prev).add(alert.id))}
                  className="absolute top-3 right-3 text-text-muted hover:text-text transition-colors p-1"
                  aria-label="Dismiss alert"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
