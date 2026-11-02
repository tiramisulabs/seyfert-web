import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import ComponentsUpdate from "@/components/stage-demos/components-update";
import { COUNT_SOURCE } from "@/components/stage-demos/components-update/source";
import { SlipherMap, type MapPackage } from "@/components/docs/slipher-map";
import { Cooldown, Http, Lint, Redis, Testing, Watch } from "@/components/stage-demos/slipher-bento";
import { ECHO_TEST_SOURCE, PING_SOURCE, UNDECLARED_SOURCE } from "@/components/stage-demos/slipher-bento/source";
import { CacheIntegrityTile } from "@/components/stage-demos/slipher-bento/tiles/cache-integrity";
import { ChartjsTile } from "@/components/stage-demos/slipher-bento/tiles/chartjs";
import { CHART_SOURCE } from "@/components/stage-demos/slipher-bento/tiles/chartjs.source";
import { LoggerTile } from "@/components/stage-demos/slipher-bento/tiles/logger";
import { OpenTelemetryTile } from "@/components/stage-demos/slipher-bento/tiles/otel";
import { PlayerTile } from "@/components/stage-demos/slipher-bento/tiles/player";
import { ProxyTile } from "@/components/stage-demos/slipher-bento/tiles/proxy";
import { QueuesTile } from "@/components/stage-demos/slipher-bento/tiles/queues";
import { SchedulerTile } from "@/components/stage-demos/slipher-bento/tiles/scheduler";
import { VoiceTile } from "@/components/stage-demos/slipher-bento/tiles/voice";
import { WebhooksTile } from "@/components/stage-demos/slipher-bento/tiles/webhooks";
import { YunaTile } from "@/components/stage-demos/slipher-bento/tiles/yuna";
import TestingRun from "@/components/stage-demos/testing-run";
import { TEST_SOURCE } from "@/components/stage-demos/testing-run/source";
import TypesCloseup from "@/components/stage-demos/types-closeup";
import { stageTokens } from "@/lib/stage-code";
import { ECHO_SOURCE } from "@/lib/stage-sources";

// Product demos placed in the guides. Each is a figure: the stage is
// decorative (its faux UI would read as noise to a screen reader) and the
// caption says what it shows. The docs column wants the wide design down to
// a phone, so compact only takes over under 560px.
function Plate({ caption, children }: { caption: ReactNode; children: ReactNode }) {
    return (
        <figure className={`not-prose sy-plate my-8 ${GeistSans.variable} ${GeistMono.variable}`}>
            <div aria-hidden className="overflow-hidden rounded-[14px] bg-[#05070d] ring-1 ring-black/10 dark:ring-white/10">
                {children}
            </div>
            <figcaption className={`${GeistMono.className} mt-3 text-[12px] leading-relaxed text-fd-muted-foreground`}>{caption}</figcaption>
        </figure>
    );
}

export async function OptionInferenceDemo() {
    const code = await stageTokens(ECHO_SOURCE);
    return (
        <Plate caption="Flip required and the option's type follows: string becomes string | undefined.">
            <TypesCloseup code={code} compactBelow={560} />
        </Plate>
    );
}

export async function ComponentUpdateDemo() {
    const code = await stageTokens(COUNT_SOURCE);
    return (
        <Plate caption="filter() routes the click by customId, run() edits the message in place with ctx.update.">
            <ComponentsUpdate code={code} compactBelow={560} variant="docs" />
        </Plate>
    );
}

export async function TestingRunDemo() {
    const code = await stageTokens(TEST_SOURCE);
    return (
        <Plate caption="A slash command dispatched to the mock bot and asserted on, without a token or a gateway.">
            <TestingRun code={code} compactBelow={560} />
        </Plate>
    );
}

