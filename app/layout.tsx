import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space',
});

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
      <body className={`font-sans antialiased min-h-screen selection:bg-iris-500/30 ${spaceGrotesk.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
