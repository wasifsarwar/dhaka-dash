import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'Dhaka Dash — One CNG. Three lanes. Endless chaos.',
  description:
    'An arcade love letter to Dhaka. Dodge traffic, collect cha, and chase your personal best. Built somewhere between Seattle and Doha.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Dhaka Dash',
    description: 'One CNG. Three lanes. Endless chaos.',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1730,
        height: 909,
        alt: 'Dhaka Dash — a green CNG on a vintage Dhaka street poster',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dhaka Dash',
    description: 'One CNG. Three lanes. Endless chaos.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
