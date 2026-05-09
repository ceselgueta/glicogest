import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'GlicoGest – Controle de Glicemia Gestacional',
  description: 'Acompanhe sua glicemia gestacional de forma simples, gere relatórios para o obstetra e tenha tudo salvo com segurança.',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'GlicoGest – Controle de Glicemia Gestacional',
    description: 'Acompanhe sua glicemia gestacional de forma simples, gere relatórios para o obstetra e tenha tudo salvo com segurança.',
    images: ['/og-image.png'],
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
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <Toaster position="top-right" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
