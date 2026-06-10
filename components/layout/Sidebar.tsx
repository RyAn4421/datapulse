'use client';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Database, BarChart3, Search, Lightbulb, LogOut, Loader2, Sparkles, FileText, GitCompare, Users, History } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

const navItems = [
    { section: 'OVERVIEW' },
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { section: 'DATA' },
    { label: 'Import Data', icon: Database, href: '/import' },
    { label: 'Explore', icon: Search, href: '/explore' },
    { section: 'TOOLS' },
    { label: 'Charts', icon: BarChart3, href: '/charts' },
    { label: 'Insights', icon: Lightbulb, href: '/insights' },
    { label: 'AI Insights', icon: Sparkles, href: '/smart-insights' },
    { label: 'Compare', icon: GitCompare, href: '/compare' },
    { label: 'Report', icon: FileText, href: '/report' },
    { section: 'TEAM & HISTORY' },
    { label: 'Activity Log', icon: History, href: '/activity', id: 'activity-nav' },
    { label: 'Workspace', icon: Users, href: '/workspace' },
];

function hashStringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export default function Sidebar() {
    const { isSidebarOpen, datasets, activeDatasetId, setActiveDatasetId } = useStore();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    return (
        <motion.aside
            initial={false}
            animate={{ width: isSidebarOpen ? 224 : 56 }}
            className="hidden md:flex flex-col h-screen bg-bg-card border-r border-border shrink-0 overflow-hidden"
        >
            <div className="flex items-center h-16 px-3 border-b border-border shrink-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                    <Image src="/logo/datapulse-logo.png" alt="DataPulse" width={32} height={32} className="object-contain" />
                </div>
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="ml-3 font-serif text-xl tracking-wide whitespace-nowrap overflow-hidden text-ellipsis text-text"
                        >
                            DataPulse
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden no-scrollbar">
                <ul className="flex flex-col gap-1 px-2">
                    {navItems.map((item, index) => {
                        if (item.section) {
                            return (
                                <li key={index} className="mt-4 first:mt-0 mb-1">
                                    {isSidebarOpen ? (
                                        <span className="px-2 text-[10px] font-mono tracking-wider text-text-subtle">
                                            {item.section}
                                        </span>
                                    ) : (
                                        <div className="h-4" /> // spacer when closed
                                    )}
                                </li>
                            );
                        }

                        const Icon = item.icon!;
                        const isActive = pathname === item.href;

                        return (
                            <li key={index}>
                                <Link
                                    href={item.href!}
                                    id={item.id}
                                    className={cn(
                                        "flex items-center h-[34px] px-2 rounded-lg text-sm font-medium transition-colors group relative",
                                        isActive 
                                            ? "bg-bg-hover text-text border-l-2 border-accent" 
                                            : "text-text-muted hover:bg-bg-hover/50 hover:text-text"
                                    )}
                                    title={!isSidebarOpen ? item.label : undefined}
                                >
                                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-accent" : "text-text-muted group-hover:text-accent")} />
                                    
                                    <AnimatePresence>
                                        {isSidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="ml-3 whitespace-nowrap text-ellipsis overflow-hidden"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>
                            </li>
                        );
                    })}

                    {/* Live datasets list */}
                    <AnimatePresence>
                        {isSidebarOpen && datasets && datasets.length > 0 && (
                            <motion.li
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <ul className="flex flex-col gap-1">
                                    <li className="mt-4 mb-1">
                                        <span className="px-2 text-[10px] font-mono tracking-wider text-text-subtle">
                                            DATASETS
                                        </span>
                                    </li>
                                    {datasets.slice(0, 5).map((dataset) => {
                                        const isActive = activeDatasetId === dataset._id;
                                        const truncatedName = dataset.name.length > 16 ? dataset.name.substring(0, 16) + '...' : dataset.name;
                                        const dotColor = `hsl(${hashStringToHue(dataset.name)}, 65%, 55%)`;
                                        return (
                                            <li key={dataset._id}>
                                                <button
                                                    onClick={() => {
                                                        setActiveDatasetId(dataset._id);
                                                        router.push('/dashboard');
                                                    }}
                                                    className={cn(
                                                        "flex items-center w-full h-[34px] px-2 rounded-lg text-sm font-medium transition-colors group relative",
                                                        isActive 
                                                            ? "bg-bg-hover text-text border-l-2 border-accent" 
                                                            : "text-text-muted hover:bg-bg-hover/50 hover:text-text"
                                                    )}
                                                >
                                                    <div 
                                                        className="w-1.5 h-1.5 rounded-full shrink-0 ml-1 transition-all" 
                                                        style={{ 
                                                            backgroundColor: dotColor,
                                                            boxShadow: isActive ? `0 0 6px ${dotColor}` : 'none'
                                                        }} 
                                                    />
                                                    <span className="ml-3 whitespace-nowrap text-ellipsis overflow-hidden text-left">
                                                        {truncatedName}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                    <li>
                                        <button
                                            onClick={() => router.push('/import')}
                                            className="flex items-center w-full h-[34px] px-2 text-xs font-mono text-accent hover:text-accent-hover transition-colors text-left"
                                        >
                                            + Import Data
                                        </button>
                                    </li>
                                </ul>
                            </motion.li>
                        )}
                    </AnimatePresence>
                </ul>
            </nav>

            <div className="p-3 border-t border-border shrink-0">
                <div className={cn("flex items-center", isSidebarOpen ? "justify-between" : "justify-center")}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-bg-hover border border-border flex items-center justify-center text-xs font-bold text-text shrink-0 uppercase">
                            {session?.user?.name?.charAt(0) || <Loader2 className="w-3.5 h-3.5 animate-spin text-accent"/>}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-text truncate">{session?.user?.name || 'User'}</span>
                                <span className="text-xs text-text-muted truncate capitalize">{(session?.user as any)?.role || 'admin'}</span>
                            </div>
                        )}
                    </div>
                </div>
                {isSidebarOpen && (
                    <button 
                        onClick={() => signOut({ callbackUrl: '/login'})}
                        className="mt-3 w-full flex items-center justify-center gap-2 h-[34px] rounded-lg bg-bg hover:bg-bg-hover border border-border text-text-muted hover:text-text text-sm transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                )}
                {!isSidebarOpen && (
                    <button 
                         onClick={() => signOut({ callbackUrl: '/login'})}
                         className="mt-3 w-full flex items-center justify-center h-[34px] rounded-lg hover:bg-bg-hover text-text-muted hover:text-text transition-colors"
                         title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.aside>
    );
}