// The official packages page's map: every package a node, each with its tile
// (SlipherMap). Lines and installs are the page's former tables'; kinds are
// the page's three categories. Packages that share a tile (the two HTTP
// adapters) light together. Edge packages carry their traffic's way: the
// HTTP adapters and webhooks take Discord's requests in, the proxy sends the
// bot's REST calls out.
const MAP_PACKAGES: MapPackage[] = [
    { name: "@slipher/uws-adapter", flow: "in", kind: "Adapter", zone: "edge", tile: "http", line: "Replaces the HTTP server with uWebSockets.js.", install: "pnpm add @slipher/uws-adapter", href: "/docs/learn/getting-started/setup-project" },
    { name: "@slipher/generic-adapter", flow: "in", kind: "Adapter", zone: "edge", tile: "http", line: "Replaces the HTTP server for webhook-based bots.", install: "pnpm add @slipher/generic-adapter", href: "/docs/recipes/cloudflare-workers" },
    { name: "@slipher/webhooks", flow: "in", kind: "Utility", zone: "edge", tile: "webhooks", line: "Discord webhook event handling.", install: "pnpm add @slipher/webhooks" },
    { name: "@slipher/proxy", flow: "out", kind: "Adapter", zone: "edge", tile: "proxy", line: "A REST proxy in front of Discord.", install: "pnpm add @slipher/proxy" },
    { name: "@slipher/cooldown", kind: "Plugin", zone: "client", tile: "cooldown", line: "Per-command rate limits by user, guild, channel, or globally.", install: "pnpm add @slipher/cooldown", href: "/docs/plugins/official/cooldown" },
    { name: "yunaforseyfert", kind: "Plugin", zone: "client", tile: "yuna", line: "Advanced prefix/text command parser: named options, dynamic prefixes, and watchers.", install: "pnpm add yunaforseyfert", href: "/docs/plugins/official/yuna" },
    { name: "@slipher/chartjs", kind: "Utility", zone: "client", tile: "chartjs", line: "Render Chart.js charts to images for message attachments.", install: "pnpm add @slipher/chartjs", href: "/docs/plugins/official/chartjs" },
    { name: "@slipher/scheduler", kind: "Plugin", zone: "client", tile: "scheduler", line: "Cron and interval jobs managed from the Seyfert lifecycle.", install: "pnpm add @slipher/scheduler", href: "/docs/plugins/official/scheduler" },
    { name: "@slipher/queues", kind: "Plugin", zone: "client", tile: "queues", line: "Background job queues with producers and processors.", install: "pnpm add @slipher/queues", href: "/docs/plugins/official/queues" },
    { name: "@slipher/logger", kind: "Plugin", zone: "client", tile: "logger", line: "Structured, request-aware logging with pluggable backends.", install: "pnpm add @slipher/logger", href: "/docs/plugins/official/logger" },
    { name: "@slipher/voice", kind: "Plugin", zone: "client", tile: "voice", line: "Connect to Discord voice, maintain DAVE protection, and send or receive encoded Opus audio.", install: "pnpm add @slipher/voice", href: "/docs/plugins/official/voice" },
    { name: "@slipher/player", kind: "Plugin", zone: "client", tile: "player", line: "Resolve and transcode media, then manage playback queues on top of @slipher/voice.", install: "pnpm add @slipher/player", href: "/docs/plugins/official/player" },
    { name: "@slipher/opentelemetry", kind: "Plugin", zone: "client", tile: "otel", line: "Automatic traces and duration metrics for interactions, events, Discord REST, and cache operations.", install: "pnpm add @slipher/opentelemetry", href: "/docs/plugins/official/opentelemetry" },
    { name: "@slipher/redis-adapter", kind: "Adapter", zone: "cache", tile: "redis", line: "Replaces the cache with a distributed, Redis-backed one.", install: "pnpm add @slipher/redis-adapter", href: "/docs/recipes/cache" },
    { name: "@slipher/cache-integrity", kind: "Plugin", zone: "cache", tile: "cache-integrity", line: "Reuse recently written values while isolating stale persistent relationships.", install: "pnpm add @slipher/cache-integrity", href: "/docs/plugins/official/cache-integrity" },
    { name: "@slipher/testing", kind: "Utility", zone: "dev", tile: "testing", line: "Test fixtures and helpers for Seyfert apps.", install: "pnpm add -D @slipher/testing", href: "/docs/testing" },
    { name: "@slipher/watcher", kind: "Utility", zone: "dev", tile: "watcher", line: "Hot-reload for development.", install: "pnpm add -D @slipher/watcher", href: "/docs/recipes/hot-reload" },
    { name: "@slipher/eslint-plugin", kind: "Utility", zone: "dev", tile: "eslint", line: "Type-aware ESLint rules for Seyfert mistakes that would fail at runtime.", install: "pnpm add -D @slipher/eslint-plugin", href: "/docs/recipes/eslint" },
];

export async function SlipherMapDemo() {
    const [lint, test, ping, chart] = await Promise.all([stageTokens(UNDECLARED_SOURCE), stageTokens(ECHO_TEST_SOURCE), stageTokens(PING_SOURCE), stageTokens(CHART_SOURCE)]);
    const tiles: Record<string, ReactNode> = {
        http: <Http wideHeight={280} />,
        webhooks: <WebhooksTile />,
        proxy: <ProxyTile />,
        cooldown: <Cooldown />,
        yuna: <YunaTile />,
        chartjs: <ChartjsTile code={chart} />,
        scheduler: <SchedulerTile />,
        queues: <QueuesTile />,
        logger: <LoggerTile />,
        voice: <VoiceTile />,
        player: <PlayerTile />,
        otel: <OpenTelemetryTile />,
        redis: <Redis />,
        "cache-integrity": <CacheIntegrityTile />,
        testing: <Testing code={test} />,
        watcher: <Watch code={ping} />,
        eslint: <Lint code={lint} />,
    };
    return <SlipherMap className={`${GeistSans.variable} ${GeistMono.variable}`} packages={MAP_PACKAGES} tiles={tiles} />;
}
