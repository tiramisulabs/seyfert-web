import Link from "next/link";
import Particles from "@/components/archive/legacy-2024/particles";
import { Container, Heading, PandaRoot, Text, brandOriginal } from "@/components/archive/legacy-2024/panda";
import {
    IconAt,
    IconBrandGithubFilled,
    IconFingerprintOff,
    IconRocket,
    IconTrashFilled,
} from "@/components/archive/legacy-2024/tabler-icons";

// The first seyfert.dev landing, June 2024: src/app/layout.tsx, header.tsx,
// page.tsx and modules/home/terminal.tsx as of b5ddcce ("feat(home):
// responsive", on top of 368b8ac "feat: base"). Panda props are translated
// 1:1 into classes; copy, links and the pre-release terminal are verbatim.

// recipes/button.ts at the time: radius lg, brand + gray colors, size lg
const button =
    "relative inline-flex h-11 w-fit cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-[0.5rem] px-6 py-4 font-medium duration-300";

function Header() {
    return (
        <header className="sticky top-0 w-full border-b-2 border-(--bg-800) bg-(--bg-900) py-4">
            <Container className="w-full">
                <div className="flex items-center justify-between">
                    {/* archive: a plain heading in 2024; it links to the design index here */}
                    <Link href="/" aria-label="Seyfert">
                        <Heading as="span">Seyfert</Heading>
                    </Link>
                    <Link
                        href="https://github.com/tiramisulabs/seyfert"
                        target="_blank"
                        referrerPolicy="no-referrer"
                        aria-label="GitHub"
                    >
                        <IconBrandGithubFilled />
                    </Link>
                </div>
            </Container>
        </header>
    );
}

function HomeTerminal() {
    return (
        <div className="w-full rounded-[0.75rem] border border-(--bg-600) bg-(--bg-800) p-4 font-[monospace] text-[0.875rem] lg:w-1/2">
            <div className="flex w-full items-center justify-between">
                <div className="flex gap-2">
                    <span className="size-4 flex-none rounded-full bg-[#f87171]" />
                    <span className="size-4 flex-none rounded-full bg-[#facc15]" />
                    <span className="size-4 flex-none rounded-full bg-[#4ade80]" />
                </div>
                <Text>Terminal</Text>
            </div>
            <div className="mt-3 flex flex-col gap-1">
                <div className="flex w-full gap-2">
                    <strong>/usr/bin $</strong>
                    pnpm create seyfert
                </div>
                <div className="flex w-full gap-2 bg-[#ef4444]/20 py-1">
                    <strong>Error:</strong>
                    This command is not yet available!
                </div>
                <div className="flex w-full gap-2 bg-[#ef4444]/20 py-1">
                    <strong>Status:</strong>
                    Exiting...
                </div>
                <div className="flex w-full gap-2">
                    <strong>/usr/bin $</strong>_
                </div>
            </div>
        </div>
    );
}

function Feature({ tone, icon, children }: { tone: string; icon: React.ReactNode; children: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`rounded-full p-2.5 ${tone}`}>{icon}</span>
            <Text>{children}</Text>
        </div>
    );
}

export function OriginalHome() {
    return (
        <PandaRoot brand={brandOriginal}>
            <Particles className="absolute inset-0" quantity={100} ease={80} refresh />
            <Header />
            <Container as="main" className="py-11">
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                    <div className="flex max-w-3xl flex-col gap-4">
                        <span className="inline-flex w-fit items-center justify-center rounded-[0.5rem] bg-(--brand-950) px-3 py-0.5 text-[0.875rem] font-medium text-(--brand-500)">
                            Seyfert 2.0 is coming soon!
                            <IconRocket size={16} className="ml-1" />
                        </span>
                        <Heading as="h1" size="5xl">
                            The Discord library that{" "}
                            <span className="rounded-[0.75rem] bg-(--brand-500)/20 px-6 py-1 font-mono text-(--brand-500) italic">
                                satisfies
                            </span>{" "}
                            you
                        </Heading>
                        <Text>
                            Seyfert is a brand-new Discord library made entirely in TypeScript for
                            TypeScript.
                        </Text>
                        <div className="flex flex-col gap-3">
                            <Feature tone="bg-[#ef4444]/20 text-[#ef4444]" icon={<IconTrashFilled size={24} />}>
                                Use only what you need
                            </Feature>
                            <Feature tone="bg-[#22c55e]/20 text-[#22c55e]" icon={<IconAt size={24} />}>
                                Decorator-oriented
                            </Feature>
                            <Feature tone="bg-[#eab308]/20 text-[#eab308]" icon={<IconFingerprintOff size={24} />}>
                                Low memory usage
                            </Feature>
                        </div>
                        <div className="flex gap-2">
                            {/* docs.seyfert.dev no longer exists; the docs live here now */}
                            <Link href="/docs/learn/getting-started">
                                <span className={`${button} bg-(--brand-500) text-[color:ButtonText] hover:bg-(--brand-600) active:bg-(--brand-700)`}>
                                    Get started
                                </span>
                            </Link>
                            <Link target="_blank" referrerPolicy="no-referrer" href="https://discord.gg/Kxjj9HUVyc">
                                <span className={`${button} bg-(--bg-700) text-white hover:bg-(--bg-600) active:bg-(--bg-500)`}>
                                    Join the chat
                                </span>
                            </Link>
                        </div>
                    </div>
                    <HomeTerminal />
                </div>
            </Container>
        </PandaRoot>
    );
}
