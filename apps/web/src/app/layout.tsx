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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var k='oman_sale_chunk_reload';function bad(v){var m='';try{m=(v&&(v.message||(v.reason&&v.reason.message)||String(v.reason||v.error||v)))||''}catch(e){}return /Loading chunk|ChunkLoadError|dynamically imported module/i.test(String(m))}function reload(){try{if(sessionStorage.getItem(k)==='1')return;sessionStorage.setItem(k,'1')}catch(e){}location.reload()}window.addEventListener('error',function(e){if(bad(e.error)||bad(e.message))reload()},true);window.addEventListener('unhandledrejection',function(e){if(bad(e.reason))reload()})})();`
          }}
        />
      </head>
      <body className={`${cairo.className} font-cairo antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
