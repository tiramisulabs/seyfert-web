import { blogSource } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { GeistSans } from "geist/font/sans";
import type { Metadata } from 'next';
import { baseOptions } from '../../layout.config';

export const metadata: Metadata = {
    title: {
        template: '%s | Seyfert Blog',
        default: 'Seyfert Blog',
    },
    description: 'Updates, release notes, and news about Seyfert',
   openGraph: {
    images: {
        type: 'image/png',
        url: './banner.png'
    }
   }
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className={GeistSans.className}>
        <DocsLayout
            tree={blogSource.pageTree}
            {...baseOptions}
            sidebar={{
                className: 'hidden'
            }}
        >
            {children}
        </DocsLayout>
    </div>;
} 