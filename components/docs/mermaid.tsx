'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

type RenderedDiagram = {
  svg: string;
  bindFunctions?: (element: Element) => void;
};

let mermaidPromise: Promise<typeof import('mermaid')> | undefined;

function loadMermaid() {
  mermaidPromise ??= import('mermaid');
  return mermaidPromise;
}

export function Mermaid({ chart }: { chart: string }) {
  const id = `mermaid-${useId().replaceAll(':', '')}`;
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [diagram, setDiagram] = useState<RenderedDiagram>();
  const [error, setError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    setDiagram(undefined);
    setError(false);

    void loadMermaid()
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          fontFamily: 'inherit',
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
        });

        const result = await mermaid.render(id, chart.replaceAll('\\n', '\n'));
        if (!cancelled) setDiagram(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [chart, id, mounted, resolvedTheme]);

  useEffect(() => {
    if (diagram && containerRef.current) {
      diagram.bindFunctions?.(containerRef.current);
    }
  }, [diagram]);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        data-mermaid-diagram="loading"
        className="not-prose my-6 h-52 animate-pulse rounded-xl border border-fd-border bg-fd-muted/30"
      />
    );
  }

  if (error) {
    return (
      <div
        data-mermaid-diagram="error"
        className="not-prose my-6 overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-4"
      >
        <p className="mb-3 text-sm font-medium text-fd-muted-foreground">
          This diagram could not be rendered.
        </p>
        <pre className="m-0 text-xs leading-relaxed">{chart}</pre>
      </div>
    );
  }

  if (!diagram) {
    return (
      <div
        aria-hidden="true"
        data-mermaid-diagram="loading"
        className="not-prose my-6 h-52 animate-pulse rounded-xl border border-fd-border bg-fd-muted/30"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      data-mermaid-diagram="rendered"
      className="not-prose my-6 overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: diagram.svg }}
    />
  );
}
