"use client";

import { Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { BenchmarkChart, chartColor } from "@/components/benchmark-chart";
import { medianMb } from "@/lib/benchmark";
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

// The run these numbers come from: tiramisulabs/benchmark at df104d9
// (February 2025), versions from its pnpm-lock.yaml. Its main branch has since
// moved on to a 32-shard rerun, so the source link pins this commit.
const BENCH_SOURCE = "https://github.com/tiramisulabs/benchmark/tree/df104d9b8df2ac45a363b2ca389065f08ea3ec54";
const RUN = [
  ["Run", "February 2025"],
  ["Window", "12 hours, sampled every 5 s and averaged per 30 min"],
  ["Load", "3 shards, every non-privileged intent, only the guild cache enabled"],
  ["Versions", ["Seyfert 2.2.1 (dev build)", "discord.js 14.18.0", "Eris 0.18.0", "Oceanic 1.11.2", "Detritus 0.16.3"]]
] as const;

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

  // the figures the landing quotes: medians, lowest first, each against Seyfert
  const medians = useMemo(() => {
    if (!runtimeData) return null;
    const entries = (Object.keys(LIBRARIES) as LibraryKey[]).map((key) => ({ key, mb: medianMb(runtimeData[key][metric]) }));
    const seyfert = entries.find((entry) => entry.key === "seyfert")!.mb;
    return entries
      .map((entry) => ({ ...entry, ratio: entry.mb / seyfert }))
      .sort((left, right) => left.mb - right.mb);
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
    <div className="spiral-page relative min-h-screen overflow-hidden pt-15">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(129,140,248,0.09),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <section className="grid gap-10 lg:grid-cols-12 lg:gap-x-16">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <h1 className="max-w-[12ch] text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.025em] sm:text-5xl">
              Memory under a <span className="text-[var(--brand-indigo)]">twelve-hour sky</span>
            </h1>
            <p className="max-w-[48ch] text-[15px] leading-relaxed text-[var(--text-dim)]">
              Five Discord clients under the same gateway workload.
            </p>
            <Link
              href={BENCH_SOURCE}
              className="flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-[var(--text-dim)] transition-colors hover:text-[var(--text-bright)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]"
            >
              <HugeiconsIcon icon={Github01Icon} className="size-4" />
              BENCHMARK SOURCE ↗
            </Link>
          </div>

          <div className="lg:col-span-7 lg:col-start-6 lg:pt-9">
            <dl className="border-t border-white/10">
              {RUN.map(([term, value]) => (
                <div key={term} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3 border-b border-white/10 py-4 sm:grid-cols-[7rem_1fr]">
                  <dt className="font-mono text-[9px] tracking-[0.18em] text-[var(--text-dim)]/60 uppercase">{term}</dt>
                  <dd className="text-sm font-medium text-[var(--text-bright)]">
                    {typeof value === "string" ? value : value.map((item, index) => (
                      // lines break at the separators, never inside a version
                      <Fragment key={item}>
                        {index > 0 && " · "}
                        <span className="whitespace-nowrap">{item}</span>
                      </Fragment>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="relative mt-14 overflow-hidden rounded-xl border border-white/10 bg-[var(--space-deep)]/75 shadow-[0_28px_90px_-48px_rgba(37,99,235,0.65)] backdrop-blur-sm sm:mt-20">
          <div className="flex flex-col gap-6 border-b border-white/10 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.015em]">Memory usage</h2>
              <p className="mt-1 text-xs text-[var(--text-dim)]">{METRICS[metric].description}</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <SegmentControl label="Runtime" value={runtime} options={RUNTIMES} onChange={setRuntime} />
              <SegmentControl label="Metric" value={metric} options={METRIC_LABELS} onChange={setMetric} />
            </div>
          </div>

          {/* the results double as the series toggles: each cell is one
              library's median for the selected runtime and metric */}
          <div className="border-b border-white/8 px-4 py-4 sm:px-6">
            <p className="font-mono text-[9px] tracking-[0.2em] text-[var(--text-dim)]/60 uppercase">
              Median over 12 hours · {RUNTIMES[runtime]} · {METRICS[metric].label}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label="Libraries in the chart">
              {(medians ?? (Object.keys(LIBRARIES) as LibraryKey[]).map((key) => ({ key, mb: null, ratio: null }))).map(({ key, mb, ratio }) => {
                const active = selectedLibraries.includes(key);
                const seyfert = key === "seyfert";
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleLibrary(key)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-[opacity,border-color,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)]",
                      seyfert ? "border-white/20 bg-white/[0.06]" : "border-white/8 bg-black/20 hover:border-white/15",
                      !active && "opacity-40"
                    )}
                  >
                    <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.08em] text-[var(--text-dim)]">
                      <span aria-hidden className="size-2 rounded-sm" style={{ backgroundColor: chartColor(LIBRARIES[key].color) }} />
                      {LIBRARIES[key].name}
                    </span>
                    <span className="text-xl font-semibold tabular-nums tracking-[-0.02em] text-[var(--text-bright)]">
                      {mb === null ? "…" : `${mb} MB`}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-dim)]">
                      {ratio === null ? " " : seyfert ? "Baseline" : `${ratio.toFixed(2)}× Seyfert`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative h-[390px] px-2 py-5 sm:h-[540px] sm:px-5" aria-busy={isLoading}>
            {isLoading && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-[var(--space-deep)]/70 backdrop-blur-sm">
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-[var(--text-dim)] uppercase">
                  <span className="size-2 animate-pulse rounded-full bg-[var(--brand-indigo)]" />
                  Loading…
                </div>
              </div>
            )}

            <BenchmarkChart data={chartData} config={chartConfig} />
          </div>

        </section>
      </div>
    </div>
  );
}
