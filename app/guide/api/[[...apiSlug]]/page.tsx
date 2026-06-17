import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Box, Wrench } from 'lucide-react';
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
  type ApiMember,
  type ApiKind,
} from '@/lib/api-reference/generated';
import {
  apiKindBySlug,
  apiKindLabel,
  apiKindOrder,
  apiKindSlug,
  apiKindSingleLabel,
  apiKindStyles,
} from '@/lib/api-reference/kinds';

type ApiTarget =
  | { type: 'index' }
  | { type: 'kind'; kind: ApiKind }
  | { type: 'entry'; entry: ApiEntry };

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
const entriesByName = new Map<string, ApiEntry>();

for (const entry of apiEntries) {
  entriesBySlug.set(entry.slug, entry);
  entriesBySlug.set(encodeURIComponent(entry.slug), entry);
  if (!entriesByName.has(entry.name)) {
    entriesByName.set(entry.name, entry);
  }
}

const fallbackTypeNames = [...entriesByName.keys()]
  .filter((name) => name.length >= 4)
  .sort((a, b) => b.length - a.length);

function getApiTarget(apiSlug: string[]): ApiTarget | undefined {
  if (apiSlug.length === 0) return { type: 'index' };

  const slug = apiSlug[0];
  const kind = apiKindBySlug.get(slug);
  if (kind) return { type: 'kind', kind };

  const entry = entriesBySlug.get(slug);
  return entry ? { type: 'entry', entry } : undefined;
}

function entriesByKind(kind: ApiKind) {
  return apiEntries.filter((entry) => entry.kind === kind);
}

function entryHref(entry: ApiEntry) {
  return `/guide/api/${entry.slug}`;
}

