import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import type { PropsWithChildren } from 'react';

import './globals.css';
import { Providers } from './providers';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Oman Sale',
  description: 'Universal listing platform for products, services, jobs, logistics and more.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png'
  }
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={`${cairo.className} font-cairo antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
