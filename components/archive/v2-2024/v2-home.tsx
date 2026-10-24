import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import logo from "@/public/logo.svg";
import Particles from "@/components/archive/legacy-2024/particles";
import { Container, Heading, PandaRoot, Text, brandV2 } from "@/components/archive/legacy-2024/panda";
import {
    IconAlbum,
    IconArrowBadgeRightFilled,
    IconBrandGithubFilled,
    IconBrandTypescript,
    IconBubbleFilled,
    IconChartArrowsVertical,
    IconCheck,
    IconMoodHappyFilled,
    IconPalette,
} from "@/components/archive/legacy-2024/tabler-icons";

// The Seyfert v2 era landing (Aug 2024 – Jan 2025): layout.tsx, header.tsx,
// page.tsx and modules/home/{bench,features,bots,haters}.tsx as of 6c3b533,
// the last commit before the site moved to Fumadocs. Panda props are
// translated 1:1 into classes; copy, numbers and quotes are the 2024 ones.

// recipes/button.ts at the time: radius full, brand + gray colors
const buttonBase =
    "relative inline-flex w-fit cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full font-medium duration-300";
const buttonSize = { md: "h-10 px-5 py-2", lg: "h-11 px-6 py-4" } as const;
const buttonBrand = "bg-(--brand-500) text-[color:ButtonText] hover:bg-(--brand-600) active:bg-(--brand-700)";
const buttonGray = "bg-(--bg-700) text-white hover:bg-(--bg-600) active:bg-(--bg-500)";

// recipes/card.ts
const card = "h-full w-full rounded-[0.75rem] border border-(--bg-600) bg-(--bg-800) p-4 transition-all duration-150";

