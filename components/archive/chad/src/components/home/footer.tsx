import { Button } from '@/components/archive/chad/src/components/ui/button';
import Discord from '@/components/archive/chad/src/components/ui/icons/discord';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { GradientItalic, SectionHeading } from '@/components/archive/chad/src/components/home/gradient-italic';
import { cn } from '@/lib/utils';

export function Footer() {
    return (
        <section className="relative py-12">
            {/* Brutal frame */}
            <div className="relative border-2 border-white/15 bg-[#0a0a0a] p-8 md:p-12 overflow-hidden shadow-[8px_8px_0_0_rgba(255,255,255,0.06)]">
                {/* Diagonal stripes overlay */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                        background:
                            "repeating-linear-gradient(135deg, transparent, transparent 12px, rgba(255,255,255,0.015) 12px, rgba(255,255,255,0.015) 24px)",
                    }}
                />

                {/* Corner labels */}
                <span className="absolute top-2 left-3 text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-zinc-700">
                    // END OF PAGE
                </span>
                <span className="absolute top-2 right-3 text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-zinc-700">
                    EOF ★
                </span>

                <div className="relative z-10 space-y-8 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/15 bg-white/5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-300 font-mono">
                            Final Boss
                        </span>
                    </div>

                    <SectionHeading>
                        Stop coping.{" "}
                        <GradientItalic variant="gold">Start shipping.</GradientItalic>
                    </SectionHeading>

                    <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
                        Install <span className="text-white font-bold">Seyfert</span>. Open the docs. Ship a bot. That&apos;s the whole pitch.
                    </p>

                    <div className="flex gap-4 flex-wrap pt-2">
                        <Link href="/guide" target="_blank" rel="noopener noreferrer">
                            <Button
                                size="lg"
                                className={cn(
                                    "h-12 px-7 rounded-none cursor-pointer",
                                    "bg-white text-black hover:bg-zinc-100",
                                    "font-black tracking-[0.18em] uppercase text-[13px]",
                                    "border-2 border-white",
                                    "shadow-[6px_6px_0_0_rgba(255,255,255,0.25)] hover:shadow-[8px_8px_0_0_rgba(255,255,255,0.35)] transition-all"
                                )}
                            >
                                Read the Guide
                                <ArrowUpRight className="!w-5 !h-5 ml-1" />
                            </Button>
                        </Link>
                        <Link href="https://discord.gg/hEeJNaSqnS" target="_blank" rel="noopener noreferrer">
                            <Button
                                size="lg"
                                className={cn(
                                    "h-12 px-7 rounded-none cursor-pointer",
                                    "bg-transparent text-white",
                                    "font-black tracking-[0.18em] uppercase text-[13px]",
                                    "border-2 border-white/30 hover:border-white",
                                    "hover:bg-white/5 transition-all"
                                )}
                            >
                                Join the Chad Lobby
                                <Discord className="!h-5 !w-5 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {/* Mini metadata strip */}
                    <div className="pt-6 mt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { k: "STATUS", v: "PUMPED" },
                            { k: "RUNTIME", v: "DENO / NODE" },
                            { k: "VIBES", v: "IMMACULATE" },
                            { k: "COPE", v: "ZERO" },
                        ].map((m) => (
                            <div key={m.k}>
                                <div className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-zinc-600">
                                    {m.k}
                                </div>
                                <div className="text-sm font-black uppercase tracking-wider text-white mt-1">
                                    {m.v}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
