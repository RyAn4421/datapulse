'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Eye, FileText, BarChart3, Lightbulb, Zap, GitCompare, Share2, Trash2, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

type ActivityType = 'dataset_viewed' | 'report_generated' | 'chart_created' | 'insight_viewed' | 'sample_opened' | 'compare_run' | 'share_created';

interface ActivityEntry {
  _id: string;
  type: ActivityType;
  label: string;
  datasetName?: string;
  createdAt: string;
}

const typeConfig: Record<ActivityType, { icon: React.ElementType; color: string; bg: string }> = {
  dataset_viewed:   { icon: Eye,         color: 'text-cyan-500',  bg: 'bg-cyan-500/10' },
  report_generated: { icon: FileText,    color: 'text-indigo-500',bg: 'bg-indigo-500/10' },
  chart_created:    { icon: BarChart3,   color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
  insight_viewed:   { icon: Lightbulb,   color: 'text-amber-500', bg: 'bg-amber-500/10' },
  sample_opened:    { icon: Zap,         color: 'text-rose-500',  bg: 'bg-rose-500/10' },
  compare_run:      { icon: GitCompare,  color: 'text-purple-500',bg: 'bg-purple-500/10' },
  share_created:    { icon: Share2,      color: 'text-blue-500',  bg: 'bg-blue-500/10' },
};

function formatTime(dateString: string) {
  const d = new Date(dateString);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  
  if (hrs < 48) return 'Yesterday';
  
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activity')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setActivities(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load activity log');
        setIsLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    const prev = [...activities];
    setActivities(activities.filter(a => a._id !== id));
    try {
      const res = await fetch(`/api/activity/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setActivities(prev);
      toast.error('Failed to delete activity');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your entire activity log?')) return;
    const prev = [...activities];
    setActivities([]);
    try {
      const res = await fetch('/api/activity', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Activity log cleared');
    } catch {
      setActivities(prev);
      toast.error('Failed to clear activity log');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="p-5 md:p-8 max-w-4xl mx-auto w-full space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <History className="w-6 h-6 text-accent" />
            Activity Log
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            Review your recent actions and workspace history.
          </p>
        </div>
        
        {activities.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </motion.button>
        )}
      </div>

      <div className="bg-bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <p className="text-sm text-text-muted">Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center">
              <History className="w-8 h-8 text-text-subtle" />
            </div>
            <div>
              <p className="text-text font-medium">No activity yet</p>
              <p className="text-sm text-text-muted mt-1 max-w-sm">
                Your actions will appear here once you start exploring datasets, generating reports, or creating charts.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {activities.map((activity) => {
                const config = typeConfig[activity.type] || { icon: Info, color: 'text-text', bg: 'bg-bg-hover' };
                const Icon = config.icon;
                
                return (
                  <motion.li
                    key={activity._id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-bg-hover/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-text">
                            {activity.label}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                            <span>{formatTime(activity.createdAt)}</span>
                            {activity.datasetName && (
                              <>
                                <span>•</span>
                                <span className="font-mono bg-bg-hover px-1.5 py-0.5 rounded text-text-subtle">
                                  {activity.datasetName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(activity._id)}
                        className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </motion.div>
  );
}
