"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, LineChart } from "recharts";
import { TooltipProps } from 'recharts';
import { Github01Icon } from 'hugeicons-react';
import Link from "next/link";

const data = {
  node: {
    seyfert: () => import('@/public/bench/node/meadianseyfert.json'),
    discordJs: () => import('@/public/bench/node/meadiandiscordjs.json'),
    eris: () => import('@/public/bench/node/meadianeris.json'),
    oceanicJs: () => import('@/public/bench/node/meadianoceanic.json'),
    detritusClient: () => import('@/public/bench/node/meadiandetritus.json')
  },
  deno: {
    seyfert: () => import('@/public/bench/deno/meadianseyfert.json'),
    discordJs: () => import('@/public/bench/deno/meadiandiscordjs.json'),
    eris: () => import('@/public/bench/deno/meadianeris.json'),
    oceanicJs: () => import('@/public/bench/deno/meadianoceanic.json'),
    detritusClient: () => import('@/public/bench/deno/meadiandetritus.json')
  },
  bun: {
    seyfert: () => import('@/public/bench/bun/meadianseyfert.json'),
    discordJs: () => import('@/public/bench/bun/meadiandiscordjs.json'),
    eris: () => import('@/public/bench/bun/meadianeris.json'),
    oceanicJs: () => import('@/public/bench/bun/meadianoceanic.json'),
    detritusClient: () => import('@/public/bench/bun/meadiandetritus.json')
  }
};

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
};

const metricDescriptions = {
  rss: "Resident Set Size - Total memory allocated to the process",
  heapUsed: "Heap Used - Actual memory used by the application",
  heapTotal: "Heap Total - Total size of the JavaScript heap"
};

const LIBRARIES = {
  seyfert: { name: 'Seyfert', color: '#3a9a9a' },
  discord_js: { name: 'Discord.js', color: '#4651c7' },
  eris: { name: 'Eris', color: '#cc4f69' },
  oceanic_js: { name: 'Oceanic', color: '#7a52cc' },
  detritus_client: { name: 'Detritus', color: '#cc923f' }
} as const;

const RUNTIMES = {
  node: { name: 'Node.js', color: '#68A063' },
  deno: { name: 'Deno', color: '#000000' },
  bun: { name: 'Bun', color: '#fbf0df' }
} as const;

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, { name: string }>;
  minWidth?: string;
}

