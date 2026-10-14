import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerOrderProvider } from '@/context/CustomerOrderContext';
import { CustomerNav } from '@/components/customer/CustomerNav';
import { PWARegistration } from '@/components/PWARegistration';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'ASAP ISEP — Daging Asap & Lodging',
  description: 'Sistem Terintegrasi Smokehouse, Penginapan Kabin Kayu, POS, Inventori Daging & Reservasi Tamu',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0c0a09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-forest-950 text-stone-100 min-h-screen flex flex-col font-sans selection:bg-emerald-600 selection:text-white`}>
        <AuthProvider>
          <CustomerOrderProvider>
            <PWARegistration />
            <CustomerNav />
            <div className="flex-1 flex flex-col">{children}</div>
          </CustomerOrderProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
