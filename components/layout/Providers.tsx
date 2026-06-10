'use client';
import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { useStore } from '@/lib/store';

export default function Providers({ children }: { children: React.ReactNode }) {
    const setTheme = useStore((state) => state.setTheme);

    const theme = useStore((state) => state.theme);

    useEffect(() => {
        const saved = (localStorage.getItem('datapulse-theme') || 'dark') as 'dark' | 'light';
        document.documentElement.setAttribute('data-theme', saved);
        setTheme(saved);
    }, [setTheme]);

    return (
        <SessionProvider>
            {children}
            <Toaster
                position="bottom-right"
                theme={theme}
                toastOptions={{
                    style: {
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        borderRadius: '10px',
                    },
                }}
            />
        </SessionProvider>
    );
}
