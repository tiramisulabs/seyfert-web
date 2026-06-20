'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { ApiKind } from '@/lib/api-reference/generated';
import { apiKindSingleLabel, apiKindStyles } from '@/lib/api-reference/kinds';

type FilterRow = {
  name: string;
  slug: string;
  kind: ApiKind;
  summary?: string;
};

export function ApiEntryFilter({
  entries,
  label,
}: {
  entries: FilterRow[];
  label: string;
}) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(normalized));
  }, [entries, normalized]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Filter ${label.toLowerCase()}…`}
            aria-label={`Filter ${label.toLowerCase()}`}
            className="h-9 w-full rounded-lg border border-fd-border bg-fd-card ps-9 pe-3 text-sm text-fd-foreground transition-colors placeholder:text-fd-muted-foreground focus-visible:border-fd-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-fd-muted-foreground">
          {filtered.length}
          {filtered.length !== entries.length ? ` / ${entries.length}` : ''}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-1 rounded-lg border border-fd-border bg-fd-background p-1">
          {filtered.map((entry) => (
            <Link
              key={entry.slug}
              href={`/docs/api/${entry.slug}`}
              className="group grid gap-1 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-fd-border hover:bg-fd-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              <span className="flex min-w-0 items-center gap-2">
                <code className="truncate text-[13px] font-semibold text-fd-foreground">
                  {entry.name}
                </code>
                <span
                  className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-semibold ${apiKindStyles[entry.kind].badge}`}
                >
                  {apiKindSingleLabel[entry.kind]}
                </span>
              </span>
              {entry.summary && (
                <span className="line-clamp-2 text-xs leading-5 text-fd-muted-foreground">
                  {entry.summary}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-fd-border bg-fd-secondary/25 px-3 py-6 text-center text-sm text-fd-muted-foreground">
          No {label.toLowerCase()} match “{query.trim()}”.
        </p>
      )}
    </div>
  );
}
