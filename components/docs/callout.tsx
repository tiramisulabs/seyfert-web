import type { ComponentType, ReactNode } from 'react';
import {
  Info,
  Lightbulb,
  TriangleAlert,
  OctagonAlert,
  CircleCheck,
  PencilLine,
} from 'lucide-react';

type CalloutConfig = {
  color: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
};

const CALLOUTS: Record<string, CalloutConfig> = {
  note: { color: '#a1a1aa', icon: PencilLine, label: 'Note' },
  info: { color: '#a1a1aa', icon: Info, label: 'Info' },
  important: { color: '#a1a1aa', icon: Info, label: 'Important' },
  tip: { color: '#4ade80', icon: Lightbulb, label: 'Tip' },
  success: { color: '#4ade80', icon: CircleCheck, label: 'Success' },
  warn: { color: '#fbbf24', icon: TriangleAlert, label: 'Warning' },
  warning: { color: '#fbbf24', icon: TriangleAlert, label: 'Warning' },
  error: { color: '#f87171', icon: OctagonAlert, label: 'Caution' },
  danger: { color: '#f87171', icon: OctagonAlert, label: 'Caution' },
  caution: { color: '#f87171', icon: OctagonAlert, label: 'Caution' },
};

export function Callout({
  type = 'note',
  title,
  icon,
  children,
}: {
  type?: string;
  title?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  const config = CALLOUTS[type] ?? CALLOUTS.note;
  const Icon = config.icon;

  return (
    <div
      className="not-prose my-5 flex gap-3 rounded-xl border p-3.5 text-[0.9375rem] leading-relaxed"
      style={{
        background: `color-mix(in oklab, ${config.color} 7%, transparent)`,
        borderColor: `color-mix(in oklab, ${config.color} 22%, transparent)`,
      }}
    >
      <div
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: `color-mix(in oklab, ${config.color} 16%, transparent)`,
          color: config.color,
        }}
      >
        {icon ?? <Icon className="size-3.5" />}
      </div>
      <div className="callout-content min-w-0 flex-1 self-center text-fd-foreground/90 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-fd-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&>p]:my-2">
        {title && (
          <p className="mb-1 font-semibold text-fd-foreground" style={{ color: config.color }}>
            {title}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
