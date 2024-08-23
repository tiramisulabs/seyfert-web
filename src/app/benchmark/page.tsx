"use client";
import seyfertData from "../../../public/bench_data/medianseyfert.json";
import discordJsData from "../../../public/bench_data/mediandiscord_js.json";
import erisData from "../../../public/bench_data/medianeris.json";
import oceanicJsData from "../../../public/bench_data/medianoceanic_js.json";
import detritusClientData from "../../../public/bench_data/mediandetritus-client.json";
import { useMemo, useState } from "react";
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, LineChart } from "recharts";
import { Box } from "@/styled-system/jsx";
import { css } from "@/styled-system/css";

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

import { TooltipProps } from 'recharts';

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

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
        const formattedTime = formatTime(Number(label));
        return (
            <Box p={3} bg="gray.900" border="1px solid" borderColor="gray.800" rounded="md" shadow="lg">
                <p className={css({ fontWeight: "bold", mb: 2, color: "gray.300" })}>{`Time: ${formattedTime}`}</p>
                {sortedPayload.map((entry, index) => (
                    <p key={`item-${index}`} className={css({ color: entry.color })}>
                        {`${entry.name}: ${entry.value} MB`}
                    </p>
                ))}
            </Box>
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
        <Box p={6} w="full" rounded="xl" h="80vh" bg="gray.900" shadow="xl">
            <Box mb={4}>
                {metricOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setMetric(option.value as "rss" | "heapUsed" | "heapTotal")}
                        className={css({
                            px: 3,
                            py: 2,
                            mr: 2,
                            rounded: "md",
                            bg: metric === option.value ? "blue.600" : "gray.700",
                            color: "white",
                            _hover: { bg: "blue.500" },
                            transition: "background-color 0.2s",
                        })}
                    >
                        {option.label}
                    </button>
                ))}
            </Box>
            <ResponsiveContainer width="100%" height="90%">
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
                        label={{ value: 'Time', position: 'insideBottomRight', offset: -10, fill: '#a0a0a0' }}
                        tick={{ fill: '#a0a0a0' }}
                        tickFormatter={formatTime}
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
        </Box>
    )
}