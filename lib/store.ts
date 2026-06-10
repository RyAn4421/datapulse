import { create } from 'zustand';
import { Dataset, DatasetMeta } from '@/types';

export interface AppNotification {
  _id: string;
  type: 'success' | 'info' | 'warning' | 'high';
  title: string;
  message: string;
  read: boolean;
  href?: string;
  createdAt: string;
}

interface DashboardStore {
  // Dataset
  activeDatasetId: string | null;
  activeDataset: Dataset | null;   // full dataset with rows
  datasets: DatasetMeta[];         // list of all user datasets (no rows)
  setActiveDatasetId: (id: string | null) => void;
  setActiveDataset: (ds: Dataset | null) => void;
  setDatasets: (list: DatasetMeta[]) => void;

  // Sidebar
  isSidebarOpen: boolean;          // Keep for backward compatibility
  setSidebarOpen: (isOpen: boolean) => void; // Keep for backward compatibility
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Search & Pagination
  search: string;
  setSearch: (q: string) => void;
  page: number;
  setPage: (p: number) => void;

  // Chart builder config
  chartXCol: string;
  chartYCol: string;
  chartAggType: 'sum' | 'avg' | 'count' | 'min' | 'max';
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'radar' | 'scatter' | 'stacked' | 'horizontal' | 'arealine';
  setChartXCol: (col: string) => void;
  setChartYCol: (col: string) => void;
  setChartAggType: (agg: 'sum' | 'avg' | 'count' | 'min' | 'max') => void;
  setChartType: (type: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'radar' | 'scatter' | 'stacked' | 'horizontal' | 'arealine') => void;

  // Notifications (UI cache — MongoDB is source of truth)
  notifications: AppNotification[];
  unreadCount: number;
  setNotifications: (list: AppNotification[]) => void;
  addNotification: (n: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;
}

export const useStore = create<DashboardStore>((set) => ({
  // Dataset
  activeDatasetId: null,
  activeDataset: null,
  datasets: [],
  setActiveDatasetId: (id) => set({ activeDatasetId: id }),
  setActiveDataset: (ds) => set({ activeDataset: ds }),
  setDatasets: (list) => set({ datasets: list }),

  // Sidebar
  isSidebarOpen: true,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen, sidebarCollapsed: !isOpen }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => {
    const nextOpen = !state.isSidebarOpen;
    return {
      isSidebarOpen: nextOpen,
      sidebarCollapsed: !nextOpen,
    };
  }),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  // Theme
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('datapulse-theme', next);
    }
    return { theme: next };
  }),
  setTheme: (theme) => set({ theme }),

  // Search & Pagination
  search: '',
  setSearch: (q) => set({ search: q }),
  page: 1,
  setPage: (p) => set({ page: p }),

  // Chart builder config
  chartXCol: '',
  chartYCol: '',
  chartAggType: 'sum',
  chartType: 'bar',
  setChartXCol: (col) => set({ chartXCol: col }),
  setChartYCol: (col) => set({ chartYCol: col }),
  setChartAggType: (agg) => set({ chartAggType: agg }),
  setChartType: (type) => set({ chartType: type }),

  // Notifications
  notifications: [],
  unreadCount: 0,
  setNotifications: (list) => set({ notifications: list, unreadCount: list.filter((n) => !n.read).length }),
  addNotification: (n) => set((state) => {
    const next = [n, ...state.notifications].slice(0, 100);
    return { notifications: next, unreadCount: next.filter((x) => !x.read).length };
  }),
  markNotificationRead: (id) => set((state) => {
    const next = state.notifications.map((n) => n._id === id ? { ...n, read: true } : n);
    return { notifications: next, unreadCount: next.filter((x) => !x.read).length };
  }),
  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
  notificationPanelOpen: false,
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
}));

export const useDashboardStore = useStore;
