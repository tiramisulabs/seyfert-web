import { blogSource } from '@/lib/source';
import {
    DocsPage,
    DocsBody,
    DocsDescription,
    DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function Page(props: {
    params: Promise<{ slug: string[] }>;
}) {
    const params = await props.params;
    const page = blogSource.getPage(params.slug);

    if (!page) {
        notFound();
    }

    const { body: Mdx, toc } = page.data

    return (
        <DocsPage toc={toc} full={page.data.full}>
            <Link
                href="/blog"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground w-fit"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to blog
            </Link>
            <DocsTitle>{page.data.title}</DocsTitle>
            {page.data.description && (
                <DocsDescription>{page.data.description}</DocsDescription>
            )}
            {page.data.date && (
                <p className="text-muted-foreground mb-2 -mt-10">
                    {new Date(page.data.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
            )}
            <DocsBody>
                <Mdx components={{
                    ...defaultMdxComponents,
                }} />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return blogSource.generateParams();
}

export async function generateMetadata(props: {
    params: Promise<{ slug: string[] }>;
}) {
    const params = await props.params;
    const page = blogSource.getPage(params.slug);
    if (!page) notFound();

    return {
        title: page.data.title,
        description: page.data.description,
    };
} 