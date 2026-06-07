import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-void-950">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Topbar />
                {/* 
                  Using motion.main directly in the layout can cause remount issues on route changes with App Router,
                  so we wrap individual page contents in AnimatePresence/motion.div instead, or just let CSS handle it.
                */}
                <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
