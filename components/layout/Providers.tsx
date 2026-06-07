'use client';
import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { useStore } from '@/lib/store';

export default function Providers({ children }: { children: React.ReactNode }) {
    const setTheme = useStore((state) => state.setTheme);

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
                toastOptions={{
                    style: {
                        background: '#111113',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#FAFAFA',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        borderRadius: '10px',
                    },
                }}
            />
        </SessionProvider>
    );
}
