import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { blogSource } from "@/lib/source";
import { parseBlogTitle, versionWatermark, formatBlogDate } from "@/lib/blog";

export const metadata: Metadata = {
    title: "Blog",
    description: "Updates, release notes, and news about Seyfert",
};

export default function BlogIndexPage() {
    const pages = blogSource.getPages();
    const sortedPages = [...pages].sort(
        (a, b) => b.data.date.getTime() - a.data.date.getTime(),
    );

    return (
        <div
            className="blog-index mx-auto max-w-6xl px-4 py-20 sm:px-6"
            style={{ gridColumn: "1 / -1" }}
        >
            <div className="mb-14 text-center">
                <h1 className="mb-5 bg-linear-to-b from-gray-100 to-gray-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
                    Blog
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-neutral-400">
                    Updates, release notes, and news about Seyfert
                </p>
            </div>

            <div className="eyebrow">
                <span>Releases</span>
                <div className="rule" />
                <span>{sortedPages.length}</span>
            </div>

            <div className="blog-bento">
                {sortedPages.map((page, index) => {
                    const { version, clean } = parseBlogTitle(page.data.title);
                    const wm = versionWatermark(version);
                    const isHero = index === 0;
                    const isMajor = version ? /\.0\.0$/.test(version) : false;
                    const size = isHero ? "hero" : isMajor ? "wide" : "sm";

                    return (
                        <a key={page.url} href={page.url} className={`bcard ${size}`}>
                            {wm && <span className="wm">{wm}</span>}
                            <span className="scrim" />
                            <div className="bcontent">
                                <div className="meta">
                                    {version && <span className="badge">{version}</span>}
                                    {isHero && <span className="latest">latest</span>}
                                    <span className="date">{formatBlogDate(page.data.date)}</span>
                                </div>
                                <h2 className="ctitle">{clean}</h2>
                                {page.data.description && (
                                    <p className="cdesc">{page.data.description}</p>
                                )}
                                {isHero && (
                                    <span className="more">
                                        Read more
                                        <ArrowRight />
                                    </span>
                                )}
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
