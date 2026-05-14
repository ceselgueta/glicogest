import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/providers';
import PwaInstallPrompt from '@/components/pwa-install-prompt';
import { ServiceWorkerRegistration } from '@/components/sw-register';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'GlicoGest – Controle de Glicemia Gestacional',
  description: 'Acompanhe sua glicemia gestacional de forma simples, gere relatórios para o obstetra e tenha tudo salvo com segurança.',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icons/icon-192x192.png',
  },
  openGraph: {
    title: 'GlicoGest – Controle de Glicemia Gestacional',
    description: 'Acompanhe sua glicemia gestacional de forma simples, gere relatórios para o obstetra e tenha tudo salvo com segurança.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GlicoGest',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <Toaster position="top-right" />
          {children}
          <PwaInstallPrompt />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
