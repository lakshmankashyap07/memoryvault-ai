import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'MemoryVault — Some people leave the place, never the memories',
  description:
    'A private digital space for preserving the people, moments, and memories that matter. Store photos, videos, voice recordings, messages, and timeline milestones with unique Memory IDs and QR codes.',
  keywords: [
    'MemoryVault',
    'digital scrapbook',
    'memory preservation',
    'friendship memories',
    'college memories',
    'QR code memories',
    'private digital space',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
