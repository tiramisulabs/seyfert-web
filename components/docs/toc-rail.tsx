'use client';

import { AnchorProvider, useActiveAnchor } from 'fumadocs-core/toc';
import type { TOCItemType } from 'fumadocs-core/toc';
import { GeistMono } from 'geist/font/mono';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const indent: Record<number, string> = {
  2: 'pl-0',
  3: 'pl-4',
  4: 'pl-8',
};

const RAIL_BASE = 6;
const RAIL_STEP = 12;
// Text starts past the base (h2) rail; deeper items get their extra indent from
// the per-item padding, so the line stays reasonably close to the text.
const RAIL_WIDTH = RAIL_BASE + 18;

const nodeX = (depth: number) => RAIL_BASE + Math.max(0, depth - 2) * RAIL_STEP;

const slug = (url: string) => url.replace(/^#/, '');

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    // A single heading (e.g. a page with only an H1) still needs a drawable
    // segment so the track + gold fill render instead of a zero-length point.
    const p = points[0];
    return `M ${p.x} ${Math.max(0, p.y - 11)} L ${p.x} ${p.y + 11}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    if (cur.x === prev.x) {
      d += ` L ${cur.x} ${cur.y}`;
    } else {
      const jog = Math.min(8, Math.abs(cur.y - prev.y) / 2);
      d += ` L ${prev.x} ${cur.y - jog}`;
      d += ` L ${cur.x} ${cur.y}`;
    }
  }
  return d;
}

function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    let frame = 0;
    const compute = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop;
      const scrollHeight = doc.scrollHeight;
      const clientHeight = doc.clientHeight;
      const max = scrollHeight - clientHeight;
      const next = max > 0 ? scrollTop / max : 0;
      setProgress(Math.max(0, Math.min(1, next)));
      setAtBottom(scrollTop + clientHeight >= scrollHeight - 2);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { progress, atBottom };
}

function TocRailInner({ items }: { items: TOCItemType[] }) {
  const activeAnchor = useActiveAnchor();
  const { progress, atBottom } = useReadingProgress();

  const lastId = items.length > 0 ? slug(items[items.length - 1].url) : undefined;
  const activeId = atBottom ? lastId : activeAnchor;
  const clamped = Math.max(0, Math.min(1, progress));

  const listRef = useRef<HTMLUListElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pathRef = useRef<SVGPathElement | null>(null);

  const [nodes, setNodes] = useState<{ id: string; x: number; y: number; depth: number }[]>([]);
  const [size, setSize] = useState({ width: RAIL_WIDTH, height: 0 });
  const [pathLength, setPathLength] = useState(0);

  const setNodeRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) nodeRefs.current.set(id, el);
      else nodeRefs.current.delete(id);
    },
    [],
  );

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const listRect = list.getBoundingClientRect();
    const next = items.map((item) => {
      const id = slug(item.url);
      const el = nodeRefs.current.get(id);
      const rect = el?.getBoundingClientRect();
      const y = rect ? rect.top - listRect.top + rect.height / 2 : 0;
      return { id, x: nodeX(item.depth), y, depth: item.depth };
    });
    setNodes(next);
    setSize({ width: RAIL_WIDTH, height: listRect.height });
  }, [items]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  useLayoutEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [nodes]);

  const d = buildPath(nodes);
  // Drive the fill by the active item's position too — short pages that don't
  // scroll have progress 0, so the fill must still reach where you're reading.
  // Fill driven by the active item's INDEX (robust — independent of measured
  // node positions, which can be unmeasured/stale and left the fill at 0).
  const activeItemIdx = items.findIndex((it) => slug(it.url) === activeId);
  const indexFrac =
    activeItemIdx >= 0 && items.length > 0
      ? (activeItemIdx + 0.5) / items.length
      : 0;
  const fillFraction = atBottom ? 1 : Math.max(clamped, indexFrac);
  const dashOffset = pathLength * (1 - fillFraction);

  return (
    <nav aria-label="On this page" className="w-full text-sm">
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className={`${GeistMono.className} text-[11px] leading-none text-neutral-500`}>
          //
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          On this page
        </span>
      </div>

      <div className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          fill="none"
        >
          <path
            ref={pathRef}
            d={d}
            className="stroke-neutral-300 dark:stroke-white/10"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={d}
            stroke="var(--toc-g1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength}
            strokeDashoffset={dashOffset}
            className="opacity-90 transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
          />
        </svg>

        <ul ref={listRef} className="relative flex flex-col gap-px" style={{ paddingLeft: RAIL_WIDTH }}>
          {items.map((item) => {
            const id = slug(item.url);
            const isActive = id === activeId;

            return (
              <li key={item.url} ref={setNodeRef(id)} className="relative">
                <a
                  href={item.url}
                  aria-current={isActive ? 'location' : undefined}
                  className={[
                    'group relative flex min-h-[32px] items-center rounded-md pr-2 outline-none transition-colors duration-200 motion-reduce:transition-none',
                    'focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
                    indent[item.depth] ?? 'pl-0',
                    isActive
                      ? 'font-bold text-neutral-900 dark:text-white'
                      : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300',
                  ].join(' ')}
                >
                  <span className="truncate">{item.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function TocRail({ items }: { items: TOCItemType[] }) {
  if (items.length === 0) return null;

  return (
    <AnchorProvider toc={items}>
      <TocRailInner items={items} />
    </AnchorProvider>
  );
}

export default TocRail;
