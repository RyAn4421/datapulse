import { create } from 'zustand';
import { Dataset, DatasetMeta } from '@/types';

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
}));

export const useDashboardStore = useStore;
