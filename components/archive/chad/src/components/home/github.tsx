"use client";

import { motion } from "motion/react"
import { Button } from "@/components/archive/chad/src/components/ui/button";
import Image from "next/image";
import { GradientItalic, SectionHeading } from "@/components/archive/chad/src/components/home/gradient-italic";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Contributor {
    avatar_url: string;
    login: string;
}

interface Stats {
    stars: number;
    contributors: Contributor[];
}

interface OpenSourceProps {
    repository: string;
    githubToken?: string;
    defaultStats?: Stats;
    title?: string;
    description?: string;
    buttonText?: string;
    className?: string;
}

async function getGithubStats(repository: string, githubToken?: string): Promise<Stats> {
    try {
        const [repoResponse, contributorsResponse] = await Promise.all([
            fetch(`https://api.github.com/repos/${repository}`, {
                ...(githubToken && {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        "Content-Type": "application/json",
                    },
                }),
                next: { revalidate: 3600 },
            }),
            fetch(`https://api.github.com/repos/${repository}/contributors`, {
                ...(githubToken && {
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        "Content-Type": "application/json",
                    },
                }),
                next: { revalidate: 3600 },
            }),
        ]);

        if (!repoResponse.ok || !contributorsResponse.ok) {
            return { stars: 0, contributors: [] };
        }

        const repoData = await repoResponse.json();
        const contributorsData = await contributorsResponse.json();

        return {
            stars: repoData.stargazers_count,
            contributors: contributorsData as Contributor[],
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return { stars: 0, contributors: [] };
    }
}

function ContributorAvatars({ contributors }: { contributors: Contributor[] }) {
    const displayedContributors = contributors.slice(0, 10);

    return (
        <div className="flex flex-wrap gap-1.5 justify-center">
            {displayedContributors.map((contributor) => (
                <motion.div
                    key={contributor.login}
                    whileHover={{ scale: 1.15, y: -3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="relative"
                >
                    <Image
                        src={contributor.avatar_url}
                        alt={`${contributor.login}'s avatar`}
                        width={36}
                        height={36}
                        className="border border-white/20 hover:border-white grayscale hover:grayscale-0 transition-all"
                    />
                </motion.div>
            ))}
        </div>
    );
}

function StatBox({
    value,
    label,
    sub,
    href,
    big = false,
}: {
    value: string | number;
    label: string;
    sub?: string;
    href?: string;
    big?: boolean;
}) {
    const Wrapper = href ? motion.a : motion.div;
    return (
        <Wrapper
            {...(href ? { href, target: "_blank", rel: "noreferrer" } : {})}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            whileHover={{ y: -3 }}
            className={cn(
                "group relative flex flex-col p-6 sm:p-8 bg-[#0a0a0a] border-2 border-white/15",
                "hover:border-white/40 transition-colors cursor-pointer",
                "shadow-[6px_6px_0_0_rgba(255,255,255,0.08)] hover:shadow-[10px_10px_0_0_rgba(255,255,255,0.18)] transition-all duration-300"
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-zinc-600">
                    {label.split(" ").length > 1 ? "// " + label.split(" ")[0] : "// METRIC"}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-emerald-400">
                    ↗ Live
                </span>
            </div>

            <div className={cn(
                "font-black tracking-tighter text-white leading-none",
                big ? "text-7xl sm:text-8xl" : "text-5xl sm:text-6xl"
            )}>
                {value}
            </div>

            <div className="mt-3 text-sm font-black uppercase tracking-wider text-white">
                {label}
            </div>
            {sub && (
                <div className="mt-1 text-xs text-zinc-500 font-mono uppercase tracking-wider">
                    {sub}
                </div>
            )}
        </Wrapper>
    );
}

function OpenSourceContent({
    repository,
    stars,
    contributors,
    buttonText = "Star on GitHub",
}: Stats & {
    repository: string;
    title?: string;
    description?: string;
    buttonText?: string;
}) {
    return (
        <section className="container relative py-12">
            {/* Header */}
            <div className="text-center mb-12 max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 border border-white/15 bg-white/5">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-300 font-mono">
                            // The Numbers
                        </span>
                    </div>
                    <SectionHeading>
                        Open Source.{" "}
                        <GradientItalic variant="gray">Chad Approved.</GradientItalic>
                    </SectionHeading>
                    <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
                        Source code forged in the open and lifted by the Chadest devs around the globe. Star it, fork it, contribute.
                    </p>
                </motion.div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
                <StatBox
                    value={stars}
                    label="Stars of Approval"
                    sub="Certified W ↑"
                    href={`https://github.com/${repository}`}
                    big
                />
                <div className="flex flex-col gap-6">
                    <StatBox
                        value={`${contributors.length}+`}
                        label="Chad Devs"
                        sub="Join the squad"
                        href={`https://github.com/${repository}/graphs/contributors`}
                    />
                    {/* Contributors avatars row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true }}
                        className="p-4 border border-white/15 bg-[#0a0a0a]"
                    >
                        <div className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-zinc-600 mb-3">
                            // The Squad
                        </div>
                        <ContributorAvatars contributors={contributors} />
                    </motion.div>
                </div>
            </div>

            {/* CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex justify-center"
            >
                <Button
                    size="lg"
                    asChild
                    className={cn(
                        "h-12 px-7 rounded-none cursor-pointer",
                        "bg-white text-black hover:bg-zinc-100",
                        "font-black tracking-[0.18em] uppercase text-[13px]",
                        "border-2 border-white",
                        "shadow-[6px_6px_0_0_rgba(255,255,255,0.25)] hover:shadow-[8px_8px_0_0_rgba(255,255,255,0.35)] transition-all"
                    )}
                >
                    <a
                        href={`https://github.com/${repository}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <svg viewBox="0 0 438.549 438.549" className="h-5 w-5">
                            <path
                                fill="currentColor"
                                d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
                            ></path>
                        </svg>
                        {buttonText}
                    </a>
                </Button>
            </motion.div>
        </section>
    );
}

function OpenSourceData({
    repository,
    githubToken,
    ...props
}: OpenSourceProps) {
    const [stats, setStats] = useState<Stats>({ stars: 0, contributors: [] });

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getGithubStats(repository, githubToken);
            setStats(data);
        };
        fetchStats();
    }, [repository, githubToken]);

    return <OpenSourceContent {...stats} {...props} repository={repository} />;
}

export default function OpenSource(props: OpenSourceProps) {
    return (
        <OpenSourceData {...props} />
    );
}
