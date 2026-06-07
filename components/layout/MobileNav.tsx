'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Database, LayoutDashboard, Lightbulb, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Import Data', icon: Database, href: '/import' },
    { label: 'Explore', icon: Search, href: '/explore' },
    { label: 'Charts', icon: BarChart3, href: '/charts' },
    { label: 'Insights', icon: Lightbulb, href: '/insights' },
];

export function MobileNav() {
    const pathname = usePathname();
    const setMobileNavOpen = useStore((state) => state.setMobileNavOpen);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-64 bg-bg-card border-r border-border p-4 md:hidden"
            >
                <div className="flex items-center justify-between h-12 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-serif text-lg font-bold text-white">
                            DP
                        </div>
                        <span className="font-serif text-xl text-text">DataPulse</span>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setMobileNavOpen(false)}
                        className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover"
                    >
                        <X className="w-4 h-4" />
                    </motion.button>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileNavOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors',
                                    isActive ? 'bg-accent text-white' : 'text-text-muted hover:text-text hover:bg-bg-hover'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </motion.aside>
        </>
    );
}
