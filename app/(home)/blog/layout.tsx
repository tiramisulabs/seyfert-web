import type { Metadata } from 'next';

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
    return <div className="min-w-0 w-full">{children}</div>;
}