function kindHref(kind: ApiKind) {
  return `/guide/api/${apiKindSlug[kind]}`;
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

function ApiToc({
  items,
  title,
}: {
  items: Array<{ title: string; url: string; depth?: number }>;
  title: string;
}) {
  const tocItems = [{ title, url: '#_top', depth: 2 }, ...toc(items)];

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

function ApiKindCard({ kind }: { kind: ApiKind }) {
  const entries = entriesByKind(kind);
  const preview = entries.slice(0, 5);

  return (
    <Link
      href={kindHref(kind)}
      className={`group rounded-lg border border-fd-border bg-fd-background p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring ${apiKindStyles[kind].rowHover}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-fd-foreground">
            {apiKindLabel[kind]}
          </h2>
          <p className="text-xs leading-5 text-fd-muted-foreground">
            {entries.length} public {apiKindLabel[kind].toLowerCase()} exported by{' '}
            {apiPackage.name}.
          </p>
        </div>
        <KindBadge kind={kind} />
      </div>
      {preview.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {preview.map((entry) => (
            <code
              key={entry.slug}
              className="rounded-md bg-fd-secondary px-1.5 py-0.5 text-[11px] text-fd-muted-foreground"
            >
              {entry.name}
            </code>
          ))}
        </div>
      )}
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

      <section id="types" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold text-fd-foreground">Browse by type</h2>
          <span className="text-xs text-fd-muted-foreground">{apiKindOrder.length}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {apiKindOrder.map((kind) => (
            <ApiKindCard key={kind} kind={kind} />
          ))}
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
    </div>
  );
}

function ApiKindPage({ kind }: { kind: ApiKind }) {
  const entries = entriesByKind(kind);

  return (
    <div className="not-prose space-y-6">
      <section
        id="overview"
        className={`rounded-lg border p-4 ${apiKindStyles[kind].badge}`}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <strong className="font-semibold">{entries.length}</strong>
          <span>{apiKindLabel[kind].toLowerCase()}</span>
          <span aria-hidden>/</span>
          <span>{apiPackage.name}</span>
          <span aria-hidden>/</span>
          <span>{apiPackage.version}</span>
        </div>
      </section>

      <section id="exports" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold text-fd-foreground">
            {apiKindLabel[kind]}
          </h2>
          <span className="text-xs text-fd-muted-foreground">{entries.length}</span>
        </div>
        <div className="grid gap-1 rounded-lg border border-fd-border bg-fd-background p-1">
          {entries.map((entry) => (
            <EntryRow key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>
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

function linkedEntryForToken(token: string) {
  const exactEntry = entriesByName.get(token);
  if (exactEntry) return exactEntry;

  if (!token.startsWith('API')) return undefined;

  const localTypeName = token.slice(3);
  return entriesByName.get(
    fallbackTypeNames.find((name) => localTypeName.includes(name)) ?? '',
  );
}

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

  const linkedEntry = linkedEntryForToken(children);
  if (linkedEntry) {
    return (
      <Link
        href={entryHref(linkedEntry)}
        prefetch={false}
        className={`${apiKindStyles[linkedEntry.kind].codeName} rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60`}
        title={linkedEntry.name === children ? undefined : `Open ${linkedEntry.name}`}
      >
        {children}
      </Link>
    );
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

type IndexedMember = ApiMember & {
  index: number;
};

const propertyMemberKinds = new Set(['Property', 'Getter', 'Setter', 'IndexSignature']);
const methodMemberKinds = new Set([
  'Constructor',
  'Method',
  'CallSignature',
  'ConstructSignature',
]);

function memberId(member: IndexedMember) {
  return `member-${member.kind}-${member.name}-${member.index}`.replace(
    /[^A-Za-z0-9_-]/g,
    '-',
  );
}

function memberGroups(entry: ApiEntry) {
  const groups = {
    properties: [] as IndexedMember[],
    methods: [] as IndexedMember[],
    other: [] as IndexedMember[],
  };

  entry.members.forEach((member, index) => {
    const item = { ...member, index };

    if (propertyMemberKinds.has(member.kind)) {
      groups.properties.push(item);
      return;
    }

    if (methodMemberKinds.has(member.kind)) {
      groups.methods.push(item);
      return;
    }

    groups.other.push(item);
  });

  return groups;
}

function MemberOverviewCard({
  icon,
  members,
  title,
}: {
  icon: ReactNode;
  members: IndexedMember[];
  title: string;
}) {
  return (
    <section className="rounded-lg border border-fd-border bg-fd-background">
      <div className="flex items-center justify-between gap-4 rounded-t-lg bg-fd-secondary/60 px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-fd-foreground">
          {icon}
          {title}
        </h2>
        <span className="text-xs text-fd-muted-foreground">{members.length}</span>
      </div>
      {members.length > 0 ? (
        <div className="grid gap-0.5 p-3">
          {members.map((member) => (
            <Link
              key={memberId(member)}
              href={`#${memberId(member)}`}
              className="rounded-md px-2 py-1.5 font-mono text-sm text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              {member.name}
            </Link>
          ))}
        </div>
      ) : (
        <p className="px-4 py-5 text-sm text-fd-muted-foreground">No {title.toLowerCase()}.</p>
      )}
    </section>
  );
}

function MemberOverview({ entry }: { entry: ApiEntry }) {
  const groups = memberGroups(entry);

  if (entry.members.length === 0) {
    return (
      <section
        id="members"
        className="rounded-lg border border-dashed border-fd-border bg-fd-secondary/25 p-4"
      >
        <h2 className="text-base font-semibold text-fd-foreground">Members</h2>
        <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">
          This export does not declare public properties or methods in the generated declaration
          file.
        </p>
      </section>
    );
  }

  return (
    <div id="members" className="grid gap-3 md:grid-cols-2">
      <MemberOverviewCard
        icon={<Wrench className="size-5 text-fd-muted-foreground" aria-hidden />}
        members={groups.properties}
        title="Properties"
      />
      <MemberOverviewCard
        icon={<Box className="size-5 text-fd-muted-foreground" aria-hidden />}
        members={groups.methods}
        title="Methods"
      />
    </div>
  );
}

