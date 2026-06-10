export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#0a0b14' }}>
            {/* Glow orbs matching datapulse_login_page.html reference */}
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', opacity: 0.25,
                width: 320, height: 320, background: '#6c47ff', top: -80, left: -60,
                animation: 'drift 12s ease-in-out infinite alternate',
                animationDelay: '0s', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', opacity: 0.25,
                width: 260, height: 260, background: '#a855f7', bottom: -60, right: 60,
                animation: 'drift 12s ease-in-out infinite alternate',
                animationDelay: '-5s', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', opacity: 0.25,
                width: 200, height: 200, background: '#3b5bdb', top: '50%', left: '38%',
                animation: 'drift 12s ease-in-out infinite alternate',
                animationDelay: '-3s', pointerEvents: 'none',
            }} />
            {/* Dot grid overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(rgba(108,71,255,0.25) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                opacity: 0.35,
                pointerEvents: 'none',
            }} />
            <style>{`
                @keyframes drift {
                    from { transform: translate(0, 0) scale(1); }
                    to { transform: translate(30px, 20px) scale(1.08); }
                }
            `}</style>
            <div className="relative z-10 w-full flex items-center justify-center">
                {children}
            </div>
        </main>
    );
}
