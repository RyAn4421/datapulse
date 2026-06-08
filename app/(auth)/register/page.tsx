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
        <div className="flex w-full max-w-[900px] min-h-[550px] bg-void-900 border border-void-800 shadow-2xl rounded-2xl overflow-hidden relative">
            {/* Left Panel */}
            <div className="hidden md:flex flex-col relative w-1/2 p-10 justify-center overflow-hidden bg-void-950">
                {/* Animated wave background (cyan variant) */}
                <svg
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.35 }}
                  viewBox="0 0 360 700"
                  preserveAspectRatio="xMidYMid slice"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2"/>
                    </linearGradient>
                    <linearGradient id="waveGrad4" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35"/>
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                  {/* Wave 1 */}
                  <path d="M0 200 Q90 160 180 200 T360 200 V700 H0Z" fill="url(#waveGrad3)">
                    <animateTransform attributeName="transform" type="translate"
                      values="0,0;-180,0;0,0" dur="8s" repeatCount="indefinite"/>
                  </path>
                  {/* Wave 2 */}
                  <path d="M0 240 Q90 200 180 240 T360 240 V700 H0Z" fill="url(#waveGrad4)">
                    <animateTransform attributeName="transform" type="translate"
                      values="0,0;180,0;0,0" dur="6s" repeatCount="indefinite"/>
                  </path>
                  {/* Wave 3 subtle */}
                  <path d="M0 280 Q90 250 180 280 T360 280 V700 H0Z" fill="rgba(34,211,238,0.08)">
                    <animateTransform attributeName="transform" type="translate"
                      values="0,0;-90,0;0,0" dur="10s" repeatCount="indefinite"/>
                  </path>
                </svg>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"
                      style={{ filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.5))', marginBottom: 20, position: 'relative', zIndex: 3 }}
                    >
                      <rect width="72" height="72" rx="18" fill="#080c24"/>
                      <defs>
                        <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22D3EE"/>
                          <stop offset="50%" stopColor="#818CF8"/>
                          <stop offset="100%" stopColor="#6366F1"/>
                        </linearGradient>
                      </defs>
                      <path d="M12 50 L20 26 L30 44 L36 32 L42 44 L52 26 L60 50"
                        fill="none" stroke="url(#logoGrad2)" strokeWidth="5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 22, fontWeight: 700,
                      color: '#F1F5F9',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                      position: 'relative', zIndex: 3,
                    }}>
                        DataPulse
                    </div>
                    <p className="text-sm text-ink-300 max-w-[200px] relative z-[3]">
                        Your SaaS analytics, simplified and automated.
                    </p>
                </div>
            </div>

            {/* Right Panel */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full md:w-1/2 p-8 md:p-10 relative bg-void-800"
            >
                <div className="mb-6">
                    <h1 style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 30,
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #ffffff 0%, #a5f3fc 50%, #67e8f9 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: 8,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                    }}>
                      Create your account
                    </h1>
                    <p className="text-sm text-ink-300 mt-1">Start analysing with DataPulse</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Google Sign Up */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        className="w-full flex items-center justify-center gap-3 border border-void-500/50 hover:bg-void-700 text-ink-200 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors mb-4"
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
                            <div className="w-full border-t border-void-500/50" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="text-xs text-ink-350 bg-void-800 px-3">or sign up with email</span>
                        </div>
                    </div>

                    {fields.map((field) => {
                        const Icon = field.icon;
                        return (
                            <label key={field.label} className="block">
                                <span className="text-sm text-ink-200">{field.label}</span>
                                <div className="relative mt-2">
                                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-350" />
                                    <input
                                        type={field.type}
                                        value={field.value}
                                        onChange={(event) => field.setter(event.target.value)}
                                        className="w-full h-11 rounded-lg bg-void-950 border border-void-500/50 pl-10 pr-3 text-sm text-ink-100 outline-none focus:border-cyan-500"
                                        required
                                    />
                                </div>
                            </label>
                        );
                    })}

                    {error && <p className="text-sm text-rose-500">{error}</p>}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-wave-anim"
                      style={{
                        width: '100%',
                        padding: '13px',
                        marginTop: 16,
                        background: 'linear-gradient(135deg, #0e7490, #6366F1)',
                        border: 'none',
                        borderRadius: 12,
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        fontFamily: "'Space Grotesk', sans-serif",
                        cursor: 'pointer',
                        boxShadow: '0 4px 24px rgba(34,211,238,0.35)',
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                    >
                      <span>{isSubmitting ? 'Creating account...' : 'Create my account'}</span>
                    </motion.button>
                </form>

                <p className="mt-6 text-center text-sm text-ink-350">
                    Already registered? <Link href="/login" className="text-cyan-400 hover:text-cyan-300 ml-1">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