const Select: React.FC<SelectProps> = ({ label, value, onChange, options, minWidth = "200px" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-neutral-900 text-white px-4 py-3 rounded-sm border 
          ${isOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-neutral-700'} 
          hover:border-neutral-600 transition-all duration-200 cursor-pointer`}
        style={{ minWidth }}
      >
        <div className="flex items-center justify-between">
          <label className="block text-sm text-neutral-400">{label}</label>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <div className="mt-1 text-neutral-200">
          {options[value]?.name}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-neutral-900 border border-neutral-700 
          rounded-sm shadow-lg overflow-hidden">
          {Object.entries(options).map(([key, { name }]) => (
            <div
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className={`px-4 py-2 cursor-pointer transition-colors
                ${key === value ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-200 hover:bg-neutral-800'}
                ${key === value ? 'font-medium' : 'font-normal'}
              `}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
    const formattedTime = formatTime(Number(label));
    return (
      <div className="p-4 bg-gray-900 border border-gray-800 rounded-md shadow-lg">
        <p className="font-bold mb-2 text-gray-300">{`Time: ${formattedTime}`}</p>
        {sortedPayload.map((entry, index) => (
          <p key={`item-${index}`} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>
              {LIBRARIES[entry.name as keyof typeof LIBRARIES]?.name || entry.name}:
            </span>
            <span className="font-mono">{entry.value.toFixed(2)} MB</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const LibrarySelect: React.FC<{
  selectedLibraries: string[];
  onChange: (libraries: string[]) => void;
}> = ({ selectedLibraries, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={selectRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-neutral-900 text-white px-4 py-3 rounded-sm border 
          ${isOpen ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-neutral-700'} 
          hover:border-neutral-600 transition-all duration-200 cursor-pointer`}
        style={{ minWidth: "200px" }}
      >
        <div className="flex items-center justify-between">
          <label className="block text-sm text-neutral-400">Libraries</label>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <div className="mt-1 text-neutral-200">
          {selectedLibraries.length} selected
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-neutral-900 border border-neutral-700 
          rounded-sm shadow-lg overflow-hidden p-2">
          {Object.entries(LIBRARIES).map(([key, { name, color }]) => (
            <div
              key={key}
              className="flex items-center gap-3 p-2 hover:bg-neutral-800 rounded-sm cursor-pointer"
              onClick={() => {
                const isCurrentlySelected = selectedLibraries.includes(key);
                if (isCurrentlySelected) {
                  const newSelected = selectedLibraries.filter(lib => lib !== key);
                  onChange(newSelected.length ? newSelected : [key]);
                } else {
                  onChange([...selectedLibraries, key]);
                }
              }}
            >
              <input
                type="checkbox"
                id={key}
                checked={selectedLibraries.includes(key)}
                onChange={() => { }}
                className="w-4 h-4 rounded-sm border-neutral-600 text-purple-500 
                  focus:ring-purple-500/20 focus:ring-offset-neutral-900 bg-neutral-800"
                onClick={(e) => e.stopPropagation()}
              />
              <label htmlFor={key} className="flex items-center gap-2 cursor-pointer flex-1">
                <span className="text-sm font-semibold" style={{ color }}>
                  {name}
                </span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Page() {
  const [metric, setMetric] = useState<"rss" | "heapUsed" | "heapTotal">("rss");
  const [isLoading, setIsLoading] = useState(false);
  const [runtime, setRuntime] = useState<"node" | "deno" | "bun">("node");
  const [runtimeData, setRuntimeData] = useState<any>(null);
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>(Object.keys(LIBRARIES));

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const loadedData = await Promise.all([
        data[runtime].seyfert(),
        data[runtime].discordJs(),
        data[runtime].eris(),
        data[runtime].oceanicJs(),
        data[runtime].detritusClient()
      ]);

      setRuntimeData({
        seyfert: loadedData[0].default,
        discordJs: loadedData[1].default,
        eris: loadedData[2].default,
        oceanicJs: loadedData[3].default,
        detritusClient: loadedData[4].default
      });
      setTimeout(() => setIsLoading(false), 300);
    };

    loadData();
  }, [runtime]);

  const chartData = useMemo(() => {
    if (!runtimeData) return [];

    return Array.from({ length: 24 }, (_, i) => ({
      time: i * 30,
      seyfert: runtimeData.seyfert[metric][i],
      discord_js: runtimeData.discordJs[metric][i],
      eris: runtimeData.eris[metric][i],
      oceanic_js: runtimeData.oceanicJs[metric][i],
      detritus_client: runtimeData.detritusClient[metric][i]
    }));
  }, [metric, runtimeData]);

  const handleMetricChange = (newMetric: "rss" | "heapUsed" | "heapTotal") => {
    setIsLoading(true);
    setMetric(newMetric);
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <main className="min-h-screen mt-10 flex flex-col items-center space-y-4 mb-4 px-4">
      <div className="space-y-6 w-full max-w-6xl">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            Performance Benchmark
          </h1>
          <p className="text-base md:text-lg leading-relaxed text-neutral-200 max-w-2xl mx-auto text-justify">
            To demonstrate <span className="font-bold text-neutral-200">Seyfert</span>&apos;s performance capabilities,
            we conducted a comprehensive benchmark comparing the median memory usage across various Discord clients.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 bg-neutral-900/50 p-6 rounded-sm border border-neutral-800">
          <p className="text-sm leading-relaxed text-neutral-400">
            The benchmark was conducted over a 12-hour period, measuring three key metrics:{" "}
            <span className="text-neutral-300">RSS (Resident Set Size)</span>,{" "}
            <span className="text-neutral-300">Heap Used</span>, and{" "}
            <span className="text-neutral-300">Total Heap</span>.
            Each package was tested under identical conditions, handling the same workload
            and Discord events to ensure fair comparison.
          </p>

          <Link
            href="https://github.com/tiramisulabs/benchmark"
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors w-fit mx-auto group"
          >
            <Github01Icon size={18} className="group-hover:scale-110 transition-transform" />
            View benchmark source code
          </Link>
        </div>
      </div>

      <div className="w-full max-w-6xl">
        <div className="space-y-2 flex flex-col items-center">
          <div className="flex flex-wrap gap-4 justify-center mb-4">
            <Select
              label="Runtime"
              value={runtime}
              onChange={(value) => setRuntime(value as "node" | "deno" | "bun")}
              options={RUNTIMES}
            />

            <Select
              label="Metric"
              value={metric}
              onChange={(value) => handleMetricChange(value as "rss" | "heapUsed" | "heapTotal")}
              options={Object.fromEntries(
                Object.entries(metricDescriptions).map(([key]) => [key, { name: key }])
              )}
            />

            <LibrarySelect
              selectedLibraries={selectedLibraries}
              onChange={(libraries) => {
                setIsLoading(true);
                setSelectedLibraries(libraries);
                setTimeout(() => setIsLoading(false), 300);
              }}
            />
          </div>
          <p className="text-sm text-neutral-500">{metricDescriptions[metric]}</p>
        </div>
      </div>

      <div className="w-full max-w-6xl h-[400px] md:h-[600px] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neutral-200"></div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 10,
              left: 0,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis
              dataKey="time"
              label={{
                value: 'Time',
                position: 'insideBottom',
                offset: -15,
                fill: '#a0a0a0',
                // @ts-expect-error why not
                style: { fontSize: '0.8rem', '@media (minWidth: 768px)': { fontSize: '1rem' } }
              }}
              tick={{ fill: '#a0a0a0', fontSize: '0.75rem' }}
              tickFormatter={formatTime}
              domain={['auto', 'auto']}
            />
            <YAxis
              domain={['auto', 'auto']}
              label={{
                value: 'Memory Usage (MB)',
                angle: -90,
                position: 'insideLeft',
                fill: '#a0a0a0',
                // @ts-expect-error why not
                style: { fontSize: '0.8rem', '@media (minWidth: 768px)': { fontSize: '1rem' } }
              }}
              tick={{ fill: '#a0a0a0', fontSize: '0.75rem' }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{
                color: '#a0a0a0',
                fontSize: '0.75rem',
                // @ts-expect-error why not
                '@media (minWidth: 768px)': {
                  fontSize: '1rem'
                }
              }}
            />
            {Object.entries(LIBRARIES)
              .filter(([key]) => selectedLibraries.includes(key))
              .map(([key, { color }]) => (
                <Line
                  key={key}
                  type="monotone"
                  name={LIBRARIES[key as keyof typeof LIBRARIES].name}
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
