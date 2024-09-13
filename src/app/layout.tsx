import React from 'react';
import { Metadata } from 'next';
import "@/styles/globals.css";
import Particles from '@/components/particles';
import { Poppins } from 'next/font/google';
import Header from '@/components/header';
import { ThemeProvider } from 'next-themes'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
    title: 'My App',
    description: 'A basic Next.js application',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${poppins.className} dark:bg-background-900`}>
                <ThemeProvider attribute='class' enableSystem>
                    <Particles
                        className="fixed inset-0"
                        quantity={300}
                        ease={100}
                        refresh
                    />
                    <Header />
                    <main className="relative max-w-[90rem] mx-auto py-11 px-6 lg:p-8">{children}</main>
                </ThemeProvider>
            </body>
        </html>
    );
}
