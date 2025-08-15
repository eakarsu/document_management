import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ApolloWrapper } from '../lib/apollo-wrapper';
import { MuiThemeProvider } from '../components/providers/MuiThemeProvider';
import { AuthProvider } from '../components/providers/AuthProvider';
import { ToastProvider } from '../components/providers/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Document Management System - Enterprise DMS',
  description: 'AI-powered enterprise document management system with advanced search, collaboration, and workflow capabilities.',
  keywords: ['document management', 'enterprise', 'AI', 'collaboration', 'workflow'],
  authors: [{ name: 'Richmond DMS Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Document Management System',
    description: 'Enterprise-grade document management with AI capabilities',
    type: 'website',
    siteName: 'Richmond DMS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1976d2" />
      </head>
      <body className={inter.className}>
        <ApolloWrapper>
          <MuiThemeProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </MuiThemeProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}