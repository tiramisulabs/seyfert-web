'use client';

import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import { isLayoutTabActive } from 'fumadocs-ui/layouts/shared';
import { usePathname } from 'next/navigation';
import { useTheme } from 'fumadocs-ui/provider/base';
import Link from 'next/link';
import { Sidebar, Sun, Moon } from 'lucide-react';

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

  if (nav?.component) return nav.component;

  const selectedIdx = tabs.findLastIndex((tab) =>
    isLayoutTabActive(tab, pathname),
  );

  const iconItems = navItems.filter((item) => item.type === 'icon');

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
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
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
                    'relative flex h-9 items-center gap-2 rounded-md border px-3 text-[13.5px] transition-colors [&_svg]:shrink-0',
                    isSelected
                      ? 'border-fd-primary/25 bg-fd-primary/10 font-semibold text-fd-foreground'
                      : 'border-transparent text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-accent-foreground',
                    unlisted && !isSelected && 'hidden',
                    tabClassName,
                  )}
                  {...rest}
                >
                  {tab.icon}
                  {title}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ms-auto flex items-center gap-2">
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
