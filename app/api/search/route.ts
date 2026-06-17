import { guideSource } from '@/lib/source';
import { apiEntries, apiPackage, type ApiEntry } from '@/lib/api-reference/generated';
import { apiSearchEntries } from '@/lib/api-reference/search';
import {
  apiKindLabel,
  apiKindOrder,
  apiKindSingleLabel,
  apiKindSlug,
} from '@/lib/api-reference/kinds';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import { findPath, type Node } from 'fumadocs-core/page-tree';
import {
  createSearchAPI,
  type AdvancedIndex,
} from 'fumadocs-core/search/server';

type GuidePage = ReturnType<typeof guideSource.getPages>[number];
type GuidePageData = GuidePage['data'] & {
  structuredData?: StructuredData | (() => Promise<StructuredData>);
  load?: () => Promise<{ structuredData?: StructuredData }>;
};
type SearchResult = {
  id: string;
  url: string;
  type: 'page' | 'heading' | 'text';
  content: unknown;
  breadcrumbs?: unknown[];
};

const apiEntryByUrl = new Map(apiEntries.map((entry) => [apiEntryUrl(entry), entry]));
const apiEntryByName = new Map(apiEntries.map((entry) => [entry.name.toLowerCase(), entry]));
const apiMatchCandidates = [
  'api reference',
  ...apiKindOrder.flatMap((kind) => [
    apiKindLabel[kind],
    apiKindSingleLabel[kind],
    apiKindSlug[kind],
  ]),
  ...apiEntries.map((entry) => `${entry.name} ${entry.slug}`),
].map((candidate) => candidate.toLowerCase());
const apiSearchContentBySlug = new Map(
  apiSearchEntries.map((entry) => [entry.slug, entry.content]),
);
const maxSearchLimit = 50;
const maxSearchQueryLength = 160;

