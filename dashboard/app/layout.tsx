import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Nav from '@/components/Nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YNLED LiveView',
  description: 'Camera stream management — You Need LED LLC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }}
        />
      </body>
    </html>
  );
}
