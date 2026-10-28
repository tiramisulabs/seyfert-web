import type { Metadata } from "next";
import type { ReactNode } from "react";

// the page is a client component, so its metadata lives here
export const metadata: Metadata = {
    title: "Memory benchmark | Seyfert",
    description: "Seyfert, discord.js, Eris, Oceanic and Detritus under the same gateway workload for twelve hours, on Node.js, Deno and Bun.",
    alternates: { canonical: "/benchmark" },
};

export default function Layout({ children }: { children: ReactNode }) {
    return children;
}