function text(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

async function structuredDataFor(page: GuidePage) {
  const data = page.data as GuidePageData;

  if (typeof data.structuredData === 'function') return data.structuredData();
  if (data.structuredData) return data.structuredData;

  const loaded = await data.load?.();
  if (loaded?.structuredData) return loaded.structuredData;

  return {
    headings: [],
    contents: [],
  };
}

function breadcrumbsFor(url: string) {
  const path = findPath(
    guideSource.pageTree.children,
    (node: Node) => node.type === 'page' && node.url === url,
  );

  if (!path) return ['Guide'];

  return ['Guide', ...path.slice(0, -1).flatMap((node) => text(node.name) ?? [])];
}

async function guideIndex(page: GuidePage): Promise<AdvancedIndex> {
  return {
    id: page.url,
    title: text(page.data.title) ?? page.url.split('/').at(-1) ?? page.url,
    description: text(page.data.description),
    breadcrumbs: breadcrumbsFor(page.url),
    url: page.url,
    structuredData: await structuredDataFor(page),
  };
}

function apiEntryUrl(entry: ApiEntry) {
  return `/docs/api/${entry.slug}`;
}

function apiStructuredData(content: string): StructuredData {
  return {
    headings: [],
    contents: [{ heading: undefined, content }],
  };
}

function apiEntryIndex(entry: ApiEntry): AdvancedIndex {
  const kind = apiKindSingleLabel[entry.kind];
  const searchContent = apiSearchContentBySlug.get(entry.slug);

  return {
    id: `api:${entry.slug}`,
    title: entry.name,
    description: entry.summary || `${kind} exported by ${apiPackage.name}.`,
    breadcrumbs: ['Guide', 'API Reference', apiKindLabel[entry.kind]],
    url: apiEntryUrl(entry),
    structuredData: apiStructuredData(
      [entry.name, kind, apiKindLabel[entry.kind], entry.slug, entry.summary, searchContent]
        .filter(Boolean)
        .join(' '),
    ),
  };
}

function apiIndexes(): AdvancedIndex[] {
  return [
    {
      id: 'api:index',
      title: 'API Reference',
      description: `Public TypeScript exports from ${apiPackage.name} ${apiPackage.version}.`,
      breadcrumbs: ['Guide'],
      url: '/docs/api',
      structuredData: apiStructuredData(
        `API Reference ${apiPackage.name} ${apiPackage.version} TypeScript exports`,
      ),
    },
    ...apiKindOrder.map((kind) => ({
      id: `api:${apiKindSlug[kind]}`,
      title: apiKindLabel[kind],
      description: `${apiKindLabel[kind]} exported by ${apiPackage.name}.`,
      breadcrumbs: ['Guide', 'API Reference'],
      url: `/docs/api/${apiKindSlug[kind]}`,
      structuredData: apiStructuredData(`${apiKindLabel[kind]} ${apiKindSingleLabel[kind]}`),
    })),
    ...apiEntries.map(apiEntryIndex),
  ];
}

async function indexes() {
  const guidePages = guideSource
    .getPages()
    .filter((page) => page.url !== '/docs/api');

  return [
    ...(await Promise.all(guidePages.map(guideIndex))),
    ...apiIndexes(),
  ];
}

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function requestedQuery(url: URL) {
  const query = url.searchParams.get('query')?.trim();
  if (!query) return undefined;

  return query.slice(0, maxSearchQueryLength);
}

function requestedLimit(url: URL) {
  const limit = url.searchParams.has('limit')
    ? Number(url.searchParams.get('limit'))
    : undefined;

  if (typeof limit !== 'number' || !Number.isInteger(limit)) return undefined;

  return Math.min(Math.max(limit, 1), maxSearchLimit);
}

function hasApiMatch(query: string) {
  const value = normalized(query);
  if (!value) return false;

  return apiMatchCandidates.some((candidate) => candidate.includes(value));
}

function shouldPromoteApi(query: string) {
  const value = query.trim();
  if (!value) return false;

  return /[A-Z_$]/.test(value) || apiEntryByName.has(value.toLowerCase());
}

function apiSearchLimit(query: string, limit: number | undefined) {
  if (!shouldPromoteApi(query) || !hasApiMatch(query)) {
    return limit;
  }

  return Math.max(limit ?? maxSearchLimit, maxSearchLimit);
}

function resultApiEntry(result: SearchResult) {
  return apiEntryByUrl.get(result.url.split('#')[0]);
}

function resultTypeRank(type: SearchResult['type']) {
  if (type === 'page') return 0;
  if (type === 'heading') return 1;

  return 2;
}

function dedupeResultsByUrl(results: SearchResult[]) {
  const resultsByUrl = new Map<string, SearchResult>();

  for (const result of results) {
    const existing = resultsByUrl.get(result.url);
    if (!existing || resultTypeRank(result.type) < resultTypeRank(existing.type)) {
      resultsByUrl.set(result.url, result);
    }
  }

  return Array.from(resultsByUrl.values());
}

function searchCandidateMatches(value: string, candidates: string[]) {
  return candidates.some(
    (candidate) => candidate === value || candidate.startsWith(value) || candidate.includes(value),
  );
}

function apiNavigationResults(query: string): SearchResult[] {
  const value = normalized(query);
  const results: SearchResult[] = [];

  if (searchCandidateMatches(value, ['api reference'])) {
    results.push({
      id: 'api:index',
      url: '/docs/api',
      type: 'page',
      content: 'API Reference',
      breadcrumbs: ['Guide'],
    });
  }

  for (const kind of apiKindOrder) {
    const candidates = [
      apiKindLabel[kind],
      apiKindSingleLabel[kind],
      apiKindSlug[kind],
    ].map((candidate) => candidate.toLowerCase());

    if (!searchCandidateMatches(value, candidates)) continue;

    results.push({
      id: `api:${apiKindSlug[kind]}`,
      url: `/docs/api/${apiKindSlug[kind]}`,
      type: 'page',
      content: apiKindLabel[kind],
      breadcrumbs: ['Guide', 'API Reference'],
    });
  }

  return results;
}

function apiNavigationResultRank(result: SearchResult, query: string) {
  const value = normalized(query);
  const url = result.url.split('#')[0];
  const typeRank = resultTypeRank(result.type);

  if (url === '/docs/api') {
    if (value === 'api reference') return typeRank;
    if ('api reference'.startsWith(value)) return 10 + typeRank;
    if (value.includes('api reference')) return 20 + typeRank;
    if (value === 'api') return typeRank;

    return undefined;
  }

  for (const kind of apiKindOrder) {
    const kindUrl = `/docs/api/${apiKindSlug[kind]}`;
    if (url !== kindUrl) continue;

    const candidates = [
      apiKindLabel[kind],
      apiKindSingleLabel[kind],
      apiKindSlug[kind],
    ].map((candidate) => candidate.toLowerCase());

    if (candidates.includes(value)) return typeRank;
    if (candidates.some((candidate) => candidate.startsWith(value))) return 10 + typeRank;
    if (candidates.some((candidate) => candidate.includes(value))) return 20 + typeRank;
  }

  return undefined;
}

function apiResultRank(result: SearchResult, query: string) {
  const navigationRank = apiNavigationResultRank(result, query);
  if (navigationRank !== undefined) return navigationRank;

  const entry = resultApiEntry(result);
  if (!entry) return 1000;

  const value = normalized(query);
  const name = entry.name.toLowerCase();
  const slug = entry.slug.toLowerCase();
  const typeRank = resultTypeRank(result.type);

  if (name === value || slug === value) return typeRank;
  if (name.startsWith(value)) return 10 + typeRank;
  if (slug.startsWith(value)) return 20 + typeRank;
  if (name.includes(value)) return 30 + typeRank;
  if (slug.includes(value)) return 40 + typeRank;

  return 100 + typeRank;
}

function rankApiResults(results: SearchResult[], query: string, limit: number | undefined) {
  if (!shouldPromoteApi(query) || !hasApiMatch(query)) return results;

  const sorted = results
    .map((result, index) => ({ index, rank: apiResultRank(result, query), result }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ result }) => result);

  return limit === undefined ? sorted : sorted.slice(0, limit);
}

const searchApi = createSearchAPI('advanced', { indexes });

export const { staticGET } = searchApi;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = requestedQuery(url);

  if (!query) return Response.json([]);

  const limit = requestedLimit(url);
  const searchLimit = apiSearchLimit(query, limit);
  const results = (await searchApi.search(query, {
    tag: url.searchParams.get('tag')?.split(','),
    locale: url.searchParams.get('locale'),
    limit: searchLimit,
    mode: 'full',
  })) as SearchResult[];

  const uniqueResults = dedupeResultsByUrl([
    ...apiNavigationResults(query),
    ...results,
  ]);

  return Response.json(rankApiResults(uniqueResults, query, limit ?? searchLimit));
}
