import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'FreightFlow — Transport Marketplace',
    template: '%s | FreightFlow',
  },
  description:
    'Connect shippers with trusted drivers. Create shipments, receive competitive bids, and move freight with confidence.',
  keywords: ['freight', 'shipping', 'transport', 'logistics', 'marketplace'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
