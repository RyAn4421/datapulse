'use client';
import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Lock, Mail, Database } from 'lucide-react';
import { toast } from 'sonner';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(searchParams.get('error') || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDev, setIsDev] = useState(false);

    useEffect(() => {
        setIsDev(process.env.NODE_ENV === 'development');
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');

        const result = await signIn('credentials', { email, password, redirect: false });
        setIsSubmitting(false);

        if (result?.error) {
            setError('Invalid email or password');
            return;
        }

        router.push('/dashboard');
    };

    const handleSeedDemo = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/seed');
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Database seeded with 3 demo datasets!');
                // Auto fill & log in
                setEmail('demo@datapulse.app');
                setPassword('demo1234');
                
                const result = await signIn('credentials', { 
                    email: 'demo@datapulse.app', 
                    password: 'demo1234', 
                    redirect: false 
                });
                if (result?.error) {
                    setError('Failed to log in with demo credentials');
                } else {
                    router.push('/dashboard');
                }
            } else {
                setError(data.error || 'Failed to seed demo data');
            }
        } catch (e) {
            console.error(e);
            setError('Error seeding database');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-md"
        >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.25),transparent_60%)] blur-2xl" />
            <div className="relative bg-void-800 border border-void-500/50 rounded-xl p-6 shadow-2xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="mb-6">
                    <h1 className="text-2xl font-serif font-semibold text-ink-100">Sign in</h1>
                    <p className="text-sm text-ink-300 mt-1">Open your DataPulse workspace</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="text-sm text-ink-200">Email</span>
                        <div className="relative mt-2">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-350" />
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="w-full h-11 rounded-lg bg-void-950 border border-void-500/50 pl-10 pr-3 text-sm text-ink-100 outline-none focus:border-iris-500 transition-colors"
                                required
                            />
                        </div>
                    </label>
                    <label className="block">
                        <span className="text-sm text-ink-200">Password</span>
                        <div className="relative mt-2">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-350" />
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="w-full h-11 rounded-lg bg-void-950 border border-void-500/50 pl-10 pr-3 text-sm text-ink-100 outline-none focus:border-iris-500 transition-colors"
                                required
                            />
                        </div>
                    </label>

                    {error && <p className="text-sm text-rose-500 font-mono">{error}</p>}
                    {searchParams.get('registered') && <p className="text-sm text-emerald-500">Registration complete. Sign in to continue.</p>}

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        disabled={isSubmitting}
                        className="w-full h-11 rounded-lg bg-iris-500 hover:bg-iris-600 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-lg shadow-iris-500/10"
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </motion.button>
                </form>

                {isDev && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleSeedDemo}
                        disabled={isSubmitting}
                        className="mt-3 w-full h-11 rounded-lg bg-void-850 hover:bg-void-750 border border-void-500/50 text-iris-400 hover:text-iris-300 text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
                    >
                        <Database className="w-4 h-4" /> Seed & Try Demo
                    </motion.button>
                )}

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                    className="mt-3 w-full flex items-center justify-center gap-3 border border-void-500/50 text-ink-200 hover:bg-void-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </motion.button>

                <p className="mt-6 text-center text-sm text-ink-350">
                    New to DataPulse? <Link href="/register" className="text-iris-400 hover:text-iris-300 font-medium ml-1">Create an account</Link>
                </p>
            </div>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-ink-300 text-sm">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
