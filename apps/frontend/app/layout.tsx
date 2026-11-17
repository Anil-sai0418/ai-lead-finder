import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Lead Finder | Discovery & Classification Platform',
  description: 'Enterprise AI-powered software development lead discovery and deterministic classification platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
