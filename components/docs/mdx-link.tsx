import type { ComponentProps } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MdxLink({ href = '', children, className, ...props }: ComponentProps<'a'>) {
  const isExternal = /^https?:\/\//.test(href);
  const linkClass =
    'inline font-medium text-sky-600 no-underline transition-colors hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200';
  const icon = (
    <ArrowUpRight
      aria-hidden
      className="ml-0.5 inline-block size-[0.95em] -translate-y-px text-fd-muted-foreground"
    />
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cn(linkClass, className)} {...props}>
        {children}
        {icon}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(linkClass, className)} {...props}>
      {children}
      {icon}
    </Link>
  );
}