function Header() {
    return (
        <header className="sticky top-0 z-[100] w-full border-b-2 border-(--bg-600) bg-(--bg-800)/50 py-5 backdrop-blur-sm">
            <Container className="w-full">
                <div className="flex items-center justify-between">
                    {/* the logo linked home; home is the design index now */}
                    <Link href="/" aria-label="Seyfert">
                        <div className="flex items-center">
                            <Image src={logo} alt="" className="mt-[-1px] mr-[-2px] h-[30px] w-[30px]" />
                            <Heading as="span">eyfert</Heading>
                        </div>
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

const bench = [
    { name: "Seyfert", width: "35%", memory: "75 MB", gradient: true },
    { name: "Eris", width: "40%", memory: "79 MB" },
    { name: "Discord.js", width: "50%", memory: "89 MB" },
    { name: "Detritus", width: "60%", memory: "99 MB" },
    { name: "Oceanic", width: "65%", memory: "104 MB" },
];

function HomeBench() {
    return (
        <div className="w-full text-[0.75rem] sm:text-[0.875rem] md:w-3/4 md:text-[1rem] lg:w-full">
            <div className="flex w-full flex-col items-center gap-2 sm:gap-3 md:gap-4">
                {bench.map((item) => (
                    <div key={item.name} className="flex w-full items-center gap-[10px]">
                        <Text className="w-full max-w-16 sm:max-w-24 md:max-w-32">{item.name}</Text>
                        <div className="flex w-full items-center gap-[10px] rounded-[0.375rem] border border-(--bg-400) p-0.5">
                            <div
                                className={`h-6 rounded-[0.375rem] sm:h-8 md:h-10 ${
                                    item.gradient
                                        ? "bg-linear-to-r from-(--brand-500) to-[#22c55e]"
                                        : "bg-(--bg-400)"
                                }`}
                                style={{ width: item.width }}
                            />
                            <Text>{item.memory}</Text>
                        </div>
                    </div>
                ))}
                <div className="mt-2 sm:mt-4 md:mt-6">
                    {/* the 2024 chart page is gone; today's benchmark lives at /benchmark */}
                    <Link href="/benchmark">
                        <span
                            className={`${buttonBase} ${buttonSize.md} ${buttonBrand} font-bold transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#4ade80] hover:text-white hover:shadow-[0_0_15px_rgba(0,255,0,0.5)]`}
                        >
                            View Benchmark
                            <IconArrowBadgeRightFilled size={20} style={{ marginLeft: "8px" }} />
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

const features = [
    {
        icon: IconBrandTypescript,
        title: "Written in TypeScript",
        body: "Seyfert is fully written from scratch in TypeScript with modern practices so you don't need to worry about stability.",
    },
    {
        icon: IconChartArrowsVertical,
        title: "Scalable",
        body: "Seyfert is tested on both big and small bots and there were perfect performance results on both of them.",
    },
    {
        icon: IconMoodHappyFilled,
        title: "Effortless Development",
        body: "Developer experience is at the core of Seyfert, with a focus on easy setup to only worry about your bot's logic.",
    },
    {
        icon: IconPalette,
        title: "Full customization",
        body: "Seyfert makes customization easier than ever, with Seyfert you can customize each aspect of your bot's functions, from cache to behaviors!",
    },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex w-full flex-col items-start gap-[10px]">
            <Heading size="3xl" className="mb-4 md:mb-6">
                {title}
            </Heading>
            {children}
        </div>
    );
}

function HomeFeatures() {
    return (
        <Section title="Features">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                {features.map(({ icon: Icon, title, body }, i) => (
                    <div key={title} className={card}>
                        <div className="flex h-full flex-col items-start gap-[10px]">
                            <Icon className="h-9 w-9" />
                            <Heading as="h3" size="lg" className={i === 0 ? "md:text-[1.25rem]" : undefined}>
                                {title}
                            </Heading>
                            <Text>{body}</Text>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

const bots = [
    {
        displayName: "CactusFire",
        username: "CactusFire#3759",
        id: "543567770579894272",
        avatar: "cactusfire",
        guilds: 290000,
        content:
            "I think choosing Seyfert is a very good option, we have been working with Discord.js & Discordeno for years, and yes... It's good, but for large scale bots... nothing better than Seyfert. Besides it's a team that is very attentive, and gives us a hand whenever they can.",
    },
    {
        displayName: "Listen",
        username: "Listen#7518",
        id: "777401960793636934",
        avatar: "listen",
        guilds: 5100,
        content:
            "After years of experience with Discord.js, Discordeno and Eris, Seyfert proved to be unmatched for large-scale music bots - dropping our RAM usage to under 1 GB (from almost 4 GB) while handling 200% more servers. This allowed us to finally focus on our features without any constraints over all these years.",
    },
];

function HomeBots() {
    return (
        <Section title="Bots using Seyfert">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
                {bots.map((bot) => (
                    <div key={bot.id} className={card}>
                        <div className="flex h-full flex-col items-start gap-3">
                            <div className="flex flex-col items-center justify-between gap-[10px] md:w-full md:flex-row">
                                <div className="flex items-center gap-3">
                                    {/* same avatars as 2024, served from today's thumbnails */}
                                    <Image
                                        width={50}
                                        height={50}
                                        alt={bot.displayName}
                                        src={`/bots/thumbs/${bot.avatar}.webp`}
                                        className="rounded-full"
                                    />
                                    <div className="flex flex-col items-start">
                                        <Heading as="h3" size="2xl">{bot.displayName}</Heading>
                                        <Text className="text-[0.875rem] text-(--bg-300)">@{bot.username}</Text>
                                    </div>
                                </div>
                                <Text className="text-[1.5rem] font-bold">
                                    {bot.guilds.toLocaleString("en-US")} servers
                                </Text>
                            </div>
                            <Text className="h-full">{bot.content}</Text>
                            <Link
                                target="_blank"
                                referrerPolicy="no-referrer"
                                href={`https://discord.com/oauth2/authorize?client_id=${bot.id}&permissions=0&scope=bot%20applications.commands`}
                            >
                                <span className={`${buttonBase} ${buttonSize.md} ${buttonBrand}`}>Add bot</span>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

const haters = [
    { displayName: "Socram09", username: "socram09", content: "I have no idea how this thing turns on." },
    { displayName: "MARCROCK22", username: "marcrock22", content: "I don't even know why I made this shit" },
    { displayName: "FreeAoi", username: "freeaoi", content: "GOMEN AMANAI" },
    { displayName: "Deivid", username: "deivid", content: "Breakfast every day. Today I am fasting." },
    { displayName: "JustEvil", username: "justevil", content: "Is so good that I can't even use it." },
    { displayName: "Sawako", username: "sawa_ko", content: "I hate seyfert so much that I sponsor them >:(" },
    { displayName: "Miia", username: "miia", content: "Seyfert works until you switch it on." },
    { displayName: "Shisui San", username: "shisuisan", content: "Seyfert better keep working else I will be fired" },
];

function HomeHaters() {
    return (
        <Section title="Everyone loves Seyfert!">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {haters.map((hater) => (
                    <div key={hater.username} className={card}>
                        <div className="flex h-full flex-col items-start gap-3">
                            <div className="flex items-center gap-3">
                                <Image
                                    width={50}
                                    height={50}
                                    alt={hater.displayName}
                                    src={`/haters/${hater.username}.png`}
                                    className="rounded-full"
                                />
                                <div className="flex flex-col items-start">
                                    <Heading as="h3" size="2xl">{hater.displayName}</Heading>
                                    <Text className="text-[0.875rem] text-(--bg-300)">@{hater.username}</Text>
                                </div>
                            </div>
                            <Text>{hater.content}</Text>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function Check({ children }: { children: string }) {
    return (
        <div className="flex items-center gap-2">
            <IconCheck size={24} className="text-[#22c55e]" />
            <Text>{children}</Text>
        </div>
    );
}

export function V2Home() {
    return (
        <PandaRoot brand={brandV2}>
            <Particles className="absolute inset-0" quantity={300} ease={80} refresh />
            <Header />
            <Container as="main" className="py-11">
                <div className="flex flex-col gap-8 md:gap-12">
                    <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center lg:gap-0">
                        <div className="flex max-w-full flex-col gap-4 lg:max-w-3xl">
                            <span className="inline-flex w-fit items-center justify-center rounded-[0.375rem] bg-(--brand-950) px-3 py-0.5 text-[0.875rem] font-medium text-(--brand-500)">
                                <Link href="https://github.com/tiramisulabs/seyfert/releases" target="_blank">
                                    <span className="flex items-center">
                                        <span>Seyfert 2.2.0 is out!</span>
                                        <IconAlbum size={16} className="ml-2" />
                                    </span>
                                </Link>
                            </span>
                            <Heading as="h1" size="5xl">
                                The Discord framework that{" "}
                                <span className="my-2 inline-block rounded-[0.75rem] bg-(--brand-500)/20 px-2 py-1 font-mono text-(--brand-500) italic sm:px-4 md:my-0 md:px-6">
                                    satisfies
                                </span>{" "}
                                you
                            </Heading>
                            <Text className="pr-0 lg:pr-5">
                                Seyfert is a brand new, edge-bleeding Discord framework made with scalability and performance in mind.
                            </Text>
                            <div className="flex flex-col gap-3">
                                <Check>TypeScript first</Check>
                                <Check>Batteries included</Check>
                                <Check>Low memory usage, always</Check>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <Link href="/docs/learn/getting-started" className="w-full sm:w-auto">
                                    <span className={`${buttonBase} ${buttonSize.lg} ${buttonBrand} w-full sm:w-auto`}>Get started</span>
                                </Link>
                                <Link
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    href="https://discord.gg/XNw2RZFzaP"
                                    className="w-full sm:w-auto"
                                >
                                    <span className={`${buttonBase} ${buttonSize.lg} ${buttonGray} w-full sm:w-auto`}>
                                        Join the chat now
                                    </span>
                                </Link>
                            </div>
                        </div>
                        <div className="w-full lg:w-[36rem]">
                            <HomeBench />
                        </div>
                    </div>
                    <HomeFeatures />
                    <HomeBots />
                    <HomeHaters />
                    <div className="w-full rounded-[0.75rem] bg-(--brand-600) p-4 text-(--bg-900) md:p-6">
                        <div className="flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 md:gap-4">
                                <IconBubbleFilled size={32} />
                                <Heading size="xl">Join the party</Heading>
                                <Text className="text-center">Join the discussion and seek help if you need to!</Text>
                                <Link href="https://discord.gg/XNw2RZFzaP" target="_blank">
                                    <span className={`${buttonBase} ${buttonSize.md} ${buttonBrand}`}>
                                        Join the Discord server
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </PandaRoot>
    );
}
