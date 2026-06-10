'use client';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { PanelLeftClose, PanelLeft, Database, ChevronDown, Menu, RefreshCw } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useDatasets } from '@/hooks/useDataset';
import { AnimatePresence, motion } from 'framer-motion';
import { MobileNav } from './MobileNav';
import { mutate } from 'swr';
import { toast } from 'sonner';

import { Sun, Moon } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

export default function Topbar() {
    const { isSidebarOpen, setSidebarOpen, activeDatasetId, setActiveDatasetId, mobileNavOpen, setMobileNavOpen, theme, toggleTheme } = useStore();
    const pathname = usePathname();
    const { datasets, isLoading } = useDatasets();
    
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const activeDataset = datasets?.find((d: any) => d._id === activeDatasetId);
    
    // Breadcrumb logic
    const pathParts = pathname.split('/').filter(Boolean);
    const currentPage = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Dashboard';

    const handleRefresh = async () => {
        try {
            // Trigger refresh for datasets list, active dataset, and insights
            const promises = [
                mutate('/api/datasets'),
            ];
            if (activeDatasetId) {
                promises.push(mutate(`/api/datasets/${activeDatasetId}`));
                promises.push(mutate(`/api/insights/${activeDatasetId}`));
            }
            await Promise.all(promises);
            toast.success('Dashboard metrics refreshed!');
        } catch (error) {
            console.error('Failed to refresh data:', error);
            toast.error('Failed to refresh data');
        }
    };

    return (
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-bg/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
            <AnimatePresence>
                {mobileNavOpen && <MobileNav />}
            </AnimatePresence>
            <div className="flex items-center gap-4">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setMobileNavOpen(true)}
                    className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="hidden md:inline-flex p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                >
                    {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                </motion.button>
                <div className="h-4 w-[1px] bg-border mx-2" />
                <div className="flex items-center text-sm font-medium capitalize text-text">
                    {currentPage}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 h-9 px-3 rounded-lg bg-bg-card border border-border hover:border-border-strong text-sm font-medium transition-all group outline-none focus:ring-2 focus:ring-iris-500/20"
                    >
                        <Database className="w-4 h-4 text-iris-400" />
                        <span className="truncate max-w-[150px] text-text">
                            {isLoading ? 'Loading...' : (activeDataset ? activeDataset.name : 'No dataset selected')}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-text-muted ml-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div 
                            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl bg-bg-card border border-border shadow-xl overflow-hidden py-1"
                        >
                            <div className="px-3 py-2 text-xs font-semibold text-text-muted">
                                Your Datasets
                            </div>
                            {datasets?.length === 0 && (
                                <div className="px-3 py-2 text-sm text-text-muted">No datasets found</div>
                            )}
                            {datasets?.map((ds: any) => (
                                <button
                                    key={ds._id}
                                    onClick={() => {
                                        setActiveDatasetId(ds._id);
                                        setDropdownOpen(false);
                                    }}
                                    className="w-full text-left flex items-center px-3 py-2 text-sm text-text hover:bg-bg-hover cursor-pointer outline-none transition-colors"
                                >
                                    {ds.name}
                                    {ds._id === activeDatasetId && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-iris-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-4 w-[1px] bg-border mx-1" />

                {/* Refresh button */}
                <motion.button 
                    whileTap={{ scale: 0.97 }} 
                    onClick={handleRefresh}
                    className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors relative"
                    title="Refresh Data"
                >
                    <RefreshCw className="w-4 h-4" />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-transparent hover:bg-bg-hover transition-colors"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark'
                    ? <Sun size={16} className="text-text-muted" />
                    : <Moon size={16} className="text-text-muted" />
                  }
                </motion.button>

                {/* Notification Center */}
                <NotificationPanel />
            </div>
        </header>
    );
}

