import { blogSource } from '@/lib/source';
import { DocsBody } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Callout } from '@/components/docs/callout';
import { MdxLink } from '@/components/docs/mdx-link';
import { TocRail } from '@/components/docs/toc-rail';
import { parseBlogTitle } from '@/lib/blog';

export default async function Page(props: {
    params: Promise<{ slug: string[] }>;
}) {
    const params = await props.params;
    const page = blogSource.getPage(params.slug);

    if (!page) {
        notFound();
    }

    const { body: Mdx, toc } = page.data;
    const { version, clean } = parseBlogTitle(page.data.title);
    const tocItems = [{ title: clean, url: '#_top', depth: 2 }, ...toc];

    return (
        <div className="seyfert-docs" style={{ gridColumn: '1 / -1' }}>
            <div className="mx-auto flex max-w-6xl gap-10 px-4 py-14 sm:px-6">
                <article className="min-w-0 flex-1">
                    <Link
                        href="/blog"
                        className="flex w-fit items-center gap-1 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                    >
                        <ChevronLeft className="size-4" />
                        Back to blog
                    </Link>

                    <div className="mt-7 font-mono text-xs text-neutral-500">
                        // release notes
                    </div>
                    <div className="mb-4 mt-2 flex flex-wrap items-center gap-3">
                        {version && (
                            <span className="inline-flex items-center rounded-md border border-fd-border bg-fd-secondary/60 px-2 py-0.5 font-mono text-xs font-medium text-fd-foreground">
                                {version}
                            </span>
                        )}
                        {page.data.date && (
                            <span className="text-sm text-fd-muted-foreground">
                                {new Date(page.data.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    timeZone: 'UTC',
                                })}
                            </span>
                        )}
                    </div>

                    <h1
                        id="_top"
                        className="scroll-mt-24 text-balance text-[2.4rem] font-bold leading-[1.1] tracking-[-0.03em] text-fd-foreground sm:text-[2.6rem]"
                    >
                        {clean}
                    </h1>
                    {page.data.description && (
                        <p className="mt-3 text-[1.0625rem] leading-relaxed text-fd-foreground/70">
                            {page.data.description}
                        </p>
                    )}

                    <DocsBody className="mt-8 border-t border-fd-border pt-8">
                        <Mdx components={{
                            ...defaultMdxComponents,
                            Callout,
                            a: MdxLink,
                        }} />
                    </DocsBody>
                </article>

                <aside className="hidden w-60 shrink-0 xl:block">
                    <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pt-1">
                        <TocRail items={tocItems} />
                    </div>
                </aside>
            </div>
        </div>
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
