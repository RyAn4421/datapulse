'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, User } from 'lucide-react';
import { signIn } from 'next-auth/react';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!emailPattern.test(email)) {
            setError('Enter a valid email address');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        setIsSubmitting(false);

        if (!response.ok) {
            const body = await response.json();
            setError(body.error || 'Failed to create account');
            return;
        }

        router.push('/login?registered=true');
    };

    const fields = [
        { label: 'Full Name', value: name, setter: setName, type: 'text', icon: User },
        { label: 'Email', value: email, setter: setEmail, type: 'email', icon: Mail },
        { label: 'Password', value: password, setter: setPassword, type: 'password', icon: Lock },
        { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, type: 'password', icon: Lock },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.25),transparent_60%)] blur-2xl" />
            <div className="relative bg-bg-card border border-border rounded-xl p-6 shadow-2xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <h1 className="text-2xl font-semibold text-text">Create account</h1>
                <p className="text-sm text-text-muted mt-1 mb-6">Start analysing with DataPulse</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Google Sign Up */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        className="w-full flex items-center justify-center gap-3 border border-border hover:bg-bg-hover text-text font-medium px-4 py-2.5 rounded-lg text-sm transition-colors mb-4"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </motion.button>

                    {/* Divider */}
                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="text-xs text-text-muted bg-bg-card px-3">or sign up with email</span>
                        </div>
                    </div>

                    {fields.map((field) => {
                        const Icon = field.icon;
                        return (
                            <label key={field.label} className="block">
                                <span className="text-sm text-text-muted">{field.label}</span>
                                <div className="relative mt-2">
                                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type={field.type}
                                        value={field.value}
                                        onChange={(event) => field.setter(event.target.value)}
                                        className="w-full h-11 rounded-lg bg-bg border border-border pl-10 pr-3 text-sm text-text outline-none focus:border-accent"
                                        required
                                    />
                                </div>
                            </label>
                        );
                    })}

                    {error && <p className="text-sm text-danger">{error}</p>}

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        disabled={isSubmitting}
                        className="w-full h-11 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-medium"
                    >
                        {isSubmitting ? 'Creating account...' : 'Create account'}
                    </motion.button>
                </form>

                <p className="mt-6 text-center text-sm text-text-muted">
                    Already registered? <Link href="/login" className="text-accent hover:text-accent-hover">Sign in</Link>
                </p>
            </div>
        </motion.div>
    );
}
