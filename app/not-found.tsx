import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="relative bg-bg-card border border-border rounded-xl p-8 text-center max-w-sm w-full overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <p className="text-5xl font-serif text-accent mb-4">404</p>
                <h1 className="text-xl font-semibold text-text mb-2">Page not found</h1>
                <p className="text-sm text-text-muted mb-6">This DataPulse view is not available.</p>
                <Link href="/dashboard" className="inline-flex h-10 px-4 items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium">
                    Go Home
                </Link>
            </div>
        </main>
    );
}
