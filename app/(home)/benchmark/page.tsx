"use client";

import { Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BenchmarkChart } from "@/components/benchmark-chart";
import { ArmLabel } from "@/components/home/galaxy/arm-label";
import { cn } from "@/lib/utils";

type RuntimeKey = "node" | "deno" | "bun";
type MetricKey = "rss" | "heapUsed" | "heapTotal";
type LibraryKey = "seyfert" | "discord_js" | "eris" | "oceanic_js" | "detritus_client";
type BenchmarkSeries = Record<MetricKey, number[]>;
type RuntimeData = Record<LibraryKey, BenchmarkSeries>;

const DATA_LOADERS = {
  node: {
    seyfert: () => import("@/public/bench/node/meadianseyfert.json"),
    discord_js: () => import("@/public/bench/node/meadiandiscordjs.json"),
    eris: () => import("@/public/bench/node/meadianeris.json"),
    oceanic_js: () => import("@/public/bench/node/meadianoceanic.json"),
    detritus_client: () => import("@/public/bench/node/meadiandetritus.json")
  },
  deno: {
    seyfert: () => import("@/public/bench/deno/meadianseyfert.json"),
    discord_js: () => import("@/public/bench/deno/meadiandiscordjs.json"),
    eris: () => import("@/public/bench/deno/meadianeris.json"),
    oceanic_js: () => import("@/public/bench/deno/meadianoceanic.json"),
    detritus_client: () => import("@/public/bench/deno/meadiandetritus.json")
  },
  bun: {
    seyfert: () => import("@/public/bench/bun/meadianseyfert.json"),
    discord_js: () => import("@/public/bench/bun/meadiandiscordjs.json"),
    eris: () => import("@/public/bench/bun/meadianeris.json"),
    oceanic_js: () => import("@/public/bench/bun/meadianoceanic.json"),
    detritus_client: () => import("@/public/bench/bun/meadiandetritus.json")
  }
} as const;

const LIBRARIES = {
  seyfert: { name: "Seyfert", color: "green" },
  discord_js: { name: "Discord.js", color: "blue" },
  eris: { name: "Eris", color: "pink" },
  oceanic_js: { name: "Oceanic", color: "purple" },
  detritus_client: { name: "Detritus", color: "orange" }
} as const;

const RUNTIMES: Record<RuntimeKey, string> = {
  node: "Node.js",
  deno: "Deno",
  bun: "Bun"
};

const METRICS: Record<MetricKey, { label: string; description: string }> = {
  rss: { label: "RSS", description: "Total memory held by the process" },
  heapUsed: { label: "Heap used", description: "Memory actively used by JavaScript" },
  heapTotal: { label: "Heap total", description: "Total allocated JavaScript heap" }
};

const METRIC_LABELS = Object.fromEntries(
  Object.entries(METRICS).map(([key, item]) => [key, item.label])
) as Record<MetricKey, string>;

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? hours + "h " + remainingMinutes + "m" : remainingMinutes + "m";
};

function SegmentControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-[9px] tracking-[0.2em] text-[var(--text-dim)]/60 uppercase">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1 rounded-lg border border-white/8 bg-black/20 p-1">
        {Object.entries(options).map(([key, optionLabel]) => {
          const active = key === value;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(key as T)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)]",
                active
                  ? "bg-white/10 text-[var(--text-bright)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-bright)]"
              )}
            >
              {String(optionLabel)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function Page() {
  const [metric, setMetric] = useState<MetricKey>("rss");
  const [runtime, setRuntime] = useState<RuntimeKey>("node");
  const [runtimeData, setRuntimeData] = useState<RuntimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLibraries, setSelectedLibraries] = useState<LibraryKey[]>(
    Object.keys(LIBRARIES) as LibraryKey[]
  );

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      const entries = await Promise.all(
        Object.entries(DATA_LOADERS[runtime]).map(async ([key, loader]) => [
          key,
          (await loader()).default
        ])
      );

      if (!cancelled) {
        setRuntimeData(Object.fromEntries(entries) as RuntimeData);
        setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [runtime]);

  const chartData = useMemo(() => {
    if (!runtimeData) return [];
    return Array.from({ length: 24 }, (_, index) => ({
      time: index * 30,
      timeLabel: formatTime(index * 30),
      seyfert: runtimeData.seyfert[metric][index],
      discord_js: runtimeData.discord_js[metric][index],
      eris: runtimeData.eris[metric][index],
      oceanic_js: runtimeData.oceanic_js[metric][index],
      detritus_client: runtimeData.detritus_client[metric][index]
    }));
  }, [metric, runtimeData]);

  const libraryAverages = useMemo(() => {
    if (!runtimeData) return null;
    return Object.fromEntries(
      (Object.keys(LIBRARIES) as LibraryKey[]).map((key) => {
        const values = runtimeData[key][metric];
        return [key, values.reduce((total, value) => total + value, 0) / values.length];
      })
    ) as Record<LibraryKey, number>;
  }, [metric, runtimeData]);

  const orderedLibraries = useMemo(() => {
    if (!libraryAverages) return selectedLibraries;

    return [...selectedLibraries].sort(
      (left, right) => libraryAverages[right] - libraryAverages[left]
    );
  }, [libraryAverages, selectedLibraries]);

  const chartConfig = useMemo(
    () => Object.fromEntries(
      orderedLibraries.map((key) => [
        key,
        { label: LIBRARIES[key].name, color: LIBRARIES[key].color }
      ])
    ),
    [orderedLibraries]
  );

  const toggleLibrary = (key: LibraryKey) => {
    setSelectedLibraries((current) => {
      if (!current.includes(key)) return [...current, key];
      return current.length === 1 ? current : current.filter((item) => item !== key);
    });
  };

  return (
    <main className="spiral-page relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(129,140,248,0.09),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <section className="grid gap-10 lg:grid-cols-12 lg:gap-x-16">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <ArmLabel index="04" name="Luminosity" />
            <h1 className="max-w-[12ch] text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.025em] sm:text-5xl">
              Memory under a <span className="text-[var(--brand-indigo)]">twelve-hour sky</span>
            </h1>
            <p className="max-w-[48ch] text-[15px] leading-relaxed text-[var(--text-dim)]">
              Median memory telemetry from five Discord clients handling the same gateway workload. Lower is better.
            </p>
            <Link
              href="https://github.com/tiramisulabs/benchmark"
              className="flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-[var(--text-dim)] transition-colors hover:text-[var(--text-bright)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]"
            >
              <HugeiconsIcon icon={Github01Icon} className="size-4" />
              BENCHMARK SOURCE ↗
            </Link>
          </div>

          <div className="lg:col-span-7 lg:col-start-6 lg:pt-9">
            <dl className="border-t border-white/10">
              {[
                ["Window", "12 hours", "A long-running process, not a synthetic burst"],
                ["Cadence", "24 samples", "One median reading every thirty minutes"],
                ["Load", "Identical", "The same events and gateway traffic for every client"]
              ].map(([term, value, detail]) => (
                <div key={term} className="grid grid-cols-[5.5rem_7rem_1fr] items-baseline gap-3 border-b border-white/10 py-4 sm:grid-cols-[7rem_8rem_1fr]">
                  <dt className="font-mono text-[9px] tracking-[0.18em] text-[var(--text-dim)]/60 uppercase">{term}</dt>
                  <dd className="text-sm font-medium text-[var(--text-bright)]">{value}</dd>
                  <dd className="text-xs leading-relaxed text-[var(--text-dim)]">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="relative mt-14 overflow-hidden rounded-xl border border-white/10 bg-[var(--space-deep)]/75 shadow-[0_28px_90px_-48px_rgba(37,99,235,0.65)] backdrop-blur-sm sm:mt-20">
          <div className="flex flex-col gap-6 border-b border-white/10 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[9px] tracking-[0.22em] text-[var(--brand-indigo)] uppercase">Memory telemetry</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.015em]">Median usage over time</h2>
              <p className="mt-1 text-xs text-[var(--text-dim)]">{METRICS[metric].description}</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <SegmentControl label="Runtime" value={runtime} options={RUNTIMES} onChange={setRuntime} />
              <SegmentControl label="Metric" value={metric} options={METRIC_LABELS} onChange={setMetric} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-white/8 px-4 py-3 sm:px-6" aria-label="Visible libraries">
            {(Object.keys(LIBRARIES) as LibraryKey[]).map((key) => {
              const active = selectedLibraries.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleLibrary(key)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)]",
                    active
                      ? "border-white/15 bg-white/8 text-[var(--text-bright)]"
                      : "border-white/6 text-[var(--text-dim)]/45 hover:text-[var(--text-dim)]"
                  )}
                >
                  {LIBRARIES[key].name}
                </button>
              );
            })}
          </div>

          <div className="relative h-[390px] px-2 py-5 sm:h-[540px] sm:px-5" aria-busy={isLoading}>
            {isLoading && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-[var(--space-deep)]/70 backdrop-blur-sm">
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-[var(--text-dim)] uppercase">
                  <span className="size-2 animate-pulse rounded-full bg-[var(--brand-indigo)]" />
                  Loading telemetry
                </div>
              </div>
            )}

            <BenchmarkChart data={chartData} config={chartConfig} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 font-mono text-[9px] tracking-[0.16em] text-[var(--text-dim)]/60 sm:px-6">
            <span>{RUNTIMES[runtime]} · {METRICS[metric].label} · LINE · GRADIENT · MEDIAN MB</span>
            <span className="text-[var(--brand-indigo)]">LOWER IS BETTER</span>
          </div>
        </section>
      </div>
    </main>
  );
}
