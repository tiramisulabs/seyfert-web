import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { codeToTokens } from 'shiki';
import type { ThemeRegistrationAny } from 'shiki/types';
import { Box, ExternalLink, Wrench } from 'lucide-react';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { config } from '@/app.config';
import { ApiEntryFilter } from '@/components/docs/api-entry-filter';
import { TocRail } from '@/components/docs/toc-rail';
import dacezuTheme from '@/dacezu.json';
import {
  apiEntries,
  apiPackage,
  type ApiDocTag,
  type ApiEntry,
  type ApiEntryDetail,
  type ApiMember,
  type ApiKind,
  type ApiPrivateType,
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
  const { detailForSlug } = await import('@/lib/api-reference/details');
  return detailForSlug(entry.slug, entry.kind);
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

function githubSourceUrl(source: string) {
  if (!source.startsWith(`${apiPackage.name}/lib/`)) {
    return `https://github.com/${config.repository}`;
  }

  const implementationPath = source
    .replace(`${apiPackage.name}/lib/`, 'src/')
    .replace(/\.d\.ts$/, '.ts');

  return `https://github.com/${config.repository}/blob/main/${implementationPath}`;
}

function displaySourcePath(source: string) {
  return source.startsWith(`${apiPackage.name}/`)
    ? source.slice(apiPackage.name.length + 1)
    : source;
}

function summaryFor(entry: ApiEntry) {
  return entry.summary || `${apiKindSingleLabel[entry.kind]} · ${apiPackage.name} ${apiPackage.version}`;
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
      {entry.summary && (
        <span className="line-clamp-2 text-xs leading-5 text-fd-muted-foreground">
          {entry.summary}
        </span>
      )}
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
        <div className="flex shrink-0 items-center gap-1.5">
          <KindBadge kind={kind} />
          <span
            className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-fd-border bg-fd-secondary px-1.5 text-[11px] font-semibold tabular-nums text-fd-foreground"
            aria-label={`${entries.length} ${apiKindLabel[kind].toLowerCase()}`}
          >
            {entries.length}
          </span>
        </div>
      </div>
      {preview.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {preview.map((entry) => (
            <code
              key={entry.slug}
              className="rounded-md bg-fd-secondary px-1.5 py-0.5 text-[11px] text-fd-foreground/75"
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
        <h2 className="text-base font-semibold text-fd-foreground">Browse by type</h2>
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
        <h2 className="text-base font-semibold text-fd-foreground">
          {apiKindLabel[kind]}
        </h2>
        <ApiEntryFilter
          label={apiKindLabel[kind]}
          entries={entries.map((entry) => ({
            name: entry.name,
            slug: entry.slug,
            kind: entry.kind,
            summary: entry.summary,
          }))}
        />
      </section>
    </div>
  );
}

function SourceLine({ entry }: { entry: ApiEntryDetail }) {
  const sourceUrl = githubSourceUrl(entry.source);
  const sourcePath = displaySourcePath(entry.source);

  return (
    <div className="not-prose flex min-w-0 flex-wrap items-center gap-2 text-xs text-fd-muted-foreground">
      <a
        href={`https://github.com/${config.repository}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-sm transition-colors hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
      >
        {apiPackage.name}
      </a>
      <span aria-hidden>/</span>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md bg-fd-secondary px-1.5 py-0.5 font-mono transition-colors hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
      >
        <span className="min-w-0 break-all">{sourcePath}</span>
        <ExternalLink className="size-3 shrink-0" aria-hidden />
      </a>
    </div>
  );
}

const docTagLabel: Record<string, string> = {
  deprecated: 'Deprecated',
  example: 'Examples',
  param: 'Parameters',
  returns: 'Returns',
  return: 'Returns',
  link: 'Links',
};

function tagTextParts(text: string) {
  const match = text.match(/^([^\s-]+)\s*-?\s*(.*)$/);

  if (!match) {
    return {
      name: undefined,
      description: text,
    };
  }

  return {
    name: match[1],
    description: match[2] || '',
  };
}

function tagTitle(name: string) {
  return docTagLabel[name] ?? `@${name}`;
}

function linkTagParts(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/https?:\/\/[^\s)]+/);

  if (!match) return undefined;

  const href = match[0];
  const label = trimmed
    .replace(href, '')
    .replace(/^[-:]\s*/, '')
    .trim();

  return {
    href,
    label: label || href,
  };
}

function codeExampleParts(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```([\w-]+)?[^\n]*\n([\s\S]*?)\n?```$/);

  if (!fenced) {
    return {
      code: trimmed,
      lang: 'ts',
    };
  }

  const lang = fenced[1] === 'typescript'
    ? 'ts'
    : fenced[1] === 'javascript'
      ? 'js'
      : fenced[1] || 'ts';

  return {
    code: fenced[2].trimEnd(),
    lang,
  };
}

type IndexedDocTag = ApiDocTag & {
  key: string;
};

function tagKeyHash(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

function indexedDocTags(tags: ApiDocTag[]): IndexedDocTag[] {
  const counts = new Map<string, number>();
  const indexedTags: IndexedDocTag[] = [];

  for (const tag of tags) {
    if (!tag.name && !tag.text) continue;

    const baseKey = `${tag.name}:${tag.text}`;
    const count = counts.get(baseKey) ?? 0;
    counts.set(baseKey, count + 1);
    const hash = tagKeyHash(baseKey);

    indexedTags.push({
      ...tag,
      key: count === 0 ? `${tag.name}-${hash}` : `${tag.name}-${hash}-${count}`,
    });
  }

  return indexedTags;
}

function DocTagHeading({
  children,
  level = 3,
}: {
  children: ReactNode;
  level?: 2 | 3;
}) {
  return (
    <div
      role="heading"
      aria-level={level}
      className="text-sm font-semibold leading-5 text-fd-foreground"
    >
      {children}
    </div>
  );
}

function DocTags({
  compact = false,
  tags,
}: {
  compact?: boolean;
  tags: ApiDocTag[];
}) {
  const visibleTags = indexedDocTags(tags);
  if (visibleTags.length === 0) return null;

  const deprecatedTags = visibleTags.filter((tag) => tag.name === 'deprecated');
  const paramTags = visibleTags.filter((tag) => tag.name === 'param');
  const returnTags = visibleTags.filter((tag) => tag.name === 'returns' || tag.name === 'return');
  const exampleTags = visibleTags.filter((tag) => tag.name === 'example');
  const linkTags = visibleTags.filter((tag) => tag.name === 'link');
  const otherTags = visibleTags.filter(
    (tag) => !['deprecated', 'param', 'returns', 'return', 'example', 'link'].includes(tag.name),
  );

  return (
    <section
      id={compact ? undefined : 'jsdoc'}
      className={
        compact
          ? 'not-prose flex flex-col gap-2 rounded-md border border-fd-border bg-fd-secondary/20 px-3 py-2.5'
          : 'not-prose flex flex-col gap-3 rounded-lg border border-fd-border bg-fd-background p-3'
      }
    >
      {!compact && (
        <DocTagHeading level={2}>JSDoc</DocTagHeading>
      )}

      {deprecatedTags.map((tag) => (
        <div
          key={tag.key}
          className="rounded-md border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
        >
          <strong className="font-semibold">{tagTitle(tag.name)}</strong>
          {tag.text && <p className="mt-1 leading-5">{tag.text}</p>}
        </div>
      ))}

      {paramTags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <DocTagHeading>Parameters</DocTagHeading>
          <dl className="grid gap-1">
            {paramTags.map((tag) => {
              const parts = tagTextParts(tag.text);

              return (
                <div key={tag.key} className="grid gap-1 text-sm sm:grid-cols-[minmax(7rem,12rem)_1fr]">
                  <dt>
                    {parts.name ? (
                      <code className="rounded-md bg-fd-secondary px-1.5 py-0.5 text-xs text-fd-foreground">
                        {parts.name}
                      </code>
                    ) : (
                      <span className="text-fd-muted-foreground">parameter</span>
                    )}
                  </dt>
                  <dd className="leading-5 text-fd-muted-foreground">{parts.description}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      {returnTags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <DocTagHeading>Returns</DocTagHeading>
          {returnTags.map((tag) => (
            <p key={tag.key} className="text-sm leading-5 text-fd-muted-foreground">
              {tag.text}
            </p>
          ))}
        </div>
      )}

      {exampleTags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <DocTagHeading>Examples</DocTagHeading>
          {exampleTags.map((tag) => {
            const example = codeExampleParts(tag.text);

            return (
              <ServerCodeBlock
                key={tag.key}
                code={example.code}
                lang={example.lang}
                codeblock={{ className: 'my-0' }}
              />
            );
          })}
        </div>
      )}

      {linkTags.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <DocTagHeading>Links</DocTagHeading>
          <div className="flex flex-col gap-1">
            {linkTags.map((tag) => {
              const link = linkTagParts(tag.text);

              if (!link) {
                return (
                  <span
                    key={tag.key}
                    className="text-sm leading-5 text-fd-muted-foreground"
                  >
                    {tag.text}
                  </span>
                );
              }

              return (
                <a
                  key={tag.key}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 rounded-sm text-sm font-medium leading-5 text-sky-600 underline-offset-4 transition-colors hover:text-sky-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring dark:text-sky-300 dark:hover:text-sky-200"
                >
                  <span className="min-w-0 break-all">{link.label}</span>
                  <ExternalLink className="size-3.5 shrink-0 text-current" aria-hidden />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {otherTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {otherTags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 rounded-md bg-fd-secondary px-2 py-1 text-xs text-fd-muted-foreground"
            >
              <strong className="font-medium text-fd-foreground">@{tag.name}</strong>
              {tag.text}
            </span>
          ))}
        </div>
      )}
    </section>
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

type CodeLinkTarget = {
  href: string;
  memberName?: string;
  title?: string;
};

function memberAnchorPart(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, '-');
}

function memberAnchorId(kind: string, name: string) {
  return `member-${memberAnchorPart(kind)}-${memberAnchorPart(name)}`;
}

function privateTypeId(type: Pick<ApiPrivateType, 'name'>) {
  return `private-type-${memberAnchorPart(type.name)}`;
}

function codeLinkTargets(code: string, privateTypes: ApiPrivateType[] = []) {
  const targets = new Map<string, CodeLinkTarget>();
  const indexedAccessPattern =
    /\b([A-Za-z_$][\w$]*)\s*\[\s*["']([^"']+)["']\s*\]/g;

  for (const privateType of privateTypes) {
    targets.set(privateType.name, {
      href: `#${privateTypeId(privateType)}`,
      title: `Open ${privateType.name}`,
    });
  }

  for (const match of code.matchAll(indexedAccessPattern)) {
    const [, typeName, memberName] = match;
    const entry = linkedEntryForToken(typeName);
    if (!entry || targets.has(typeName)) continue;

    targets.set(typeName, {
      href: `${entryHref(entry)}#${memberAnchorId('Property', memberName)}`,
      memberName,
      title: `Open ${entry.name}.${memberName}`,
    });
  }

  return targets;
}

function linkedTargetForToken(
  token: string,
  memberTargets: Map<string, CodeLinkTarget>,
): CodeLinkTarget | undefined {
  const memberTarget = memberTargets.get(token);
  if (memberTarget) return memberTarget;

  const linkedEntry = linkedEntryForToken(token);
  if (!linkedEntry) return undefined;

  return {
    href: entryHref(linkedEntry),
    title: linkedEntry.name === token ? undefined : `Open ${linkedEntry.name}`,
  };
}

function CodeToken({
  children,
  highlightName,
  memberTargets,
  style,
}: {
  children: string;
  highlightName?: string;
  memberTargets: Map<string, CodeLinkTarget>;
  style: ShikiStyle;
}) {
  if (/^\s+$/.test(children)) return children;

  const linkedTarget = linkedTargetForToken(children, memberTargets);
  if (linkedTarget) {
    const isMemberTarget = Boolean(linkedTarget.memberName);

    return (
      <Link
        aria-label={linkedTarget.title}
        href={linkedTarget.href}
        prefetch={false}
        className={
          isMemberTarget
            ? 'rounded-sm border-b border-dotted border-sky-500/70 bg-sky-500/10 px-0.5 text-(--shiki-light) underline-offset-4 hover:bg-sky-500/15 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring dark:border-sky-300/60 dark:bg-sky-300/10 dark:text-(--shiki-dark) dark:hover:bg-sky-300/15'
            : 'rounded-sm text-(--shiki-light) underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring dark:text-(--shiki-dark)'
        }
        style={style}
        title={linkedTarget.title}
      >
        {children}
        {isMemberTarget && (
          <span
            aria-hidden
            className="ml-0.5 align-super text-[9px] font-bold leading-none text-sky-600 dark:text-sky-300"
          >
            #
          </span>
        )}
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
  memberTargets,
}: {
  highlightName?: string;
  lines: ApiCodeToken[][];
  memberTargets: Map<string, CodeLinkTarget>;
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
              memberTargets={memberTargets}
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
  privateTypes,
}: {
  children: string;
  highlightName?: string;
  privateTypes?: ApiPrivateType[];
}) {
  const memberTargets = codeLinkTargets(children, privateTypes);
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
      className="shiki not-prose overflow-x-auto rounded-lg border border-fd-border bg-(--shiki-light-bg) py-4 text-[13px] leading-6 shadow-sm whitespace-pre-wrap [overflow-wrap:anywhere] dark:bg-(--shiki-dark-bg)"
      style={style}
    >
      <code className="block">
        <HighlightedCode
          highlightName={highlightName}
          lines={highlighted.tokens}
          memberTargets={memberTargets}
        />
      </code>
    </pre>
  );
}

type IndexedMember = ApiMember & {
  anchorId?: string;
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
  return member.anchorId ?? `member-${member.kind}-${member.name}-${member.index}`.replace(
    /[^A-Za-z0-9_-]/g,
    '-',
  );
}

function memberAnchorKey(member: Pick<ApiMember, 'kind' | 'name'>) {
  return `${member.kind}:${member.name}`;
}

function memberHref(member: IndexedMember) {
  return `#${memberId(member)}`;
}

function memberGroups(entry: ApiEntryDetail) {
  const groups = {
    properties: [] as IndexedMember[],
    methods: [] as IndexedMember[],
    other: [] as IndexedMember[],
  };
  const memberCounts = new Map<string, number>();

  for (const member of entry.members) {
    const key = memberAnchorKey(member);
    memberCounts.set(key, (memberCounts.get(key) ?? 0) + 1);
  }

  entry.members.forEach((member, index) => {
    const key = memberAnchorKey(member);
    const item = {
      ...member,
      anchorId:
        memberCounts.get(key) === 1
          ? memberAnchorId(member.kind, member.name)
          : undefined,
      index,
    };

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
              href={memberHref(member)}
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
        icon={<Wrench className="size-5 text-amber-600 dark:text-amber-300" aria-hidden />}
        members={groups.properties}
        title="Properties"
      />
      <MemberOverviewCard
        icon={<Box className="size-5 text-indigo-600 dark:text-indigo-300" aria-hidden />}
        members={groups.methods}
        title="Methods"
      />
    </div>
  );
}

type MemberTone = 'property' | 'method' | 'other';

const memberToneStyles: Record<MemberTone, string> = {
  property: 'border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-200',
  method: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-700 dark:text-indigo-200',
  other: 'border-fd-border bg-fd-secondary text-fd-muted-foreground',
};

// The section heading already says Properties/Methods, so only badge a member
// when its kind adds a distinction (Constructor, Getter, Setter, signatures…).
const memberDefaultKind: Record<MemberTone, string> = {
  property: 'Property',
  method: 'Method',
  other: '',
};

function MemberDetailList({
  members,
  privateTypes,
  tone = 'other',
}: {
  members: IndexedMember[];
  privateTypes: ApiPrivateType[];
  tone?: MemberTone;
}) {
  if (members.length === 0) return null;

  return (
    <div className="not-prose divide-y divide-fd-border rounded-lg border border-fd-border">
      {members.map((member) => (
        <article id={memberId(member)} key={memberId(member)} className="scroll-mt-24 space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={memberHref(member)}
              className="group/anchor inline-flex items-center gap-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              <code className="text-sm font-semibold text-fd-foreground">
                {member.name}
              </code>
              <span
                aria-hidden
                className="text-fd-muted-foreground opacity-0 transition-opacity group-hover/anchor:opacity-100"
              >
                #
              </span>
            </a>
            {member.kind !== memberDefaultKind[tone] && (
              <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${memberToneStyles[tone]}`}>
                {member.kind}
              </span>
            )}
          </div>
          <CodePanel highlightName={member.name} privateTypes={privateTypes}>
            {member.signature}
          </CodePanel>
          {member.summary && (
            <p className="text-sm leading-6 text-fd-muted-foreground">{member.summary}</p>
          )}
          <DocTags compact tags={member.tags} />
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
          <MemberDetailList
            members={groups.properties}
            privateTypes={entry.privateTypes}
            tone="property"
          />
        </section>
      )}
      {groups.methods.length > 0 && (
        <section id="methods" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Methods</h2>
          <MemberDetailList
            members={groups.methods}
            privateTypes={entry.privateTypes}
            tone="method"
          />
        </section>
      )}
      {groups.other.length > 0 && (
        <section id="other-members" className="space-y-3">
          <h2 className="text-base font-semibold text-fd-foreground">Other Members</h2>
          <MemberDetailList
            members={groups.other}
            privateTypes={entry.privateTypes}
            tone="other"
          />
        </section>
      )}
    </div>
  );
}

function ApiBreadcrumb({ entry }: { entry: ApiEntryDetail }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-fd-muted-foreground"
    >
      <Link
        href="/docs/api"
        className="rounded-sm transition-colors hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
      >
        API
      </Link>
      <span aria-hidden className="text-fd-border">/</span>
      <Link
        href={kindHref(entry.kind)}
        className="rounded-sm transition-colors hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
      >
        {apiKindLabel[entry.kind]}
      </Link>
      <span aria-hidden className="text-fd-border">/</span>
      <span className="truncate text-fd-foreground">{entry.name}</span>
    </nav>
  );
}

function PrivateTypes({ privateTypes }: { privateTypes: ApiPrivateType[] }) {
  if (privateTypes.length === 0) return null;

  return (
    <section id="private-types" className="space-y-3">
      <h2 className="text-base font-semibold text-fd-foreground">Private types</h2>
      <div className="space-y-2">
        {privateTypes.map((privateType) => (
          <details
            key={privateType.name}
            id={privateTypeId(privateType)}
            className="scroll-mt-24 rounded-lg border border-fd-border bg-fd-background"
          >
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-fd-foreground marker:text-fd-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <code>{privateType.name}</code>
                <span className="rounded-md border border-fd-border px-1.5 py-0.5 text-[11px] font-medium text-fd-muted-foreground">
                  {privateType.kind}
                </span>
              </span>
            </summary>
            <div className="border-t border-fd-border p-4">
              <CodePanel privateTypes={privateTypes}>
                {privateType.signature}
              </CodePanel>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function MixinTooltip() {
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label="What are mixins?"
        className="inline-flex size-5 items-center justify-center rounded-full border border-fd-border bg-fd-secondary text-[11px] font-semibold text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-md border border-fd-border bg-fd-popover px-3 py-2 text-xs leading-5 text-fd-popover-foreground shadow-lg group-hover:block group-focus-within:block"
      >
        Mixins are helper types merged into this class by TypeScript declarations;
        their members are included even when the class only shows an extends clause.
      </span>
    </span>
  );
}

function signatureCode(entry: ApiEntryDetail) {
  if (entry.mixins.length === 0) return entry.signature;

  return `@Mixins(${entry.mixins.join(', ')})\n${entry.signature}`;
}

function ApiDetail({ entry }: { entry: ApiEntryDetail }) {
  return (
    <div className="not-prose space-y-8">
      <div className="space-y-3">
        <ApiBreadcrumb entry={entry} />
        <SourceLine entry={entry} />
      </div>

      <section id="signature" className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-fd-foreground">Signature</h2>
          {entry.mixins.length > 0 && <MixinTooltip />}
        </div>
        <CodePanel highlightName={entry.name} privateTypes={entry.privateTypes}>
          {signatureCode(entry)}
        </CodePanel>
      </section>

      <PrivateTypes privateTypes={entry.privateTypes} />

      <DocTags tags={entry.tags} />

      <MemberOverview entry={entry} />

      <MemberSections entry={entry} />
    </div>
  );
}

function entryTocItems(entry: ApiEntryDetail) {
  const groups = memberGroups(entry);

  return [
    { title: 'Signature', url: '#signature' },
    ...(entry.privateTypes.length > 0 ? [{ title: 'Private types', url: '#private-types' }] : []),
    ...(entry.tags.length > 0 ? [{ title: 'JSDoc', url: '#jsdoc' }] : []),
    { title: 'Members', url: '#members' },
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
    description = entry.summary ?? '';
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
      breadcrumb={target.type === 'entry' ? { enabled: false } : undefined}
      tableOfContent={{ component: <ApiToc title={title} items={tocItems} /> }}
    >
      <DocsTitle
        id="_top"
        className="scroll-mt-24 max-w-full text-balance text-[2.35rem] font-bold leading-[1.1] [overflow-wrap:anywhere]"
      >
        {title}
      </DocsTitle>
      {description && (
        <DocsDescription className="mt-3 text-[1.0625rem] leading-relaxed text-fd-foreground/70">
          {description}
        </DocsDescription>
      )}
      <DocsBody>{body}</DocsBody>
    </DocsPage>
  );
}
