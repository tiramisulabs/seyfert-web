"use client";
import seyfertData from "../../../public/bench_data/medianseyfert.json";
import discordJsData from "../../../public/bench_data/mediandiscord_js.json";
import erisData from "../../../public/bench_data/medianeris.json";
import oceanicJsData from "../../../public/bench_data/medianoceanic_js.json";
import detritusClientData from "../../../public/bench_data/mediandetritus-client.json";
import { useMemo, useState } from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, LineChart } from "recharts";
import { TooltipProps } from 'recharts';
import { IconBrandGithub } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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


const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
        const formattedTime = formatTime(Number(label));
        return (
            <div className="p-3 bg-gray-900 border border-gray-800 rounded-md shadow-lg">
                <p className="font-bold mb-2 text-gray-300">{`Time: ${formattedTime}`}</p>
                {sortedPayload.map((entry, index) => (
                    <p key={`item-${index}`} style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value} MB`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Page() {
    const [metric, setMetric] = useState<"rss" | "heapUsed" | "heapTotal">("rss");
    const data = useMemo(() => createData(metric), [metric]);

    const metricOptions = [
        { value: "rss", label: "RSS" },
        { value: "heapUsed", label: "Heap Used" },
        { value: "heapTotal", label: "Heap Total" },
    ];

    return (
        <div className="p-2 md:p-4 lg:p-6 w-full bg-accent/50 border">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <div className="flex gap-2 flex-row ">
                        {metricOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={metric === option.value ? "default" : "secondary"}
                                onClick={() => setMetric(option.value as "rss" | "heapUsed" | "heapTotal")}
                                className={"transition-all duration-200 ease-in-out hover:-translate-y-0.5 active:translate-y-0.5 w-1/3"}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                    <Link
                        href="https://github.com/tiramisulabs/benchmark"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full md:w-auto"
                    >
                        <Button size="lg" variant="secondary" className="hover:-translate-y-1 transition-all duration-300 ease-in-out w-full md:w-auto">
                            <IconBrandGithub size={20} className="mr-2" />
                            View Source on GitHub
                        </Button>
                    </Link>
                </div>
                <div className="h-[60vh] md:h-[70vh] lg:h-[80vh]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 20,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                            <XAxis
                                dataKey="time"
                                label={{ value: 'Time', position: 'insideBottom', offset: -15, fill: '#a0a0a0', marginTop: '10px' }}
                                tick={{ fill: '#a0a0a0' }}
                                tickFormatter={formatTime}
                                domain={['auto', 'auto']}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                label={{ value: 'Memory Usage (MB)', angle: -90, position: 'insideLeft', fill: '#a0a0a0' }}
                                tick={{ fill: '#a0a0a0' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#a0a0a0' }} />
                            <Line type="monotone" dataKey="seyfert" stroke="#3a9a9a" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="discord_js" stroke="#4651c7" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="eris" stroke="#cc4f69" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="oceanic_js" stroke="#7a52cc" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="detritus_client" stroke="#cc923f" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}