"use client";
import seyfertData from "@/public/bench/meadianseyfert.json";
import discordJsData from "@/public/bench/meadiandiscordjs.json";
import erisData from "@/public/bench/meadianeris.json";
import oceanicJsData from "@/public/bench/meadianoceanic.json";
import detritusClientData from "@/public/bench/meadiandetritus.json";
import { useMemo, useState } from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, LineChart } from "recharts";
import { TooltipProps } from 'recharts';
import { Github01Icon } from 'hugeicons-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function createData(metric: "rss" | "heapUsed" | "heapTotal") {
    return Array.from({ length: 24 }, (_, i) => {
        return {
            time: i * 30,
            seyfert: seyfertData[metric][i],
            discord_js: discordJsData[metric][i],
            eris: erisData[metric][i],
            oceanic_js: oceanicJsData[metric][i],
            detritus_client: detritusClientData[metric][i]
        }
    });
}

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

export default function Page() {
    const [metric, setMetric] = useState<"rss" | "heapUsed" | "heapTotal">("rss");
    const [isLoading, setIsLoading] = useState(false);
    const [showDiscordJs, setShowDiscordJs] = useState(true);
    const data = useMemo(() => {
        const rawData = createData(metric);
        if (!showDiscordJs) {
            return rawData.map(point => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { discord_js, ...rest } = point;
                return rest;
            });
        }
        return rawData;
    }, [metric, showDiscordJs]);

    const handleMetricChange = (newMetric: "rss" | "heapUsed" | "heapTotal") => {
        setIsLoading(true);
        setMetric(newMetric);
        setTimeout(() => setIsLoading(false), 300);
    };

    const toggleDiscordJs = () => {
        setIsLoading(true);
        setShowDiscordJs(!showDiscordJs);
        setTimeout(() => setIsLoading(false), 300);
    };

    return (
        <main className="min-h-screen mt-10 flex flex-col items-center space-y-4 mb-4 px-4">
            <div className="space-y-6 w-full max-w-6xl">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                        Performance Benchmark
                    </h1>
                    <p className="text-base md:text-lg leading-relaxed text-neutral-200 max-w-2xl mx-auto text-justify">
                        To demonstrate <span className="font-bold text-neutral-200">Seyfert</span>&apos;s performance capabilities,
                        we conducted a comprehensive benchmark comparing the median memory usage across various Discord clients.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6 bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
                    <p className="text-sm leading-relaxed text-neutral-400">
                        The benchmark was conducted over a 12-hour period, measuring three key metrics:{" "}
                        <span className="text-neutral-300">RSS (Resident Set Size)</span>,{" "}
                        <span className="text-neutral-300">Heap Used</span>, and{" "}
                        <span className="text-neutral-300">Total Heap</span>.
                        Each package was tested under identical conditions, handling the same workload
                        and Discord events to ensure fair comparison.
                    </p>

                    <Link
                        href="https://github.com/seyfert/benchmarks"
                        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors w-fit mx-auto group"
                    >
                        <Github01Icon size={18} className="group-hover:scale-110 transition-transform" />
                        View benchmark source code
                    </Link>
                </div>
            </div>

            <div className="w-full max-w-6xl">
                <div className="space-y-2 flex flex-col items-center">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {Object.entries(metricDescriptions).map(([key]) => (
                            <Button
                                key={key}
                                onClick={() => handleMetricChange(key as "rss" | "heapUsed" | "heapTotal")}
                                variant={metric === key ? "default" : "ghost"}
                                className={cn(
                                    "cursor-pointer bg-neutral-800/50 text-white/50 hover:bg-neutral-800 ",
                                    metric === key
                                    && 'border-green-400 border text-white'
                                )}
                                aria-label={`Show ${key} metrics`}
                            >
                                {key}
                            </Button>
                        ))}
                    </div>
                    <p className="text-sm text-neutral-500">{metricDescriptions[metric]}</p>
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <Button
                            onClick={toggleDiscordJs}
                            variant="ghost"
                            className={cn(
                                "cursor-pointer bg-neutral-800/50 text-white/50 hover:bg-neutral-800",
                                !showDiscordJs && 'border-red-400 border text-white'
                            )}
                        >
                            {showDiscordJs ? 'Hide' : 'Show'} Discord.js
                        </Button>
                        <p className="text-sm text-neutral-500">
                            Discord.js uses significantly more memory. Toggle to better visualize other clients.
                        </p>
                    </div>
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
                        data={data}
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
                        {Object.entries(LIBRARIES).map(([key, { color }]) => (
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