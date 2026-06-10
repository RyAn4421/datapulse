'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { useStore, AppNotification } from '@/lib/store';
import Link from 'next/link';

const typeConfig: Record<AppNotification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  info:    { icon: Info,         color: 'text-cyan-500',  bg: 'bg-cyan-500/10'  },
  warning: { icon: AlertTriangle,color: 'text-warning',   bg: 'bg-warning/10'   },
  high:    { icon: Zap,          color: 'text-danger',    bg: 'bg-danger/10'    },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationPanel() {
  const {
    notifications, unreadCount, notificationPanelOpen, setNotificationPanelOpen,
    setNotifications, markNotificationRead, markAllNotificationsRead, clearNotifications,
  } = useStore();

  const panelRef = useRef<HTMLDivElement>(null);

  // Load notifications from DB on mount
  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {});
  }, [setNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotificationPanelOpen(false);
      }
    };
    if (notificationPanelOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notificationPanelOpen, setNotificationPanelOpen]);

  const handleMarkRead = async (id: string) => {
    markNotificationRead(id);
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' }).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    markAllNotificationsRead();
    // Mark all via individual patches (simple approach)
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => fetch(`/api/notifications/${n._id}`, { method: 'PATCH' }))).catch(() => {});
  };

  const handleClear = async () => {
    clearNotifications();
    await fetch('/api/notifications', { method: 'DELETE' }).catch(() => {});
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
        className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors relative"
        aria-label="Notifications"
        id="notification-bell"
      >
        <Bell className="w-4 h-4" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center px-1 border-2 border-bg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {notificationPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-bg-card border border-border shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-accent" />
                <span className="text-sm font-semibold text-text">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => setNotificationPanelOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-bg-hover flex items-center justify-center mb-3">
                    <Bell size={18} className="text-text-subtle" />
                  </div>
                  <p className="text-sm font-medium text-text">All caught up!</p>
                  <p className="text-xs text-text-muted mt-1">No notifications yet.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const { icon: Icon, color, bg } = typeConfig[n.type] || typeConfig.info;
                  const content = (
                    <div
                      key={n._id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors cursor-default ${!n.read ? 'bg-accent/5' : 'hover:bg-bg-hover/40'}`}
                      onClick={() => !n.read && handleMarkRead(n._id)}
                    >
                      <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={13} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-text leading-tight">{n.title}</p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-text-subtle mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  );
                  return n.href ? <Link key={n._id} href={n.href}>{content}</Link> : <div key={n._id}>{content}</div>;
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
