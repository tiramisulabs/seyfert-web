import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { codeToTokens } from 'shiki';
import type { ThemeRegistrationAny } from 'shiki/types';
import { Box, Wrench } from 'lucide-react';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { TocRail } from '@/components/docs/toc-rail';
import dacezuTheme from '@/dacezu.json';
import {
  apiEntries,
  apiPackage,
  type ApiEntry,
  type ApiEntryDetail,
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
type ApiCodeToken = {
  content: string;
  color?: string;
  bgColor?: string;
  htmlStyle?: Record<string, string>;
};
type ShikiStyle = CSSProperties & Record<`--${string}`, string | undefined>;

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

const featuredEntries = featuredNames.flatMap((name) => {
  const entry = entriesByName.get(name);
  return entry ? [entry] : [];
});

async function detailFor(entry: ApiEntry) {
  const { apiEntryDetails } = await import('@/lib/api-reference/details');
  const details = apiEntryDetails as Partial<Record<string, ApiEntryDetail>>;

  return details[entry.slug];
}

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
  return `/docs/api/${entry.slug}`;
}

function kindHref(kind: ApiKind) {
  return `/docs/api/${apiKindSlug[kind]}`;
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
      className="group grid gap-1 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-fd-border hover:bg-fd-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
    >
      <span className="flex min-w-0 items-center gap-2">
        <code className="truncate text-[13px] font-semibold text-fd-foreground">
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
      className="group rounded-lg border border-fd-border bg-fd-background p-4 transition-colors hover:bg-fd-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-fd-foreground">
          {apiKindLabel[kind]}
        </h2>
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
  return (
    <div className="not-prose space-y-8">
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

      {featuredEntries.length > 0 && (
        <section id="featured" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Featured exports</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {featuredEntries.map((entry) => (
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
        className="rounded-lg border border-fd-border bg-fd-secondary/30 p-4"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <KindBadge kind={kind} />
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

function SourceLine({ entry }: { entry: ApiEntryDetail }) {
  return (
    <div className="not-prose flex flex-wrap items-center gap-2 text-xs text-fd-muted-foreground">
      <KindBadge kind={entry.kind} />
      <span>{apiPackage.name}</span>
      <span aria-hidden>/</span>
      <code className="rounded-md bg-fd-secondary px-1.5 py-0.5">{entry.source}</code>
    </div>
  );
}

const codeTokenPattern =
  /(\s+|=>|\.{3}|["'`][^"'`]*["'`]|[A-Za-z_$][\w$]*|\d+|[{}()[\]<>.,;:=?&|*/+-])/g;
const codeThemes = {
  light: 'min-light',
  dark: dacezuTheme as ThemeRegistrationAny,
};

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
  style,
}: {
  children: string;
  highlightName?: string;
  style: ShikiStyle;
}) {
  if (/^\s+$/.test(children)) return children;

  const linkedEntry = linkedEntryForToken(children);
  if (linkedEntry) {
    return (
      <Link
        href={entryHref(linkedEntry)}
        prefetch={false}
        className="rounded-sm text-(--shiki-light) underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring dark:text-(--shiki-dark)"
        style={style}
        title={linkedEntry.name === children ? undefined : `Open ${linkedEntry.name}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <span className={children === highlightName ? 'font-semibold' : undefined} style={style}>
      {children}
    </span>
  );
}

function HighlightedCode({
  highlightName,
  lines,
}: {
  highlightName?: string;
  lines: ApiCodeToken[][];
}) {
  return lines.map((line, lineIndex) => (
    <span key={lineIndex} className="line block">
      {line.flatMap((token, tokenIndex) => {
        const style = tokenStyle(token);

        return token.content
          .split(codeTokenPattern)
          .filter(Boolean)
          .map((part, partIndex) => (
            <CodeToken
              key={`${lineIndex}-${tokenIndex}-${partIndex}`}
              highlightName={highlightName}
              style={style}
            >
              {part}
            </CodeToken>
          ));
      })}
    </span>
  ));
}

function shikiValue(value: string | undefined, fallback: string) {
  return value?.split(';')[0] || fallback;
}

function shikiVar(value: string | undefined, name: string, fallback: string) {
  const match = value?.match(new RegExp(`${name}:([^;]+)`));

  return match?.[1] ?? fallback;
}

function tokenStyle(token: ApiCodeToken): ShikiStyle {
  const htmlStyle = token.htmlStyle ?? {};

  return {
    '--shiki-light': htmlStyle.color ?? token.color,
    '--shiki-dark': htmlStyle['--shiki-dark'],
    '--shiki-light-font-style': htmlStyle.fontStyle,
    '--shiki-dark-font-style': htmlStyle['--shiki-dark-font-style'],
  };
}

async function CodePanel({
  children,
  highlightName,
}: {
  children: string;
  highlightName?: string;
}) {
  const highlighted = await codeToTokens(children, {
    lang: 'ts',
    themes: codeThemes,
  });
  const style = {
    '--shiki-light': shikiValue(highlighted.fg, '#24292eff'),
    '--shiki-dark': shikiVar(highlighted.fg, '--shiki-dark', '#bbbbbb'),
    '--shiki-light-bg': shikiValue(highlighted.bg, '#ffffff'),
    '--shiki-dark-bg': shikiVar(highlighted.bg, '--shiki-dark-bg', '#101010'),
  } as ShikiStyle;

  return (
    <pre
      className="shiki not-prose overflow-x-auto rounded-lg border border-fd-border bg-(--shiki-light-bg) py-4 text-[13px] leading-6 shadow-sm dark:bg-(--shiki-dark-bg)"
      style={style}
    >
      <code className="block min-w-max">
        <HighlightedCode highlightName={highlightName} lines={highlighted.tokens} />
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

function memberGroups(entry: ApiEntryDetail) {
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

function MemberOverview({ entry }: { entry: ApiEntryDetail }) {
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

function MemberDetailList({ members }: { members: IndexedMember[] }) {
  if (members.length === 0) return null;

  return (
    <div className="not-prose divide-y divide-fd-border rounded-lg border border-fd-border">
      {members.map((member) => (
        <article id={memberId(member)} key={memberId(member)} className="scroll-mt-24 space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-sm font-semibold text-fd-foreground">
              {member.name}
            </code>
            <span className="rounded-md bg-fd-secondary px-1.5 py-0.5 text-[11px] font-medium text-fd-muted-foreground">
              {member.kind}
            </span>
          </div>
          {member.summary && (
            <p className="text-sm leading-6 text-fd-muted-foreground">{member.summary}</p>
          )}
          <CodePanel highlightName={member.name}>
            {member.signature}
          </CodePanel>
        </article>
      ))}
    </div>
  );
}

function MemberSections({ entry }: { entry: ApiEntryDetail }) {
  if (entry.members.length === 0) {
    return null;
  }

  const groups = memberGroups(entry);

  return (
    <div className="space-y-8">
      {groups.properties.length > 0 && (
        <section id="properties" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Properties</h2>
          <MemberDetailList members={groups.properties} />
        </section>
      )}
      {groups.methods.length > 0 && (
        <section id="methods" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Methods</h2>
          <MemberDetailList members={groups.methods} />
        </section>
      )}
      {groups.other.length > 0 && (
        <section id="other-members" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Other Members</h2>
          <MemberDetailList members={groups.other} />
        </section>
      )}
    </div>
  );
}

function ApiDetail({ entry }: { entry: ApiEntryDetail }) {
  return (
    <div className="not-prose space-y-8">
      <SourceLine entry={entry} />

      <MemberOverview entry={entry} />

      <section id="signature" className="space-y-3">
        <h2 className="text-base font-semibold text-fd-foreground">Signature</h2>
        <CodePanel highlightName={entry.name}>
          {entry.signature}
        </CodePanel>
      </section>

      <MemberSections entry={entry} />
    </div>
  );
}

function entryTocItems(entry: ApiEntryDetail) {
  const groups = memberGroups(entry);

  return [
    { title: 'Members', url: '#members' },
    { title: 'Signature', url: '#signature' },
    ...(groups.properties.length > 0 ? [{ title: 'Properties', url: '#properties' }] : []),
    ...(groups.methods.length > 0 ? [{ title: 'Methods', url: '#methods' }] : []),
    ...(groups.other.length > 0 ? [{ title: 'Other Members', url: '#other-members' }] : []),
  ];
}

export const dynamicParams = true;

export function generateStaticParams() {
  return [
    { apiSlug: [] },
    ...apiKindOrder.map((kind) => ({
      apiSlug: [apiKindSlug[kind]],
    })),
    ...featuredEntries.map((entry) => ({
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

  let title: string;
  let description: string;
  let tocItems: Array<{ title: string; url: string; depth?: number }>;
  let body: ReactNode;

  if (target.type === 'entry') {
    const entry = await detailFor(target.entry);
    if (!entry) notFound();

    title = entry.name;
    description = summaryFor(entry);
    tocItems = entryTocItems(entry);
    body = <ApiDetail entry={entry} />;
  } else if (target.type === 'kind') {
    title = apiKindLabel[target.kind];
    description = `${entriesByKind(target.kind).length} public ${apiKindLabel[target.kind].toLowerCase()} exported by ${apiPackage.name}.`;
    tocItems = [
      { title: 'Overview', url: '#overview' },
      { title: 'Exports', url: '#exports' },
    ];
    body = <ApiKindPage kind={target.kind} />;
  } else {
    title = 'API Reference';
    description = `Public TypeScript exports from ${apiPackage.name} ${apiPackage.version}.`;
    tocItems = [
      { title: 'Browse by type', url: '#types' },
      { title: 'Featured exports', url: '#featured' },
    ];
    body = <ApiIndex />;
  }

  return (
    <DocsPage
      toc={toc(tocItems)}
      full
      tableOfContent={{ component: <ApiToc title={title} items={tocItems} /> }}
    >
      <DocsTitle
        id="_top"
        className="scroll-mt-24 text-balance text-[2.35rem] font-bold leading-[1.1]"
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
