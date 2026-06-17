import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { TocRail } from '@/components/docs/toc-rail';
import {
  apiEntries,
  apiPackage,
  type ApiEntry,
  type ApiKind,
} from '@/lib/api-reference/generated';
import {
  apiKindLabel,
  apiKindOrder,
  apiKindSingleLabel,
  apiKindStyles,
} from '@/lib/api-reference/kinds';

const featuredNames = [
  'Client',
  'Command',
  'Declare',
  'CommandContext',
  'ComponentContext',
  'ActionRow',
  'Button',
  'Embed',
  'createEvent',
  'config',
];

const entriesBySlug = new Map<string, ApiEntry>();

for (const entry of apiEntries) {
  entriesBySlug.set(entry.slug, entry);
  entriesBySlug.set(encodeURIComponent(entry.slug), entry);
}

function getApiEntry(apiSlug: string[]) {
  if (apiSlug.length === 0) return undefined;

  return entriesBySlug.get(apiSlug[0]);
}

function entriesByKind(kind: ApiKind) {
  return apiEntries.filter((entry) => entry.kind === kind);
}

function entryHref(entry: ApiEntry) {
  return `/guide/api/${entry.slug}`;
}

function summaryFor(entry: ApiEntry) {
  return entry.summary || `Public ${apiKindSingleLabel[entry.kind].toLowerCase()} exported by ${apiPackage.name}.`;
}

function toc(items: Array<{ title: string; url: string; depth?: number }>) {
  return items.map((item) => ({
    title: item.title,
    url: item.url,
    depth: item.depth ?? 2,
  }));
}

function ApiToc({ items }: { items: Array<{ title: string; url: string; depth?: number }> }) {
  const tocItems = [{ title: 'API Reference', url: '#_top', depth: 2 }, ...toc(items)];

  return (
    <div className="sticky top-16 [grid-area:toc] flex max-h-[calc(100vh-4rem)] w-(--fd-toc-width) flex-col self-start overflow-y-auto pt-12 pe-4 pb-2 max-xl:hidden">
      <TocRail items={tocItems} />
    </div>
  );
}

function KindBadge({ kind }: { kind: ApiKind }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-semibold ${apiKindStyles[kind].badge}`}>
      {apiKindSingleLabel[kind]}
    </span>
  );
}

function EntryRow({ entry }: { entry: ApiEntry }) {
  return (
    <Link
      href={entryHref(entry)}
      className={`group grid gap-1 rounded-lg border border-transparent px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring ${apiKindStyles[entry.kind].rowHover}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`size-1.5 shrink-0 rounded-full ${apiKindStyles[entry.kind].dot}`}
          aria-hidden
        />
        <code className={`truncate text-[13px] font-semibold ${apiKindStyles[entry.kind].name}`}>
          {entry.name}
        </code>
        <KindBadge kind={entry.kind} />
      </span>
      <span className="line-clamp-2 text-xs leading-5 text-fd-muted-foreground">
        {summaryFor(entry)}
      </span>
    </Link>
  );
}

