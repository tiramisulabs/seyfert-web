import { guideSource } from '@/lib/source';
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { AutoTypeTable } from 'fumadocs-typescript/ui';
import { Callout } from '@/components/docs/callout';
import { MdxLink } from '@/components/docs/mdx-link';
import { TocRail } from '@/components/docs/toc-rail';
export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = guideSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  const tocItems = [
    { title: page.data.title, url: '#_top', depth: 2 },
    ...page.data.toc,
  ];

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} tableOfContent={{
      component: (
        <div className="sticky top-16 [grid-area:toc] flex max-h-[calc(100vh-4rem)] w-(--fd-toc-width) flex-col self-start overflow-y-auto pt-12 pe-4 pb-2 max-xl:hidden">
          <TocRail items={tocItems} />
        </div>
      ),
    }}>
      <DocsTitle id="_top" className="scroll-mt-24 text-balance text-[2.4rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.6rem]">
        {page.data.title}
      </DocsTitle>
      <DocsDescription className="mt-3 text-[1.0625rem] leading-relaxed text-fd-foreground/70">
        {page.data.description}
      </DocsDescription>
      <DocsBody>
        <MDX components={{
          ...defaultMdxComponents,
          AutoTypeTable,
          Callout,
          a: MdxLink,
        }} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return guideSource.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = guideSource.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
