import { blogSource } from '@/lib/source';
import type { Metadata } from 'next';
import { DocsPage, DocsBody } from 'fumadocs-ui/page';
import { CalendarIcon } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Blog',
    description: 'Updates, release notes, and news about Seyfert',
};

export default function BlogIndexPage() {
    const pages = blogSource.getPages();
    const sortedPages = [...pages].sort(
        (a, b) =>
            new Date(b.data.date ?? b.file.name).getTime() -
            new Date(a.data.date ?? a.file.name).getTime(),
    )

    return (
        <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-b from-gray-100 to-gray-400 bg-clip-text text-transparent sm:text-6xl mb-6">
                    Blog
                </h1>
                <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                    Updates, release notes, and news about Seyfert
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedPages.map((page) => (
                    <a
                        href={page.url}
                        key={page.url}
                        className="group block overflow-hidden rounded-sm border border-neutral-800 
                            bg-neutral-900 hover:border-gray-600 hover:ring-2 hover:ring-gray-700/50 
                            transition-all duration-200"
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold text-neutral-200 group-hover:text-gray-100 transition-colors">
                                {page.data.title || 'Untitled'}
                            </h2>

                            {(page.data as any).date && (
                                <div className="flex items-center gap-2 text-sm text-neutral-500 mt-2 mb-3">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>
                                        {new Date((page.data as any).date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            )}

                            {page.data.description && (
                                <p className="mt-2 line-clamp-3 text-neutral-400">{page.data.description}</p>
                            )}

                            <div className="mt-4 flex items-center text-gray-400 font-medium group-hover:text-gray-300 transition-colors">
                                Read more
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="ml-1 group-hover:translate-x-1 transition-transform duration-200"
                                >
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
} 