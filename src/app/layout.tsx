import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerOrderProvider } from '@/context/CustomerOrderContext';
import { CustomerNav } from '@/components/customer/CustomerNav';
import { PWARegistration } from '@/components/PWARegistration';

export const metadata: Metadata = {
  title: 'ASAP ISEP — Daging Asap & Kabin Kayu Cisarua, Puncak',
  description: 'Restoran daging asap lambat kayu rambutan & penginapan kabin kayu jati di lereng hutan Cisarua Puncak. Reservasi online, menu gramasi fleksibel.',
  manifest: '/manifest.json',
  keywords: ['daging asap', 'restoran puncak', 'kabin cisarua', 'smokehouse indonesia', 'penginapan puncak bogor'],
};

export const viewport: Viewport = {
  themeColor: '#080e0b',
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
        {/* Preconnect for Google Fonts performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-forest-950 text-cream-50 min-h-screen flex flex-col font-sans">
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
