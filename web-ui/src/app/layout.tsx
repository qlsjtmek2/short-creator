import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Short Creator',
  description: 'Create viral shorts with AI in minutes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased font-[Pretendard]">{children}</body>
    </html>
  );
}