function MemberDetailList({
  entry,
  members,
}: {
  entry: ApiEntry;
  members: IndexedMember[];
}) {
  if (members.length === 0) return null;

  return (
    <div className="not-prose divide-y divide-fd-border rounded-lg border border-fd-border">
      {members.map((member) => (
        <article id={memberId(member)} key={memberId(member)} className="scroll-mt-24 space-y-2 p-4">
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

function MemberSections({ entry }: { entry: ApiEntry }) {
  if (entry.members.length === 0) {
    return null;
  }

  const groups = memberGroups(entry);

  return (
    <div className="space-y-8">
      {groups.properties.length > 0 && (
        <section id="properties" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Properties</h2>
          <MemberDetailList entry={entry} members={groups.properties} />
        </section>
      )}
      {groups.methods.length > 0 && (
        <section id="methods" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Methods</h2>
          <MemberDetailList entry={entry} members={groups.methods} />
        </section>
      )}
      {groups.other.length > 0 && (
        <section id="other-members" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Other Members</h2>
          <MemberDetailList entry={entry} members={groups.other} />
        </section>
      )}
    </div>
  );
}

function ApiDetail({ entry }: { entry: ApiEntry }) {
  return (
    <div className="not-prose space-y-8">
      <SourceLine entry={entry} />

      <MemberOverview entry={entry} />

      <section id="signature" className="space-y-3">
        <h2 className="text-base font-semibold text-fd-foreground">Signature</h2>
        <CodePanel highlightName={entry.name} kind={entry.kind}>
          {entry.signature}
        </CodePanel>
      </section>

      <MemberSections entry={entry} />
    </div>
  );
}

function entryTocItems(entry: ApiEntry) {
  const groups = memberGroups(entry);

  return [
    { title: 'Members', url: '#members' },
    { title: 'Signature', url: '#signature' },
    ...(groups.properties.length > 0 ? [{ title: 'Properties', url: '#properties' }] : []),
    ...(groups.methods.length > 0 ? [{ title: 'Methods', url: '#methods' }] : []),
    ...(groups.other.length > 0 ? [{ title: 'Other Members', url: '#other-members' }] : []),
  ];
}

export function generateStaticParams() {
  return [
    { apiSlug: [] },
    ...apiKindOrder.map((kind) => ({
      apiSlug: [apiKindSlug[kind]],
    })),
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
  const target = getApiTarget(apiSlug);

  if (!target || target.type === 'index') {
    return {
      title: 'API Reference',
      description: `Public TypeScript exports from ${apiPackage.name}.`,
    };
  }

  if (target.type === 'kind') {
    const count = entriesByKind(target.kind).length;

    return {
      title: `${apiKindLabel[target.kind]} API`,
      description: `${count} public ${apiKindLabel[target.kind].toLowerCase()} exported by ${apiPackage.name}.`,
    };
  }

  const { entry } = target;

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
  const target = getApiTarget(apiSlug);

  if (!target) notFound();

  const title =
    target.type === 'entry'
      ? target.entry.name
      : target.type === 'kind'
        ? apiKindLabel[target.kind]
        : 'API Reference';
  const description =
    target.type === 'entry'
      ? summaryFor(target.entry)
      : target.type === 'kind'
        ? `${entriesByKind(target.kind).length} public ${apiKindLabel[target.kind].toLowerCase()} exported by ${apiPackage.name}.`
        : `Public TypeScript exports from ${apiPackage.name} ${apiPackage.version}.`;
  const tocItems =
    target.type === 'entry'
      ? entryTocItems(target.entry)
      : target.type === 'kind'
        ? [
            { title: 'Overview', url: '#overview' },
            { title: 'Exports', url: '#exports' },
          ]
        : [
            { title: 'Overview', url: '#overview' },
            { title: 'Browse by type', url: '#types' },
            { title: 'Featured exports', url: '#featured' },
          ];
  const titleClass =
    target.type === 'entry'
      ? apiKindStyles[target.entry.kind].name
      : target.type === 'kind'
        ? apiKindStyles[target.kind].name
        : '';
  const body =
    target.type === 'entry' ? (
      <ApiDetail entry={target.entry} />
    ) : target.type === 'kind' ? (
      <ApiKindPage kind={target.kind} />
    ) : (
      <ApiIndex />
    );

  return (
    <DocsPage
      toc={toc(tocItems)}
      full
      tableOfContent={{ component: <ApiToc title={title} items={tocItems} /> }}
    >
      <DocsTitle
        id="_top"
        className={`scroll-mt-24 text-balance text-[2.35rem] font-bold leading-[1.1] ${titleClass}`}
      >
        {title}
      </DocsTitle>
      <DocsDescription className="mt-3 text-[1.0625rem] leading-relaxed text-fd-foreground/70">
        {description}
      </DocsDescription>
      <DocsBody>{body}</DocsBody>
    </DocsPage>
  );
}
