import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'LOLTracker - Brain Rot Video Platform',
    description: 'Upload videos and generate goofy AI audio overlays. Share and discover brain rot content.',
    keywords: 'video, AI, brain rot, memes, content creation',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.variable}>
                <Providers>
                    <Navbar />
                    <main>{children}</main>
                </Providers>
            </body>
        </html>
    );
}