function ApiIndex() {
  const featured = featuredNames
    .flatMap((name) => {
      const entry = apiEntries.find((candidate) => candidate.name === name);
      return entry ? [entry] : [];
    });

  return (
    <div className="not-prose space-y-8">
      <section
        id="overview"
        className="rounded-lg border border-fd-border bg-fd-secondary/30 p-4"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-fd-muted-foreground">
          <span>
            <strong className="font-semibold text-fd-foreground">{apiEntries.length}</strong>{' '}
            exports
          </span>
          <span aria-hidden>/</span>
          <span>
            <strong className="font-semibold text-fd-foreground">{apiPackage.name}</strong>{' '}
            {apiPackage.version}
          </span>
          <span aria-hidden>/</span>
          <span>generated from TypeScript declarations</span>
        </div>
      </section>

      {featured.length > 0 && (
        <section id="featured" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Featured exports</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {featured.map((entry) => (
              <EntryRow key={entry.slug} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {apiKindOrder.map((kind) => {
        const entries = entriesByKind(kind);
        if (entries.length === 0) return null;

        return (
          <section key={kind} id={kind.toLowerCase()} className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-base font-semibold text-fd-foreground">{apiKindLabel[kind]}</h2>
              <span className="text-xs text-fd-muted-foreground">{entries.length}</span>
            </div>
            <div className="grid gap-1 rounded-lg border border-fd-border bg-fd-background p-1">
              {entries.map((entry) => (
                <EntryRow key={entry.slug} entry={entry} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SourceLine({ entry }: { entry: ApiEntry }) {
  return (
    <div className="not-prose flex flex-wrap items-center gap-2 text-xs text-fd-muted-foreground">
      <KindBadge kind={entry.kind} />
      <span>{apiPackage.name}</span>
      <span aria-hidden>/</span>
      <code className="rounded-md bg-fd-secondary px-1.5 py-0.5">{entry.source}</code>
    </div>
  );
}

const codeKeywords = new Set([
  'abstract',
  'as',
  'async',
  'class',
  'const',
  'constructor',
  'declare',
  'enum',
  'export',
  'extends',
  'function',
  'get',
  'implements',
  'import',
  'interface',
  'new',
  'private',
  'protected',
  'public',
  'readonly',
  'set',
  'static',
  'type',
]);

const codeTokenPattern =
  /(\s+|=>|\.{3}|["'`][^"'`]*["'`]|[A-Za-z_$][\w$]*|\d+|[{}()[\]<>.,;:=?&|*/+-])/g;

function CodeToken({
  children,
  highlightName,
  kind,
}: {
  children: string;
  highlightName?: string;
  kind: ApiKind;
}) {
  if (/^\s+$/.test(children)) return children;

  if (children === highlightName) {
    return <span className={apiKindStyles[kind].codeName}>{children}</span>;
  }

  if (codeKeywords.has(children)) {
    return <span className="text-fuchsia-300">{children}</span>;
  }

  if (/^["'`]/.test(children)) {
    return <span className="text-amber-200">{children}</span>;
  }

  if (/^[A-Z]/.test(children)) {
    return <span className="text-sky-200">{children}</span>;
  }

  if (/^\d+$/.test(children)) {
    return <span className="text-amber-200">{children}</span>;
  }

  if (/^[{}()[\]<>.,;:=?&|*/+-]+$/.test(children) || children === '=>') {
    return <span className="text-zinc-500">{children}</span>;
  }

  return children;
}

function HighlightedCode({
  children,
  highlightName,
  kind,
}: {
  children: string;
  highlightName?: string;
  kind: ApiKind;
}) {
  return children
    .split(codeTokenPattern)
    .filter(Boolean)
    .map((part, index) => (
      <CodeToken key={`${part}-${index}`} highlightName={highlightName} kind={kind}>
        {part}
      </CodeToken>
    ));
}

function CodePanel({
  children,
  highlightName,
  kind,
}: {
  children: string;
  highlightName?: string;
  kind: ApiKind;
}) {
  return (
    <pre className="not-prose overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-[13px] leading-6 text-zinc-100 shadow-sm">
      <code className="block min-w-max">
        <HighlightedCode highlightName={highlightName} kind={kind}>
          {children}
        </HighlightedCode>
      </code>
    </pre>
  );
}

function MemberList({ entry }: { entry: ApiEntry }) {
  if (entry.members.length === 0) {
    return (
      <p className="text-sm text-fd-muted-foreground">
        This export does not declare public members in the generated declaration file.
      </p>
    );
  }

  return (
    <div className="not-prose divide-y divide-fd-border rounded-lg border border-fd-border">
      {entry.members.map((member, index) => (
        <article key={`${member.name}-${index}`} className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <code className={`text-sm font-semibold ${apiKindStyles[entry.kind].name}`}>
              {member.name}
            </code>
            <span className="rounded-md bg-fd-secondary px-1.5 py-0.5 text-[11px] font-medium text-fd-muted-foreground">
              {member.kind}
            </span>
          </div>
          {member.summary && (
            <p className="text-sm leading-6 text-fd-muted-foreground">{member.summary}</p>
          )}
          <CodePanel highlightName={member.name} kind={entry.kind}>
            {member.signature}
          </CodePanel>
        </article>
      ))}
    </div>
  );
}

function ApiDetail({ entry }: { entry: ApiEntry }) {
  return (
    <div className="not-prose space-y-8">
      <SourceLine entry={entry} />

      <section id="signature" className="space-y-3">
        <h2 className="text-base font-semibold text-fd-foreground">Signature</h2>
        <CodePanel highlightName={entry.name} kind={entry.kind}>
          {entry.signature}
        </CodePanel>
      </section>

      <section id="members" className="space-y-3">
        <h2 className="text-base font-semibold text-fd-foreground">Members</h2>
        <MemberList entry={entry} />
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return [
    { apiSlug: [] },
    ...apiEntries.map((entry) => ({
      apiSlug: [entry.slug],
    })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ apiSlug?: string[] }>;
}): Promise<Metadata> {
  const { apiSlug = [] } = await params;
  const entry = getApiEntry(apiSlug);

  if (!entry) {
    return {
      title: 'API Reference',
      description: `Public TypeScript exports from ${apiPackage.name}.`,
    };
  }

  return {
    title: `${entry.name} ${apiKindSingleLabel[entry.kind]}`,
    description: summaryFor(entry),
  };
}

export default async function ApiPage({
  params,
}: {
  params: Promise<{ apiSlug?: string[] }>;
}) {
  const { apiSlug = [] } = await params;
  const entry = getApiEntry(apiSlug);

  if (apiSlug.length > 0 && !entry) notFound();

  const title = entry ? entry.name : 'API Reference';
  const description = entry
    ? summaryFor(entry)
    : `Public TypeScript exports from ${apiPackage.name} ${apiPackage.version}.`;
  const tocItems = entry
    ? [
        { title: 'Signature', url: '#signature' },
        { title: 'Members', url: '#members' },
      ]
    : [
        { title: 'Overview', url: '#overview' },
        { title: 'Featured exports', url: '#featured' },
        ...apiKindOrder.map((kind) => ({
          title: apiKindLabel[kind],
          url: `#${kind.toLowerCase()}`,
        })),
      ];

  return (
    <DocsPage
      toc={toc(tocItems)}
      full
      tableOfContent={{ component: <ApiToc items={tocItems} /> }}
    >
      <DocsTitle
        id="_top"
        className={`scroll-mt-24 text-balance text-[2.35rem] font-bold leading-[1.1] ${entry ? apiKindStyles[entry.kind].name : ''}`}
      >
        {title}
      </DocsTitle>
      <DocsDescription className="mt-3 text-[1.0625rem] leading-relaxed text-fd-foreground/70">
        {description}
      </DocsDescription>
      <DocsBody>{entry ? <ApiDetail entry={entry} /> : <ApiIndex />}</DocsBody>
    </DocsPage>
  );
}
