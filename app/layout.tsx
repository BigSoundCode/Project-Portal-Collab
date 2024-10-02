import '@/app/ui/global.css';
import localFont from 'next/font/local';
import { Providers } from 'app/providers';

const myFont = localFont({
  src: './euclid-flex-4.ttf',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${myFont.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

