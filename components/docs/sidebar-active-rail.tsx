'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';

type Box = { top: number; height: number };

export function SidebarActiveRail() {
  const pathname = usePathname();
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      const viewport = document.querySelector<HTMLElement>(
        '#nd-sidebar [data-radix-scroll-area-viewport]',
      );
      const contentEl = viewport?.firstElementChild as HTMLElement | null;
      const active = document.querySelector<HTMLElement>(
        '#nd-sidebar a[data-active="true"]:not(:has(.lucide-chevron-down))',
      );

      if (!viewport || !contentEl || !active) {
        setBox(null);
        return;
      }

      contentEl.style.position = 'relative';
      const cr = contentEl.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      setBox({ top: ar.top - cr.top, height: ar.height });
    };

    measure();
    // Re-measure after folder open/scroll-into-view settles.
    raf = requestAnimationFrame(() => requestAnimationFrame(measure));
    const timer = setTimeout(measure, 320);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [pathname]);

  if (!box) return null;

  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ y: box.top, height: box.height }}
      transition={{ type: 'spring', stiffness: 650, damping: 46, mass: 0.8 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 'var(--seyfert-sidebar-marker-offset, 0px)',
        right: 0,
        borderRadius: '0 0.4rem 0.4rem 0',
        background: 'color-mix(in oklab, var(--color-fd-primary) 9%, transparent)',
        borderInlineStart: '1.5px solid var(--color-fd-primary)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
