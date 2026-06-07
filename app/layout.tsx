import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: 'DataPulse',
  description: 'SaaS Analytics Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-void-950 text-ink-100 min-h-screen selection:bg-iris-500/30">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
