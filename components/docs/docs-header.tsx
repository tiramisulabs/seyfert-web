'use client';

import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import { isLayoutTabActive } from 'fumadocs-ui/layouts/shared';
import { usePathname } from 'next/navigation';
import { useTheme } from 'fumadocs-ui/provider/base';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Sidebar, Sun, Moon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-[1.05rem]"
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </button>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function tabCorner(pos: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties {
  const line = '1.5px solid rgba(255,255,255,0.6)';
  const base: React.CSSProperties = { position: 'absolute', width: '7px', height: '7px' };
  if (pos === 'tl') return { ...base, top: 0, left: 0, borderTop: line, borderLeft: line, borderTopLeftRadius: '3px' };
  if (pos === 'tr') return { ...base, top: 0, right: 0, borderTop: line, borderRight: line, borderTopRightRadius: '3px' };
  if (pos === 'bl') return { ...base, bottom: 0, left: 0, borderBottom: line, borderLeft: line, borderBottomLeftRadius: '3px' };
  return { ...base, bottom: 0, right: 0, borderBottom: line, borderRight: line, borderBottomRightRadius: '3px' };
}

// The active-tab frame is positioned relative to the nav (not the document), so
// the window scroll resetting on navigation can't drag it vertically — it only
// ever slides horizontally between tabs.
function TabFrame({ navRef, selectedIdx }: { navRef: React.RefObject<HTMLElement | null>; selectedIdx: number }) {
  const pathname = usePathname();
  const [rect, setRect] = useState<{ left: number; width: number; height: number } | null>(null);
  const ready = useRef(false);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!nav || !active) {
      setRect(null);
      return;
    }
    setRect({ left: active.offsetLeft, width: active.offsetWidth, height: active.offsetHeight });
  }, [navRef, selectedIdx, pathname]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('a[aria-current="page"]');
      if (active) setRect({ left: active.offsetLeft, width: active.offsetWidth, height: active.offsetHeight });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [navRef]);

  if (!rect) return null;

  // Skip the very first placement animation; only slide on subsequent changes.
  const animateImmediately = !ready.current;
  ready.current = true;

  return (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ x: rect.left, width: rect.width, height: rect.height }}
      transition={
        animateImmediately
          ? { duration: 0 }
          : { type: 'spring', stiffness: 480, damping: 38, mass: 0.7 }
      }
      style={{ position: 'absolute', top: '50%', left: 0, y: '-50%', pointerEvents: 'none' }}
    >
      <span style={tabCorner('tl')} />
      <span style={tabCorner('tr')} />
      <span style={tabCorner('bl')} />
      <span style={tabCorner('br')} />
    </motion.span>
  );
}

export function DocsHeader(props: React.ComponentProps<'header'>) {
  const {
    slots,
    navItems,
    isNavTransparent,
    props: { tabMode, nav, tabs, sidebar },
  } = useNotebookLayout();

  const pathname = usePathname();
  const { open } = slots.sidebar?.useSidebar?.() ?? {};
  const sidebarCollapsible = sidebar.collapsible ?? true;
  const showLayoutTabs = tabMode === 'navbar' && tabs.length > 0;
  const navRef = useRef<HTMLElement>(null);

  if (nav?.component) return nav.component;

  const selectedIdx = tabs.findLastIndex((tab) =>
    isLayoutTabActive(tab, pathname),
  );

  const iconItems = navItems.filter((item) => item.type === 'icon');
  const SearchTrigger = slots.searchTrigger ? slots.searchTrigger.sm : null;

  return (
    <header
      id="nd-subnav"
      data-transparent={isNavTransparent && !open}
      {...props}
      className={cn(
        'sticky [grid-area:header] flex flex-col top-(--fd-docs-row-1) z-10 backdrop-blur-sm transition-colors data-[transparent=false]:bg-fd-background/80 layout:[--fd-header-height:--spacing(14)]',
        props.className,
      )}
    >
      <div className="flex h-14 items-center gap-6 border-b px-5">
        {sidebarCollapsible && slots.sidebar && (
          <slots.sidebar.collapseTrigger className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground max-md:hidden [&_svg]:size-4.5">
            <Sidebar />
          </slots.sidebar.collapseTrigger>
        )}

        {showLayoutTabs && (
          <nav ref={navRef} className="relative hidden items-center gap-1 md:flex" aria-label="Sections">
            <TabFrame navRef={navRef} selectedIdx={selectedIdx} />
            {tabs.map((tab, i) => {
              const { title, url, unlisted, props: tabProps } = tab;
              const { className: tabClassName, ...rest } = tabProps ?? {};
              const isSelected = selectedIdx === i;
              return (
                <Link
                  key={i}
                  href={url}
                  aria-current={isSelected ? 'page' : undefined}
                  className={cn(
                    'group relative flex h-9 items-center gap-2 px-3.5 text-[13.5px] transition-colors [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-opacity',
                    isSelected
                      ? 'font-semibold text-fd-foreground [&_svg]:opacity-100'
                      : 'text-fd-muted-foreground [&_svg]:opacity-65 hover:text-fd-foreground hover:[&_svg]:opacity-100',
                    unlisted && !isSelected && 'hidden',
                    tabClassName,
                  )}
                  {...rest}
                >
                  <span className="relative inline-flex items-center gap-2">
                    {tab.icon}
                    {title}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ms-auto flex items-center gap-2">
          {SearchTrigger && (
            <SearchTrigger className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4.5" />
          )}

          {iconItems.map((item, i) =>
            item.type === 'icon' ? (
              <a
                key={i}
                href={item.url}
                aria-label={item.label}
                className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground max-md:hidden [&_svg]:size-4.5"
              >
                {item.icon}
              </a>
            ) : null,
          )}

          <ThemeToggle />

          <div className="flex items-center gap-1 md:hidden">
            {slots.sidebar && (
              <slots.sidebar.trigger className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4.5">
                <Sidebar />
              </slots.sidebar.trigger>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
