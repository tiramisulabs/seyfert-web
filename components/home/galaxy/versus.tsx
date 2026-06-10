import { highlight } from "@/lib/highlight";
import { GeistMono } from "geist/font/mono";
import { ArmLabel } from "./arm-label";
import { CopyButton } from "./copy-button";

// The conversion weapon: the SAME task — boot a working bot — written
// honestly on both sides. discord.js v14 is idiomatic, no strawman: the
// official-guide boot with its hand-rolled command loader, interaction
// dispatcher and the deploy-commands script you run by hand. Seyfert is the
// setup-project guide verbatim: a config that says where things live and a
// start() that does the rest. Code is rendered SERVER-SIDE with shiki so
// there is no client runtime cost; the section reveal lives in the parent.

// ── the two sources ────────────────────────────────────────────────────────
// Honest discord.js v14 boot, straight from their guide: ceremony, loader,
// dispatcher, login — and registration still lives in a separate script.
const DISCORD_JS = `import {
  Client, Collection, GatewayIntentBits, Events,
} from 'discord.js';
import { readdirSync } from 'node:fs';

// 1 · the ceremony
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
client.commands = new Collection();

// 2 · hand-roll a command loader
for (const file of readdirSync('./commands')) {
  const command = require(\`./commands/\${file}\`);
  client.commands.set(command.data.name, command);
}

// 3 · hand-roll a dispatcher
client.on(Events.InteractionCreate, async (i) => {
  if (!i.isChatInputCommand()) return;
  await client.commands.get(i.commandName)?.execute(i);
});

client.login(process.env.TOKEN);

// 4 · still owed: node deploy-commands.js, by hand
`;

// Honest Seyfert, from the setup guide: the config declares where commands
// live; start() connects, loads everything and uploads the commands itself.
const SEYFERT = `// seyfert.config.mjs
import { config } from 'seyfert';

export default config.bot({
  token: process.env.BOT_TOKEN ?? '',
  locations: { base: 'dist', commands: 'commands' },
  intents: ['Guilds'],
});

// src/index.ts
import { Client } from 'seyfert';

const client = new Client();

// connects, loads everything, uploads your commands
client.start().then(() =>
  client.uploadCommands({ cachePath: './commands.json' }));

// that's the boot. all of it.
`;

export default async function Versus({ number = "0X" }: { number?: string }) {
    // Render both sides server-side. vesper is a warm-dark bundled shiki theme
    // that sits naturally on the page's deep-space surface.
    const [discordHtml, seyfertHtml] = await Promise.all([
        highlight(DISCORD_JS),
        highlight(SEYFERT),
    ]);

    return (
        <section className="flex flex-col gap-12">
            {/* masthead */}
            <div className="flex flex-col gap-6">
                <ArmLabel index={number} name="The difference" />
                <h2 className="max-w-[18ch] text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--text-bright)]">
                    Same boot,{" "}
                    <span className="text-[var(--brand-indigo)]">two</span>{" "}
                    worlds
                </h2>
            </div>

            {/* the two editors — discord.js LEFT, seyfert RIGHT on desktop;
                stacked on mobile with seyfert FIRST (order utilities) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                <EditorCard
                    className="order-2 lg:order-1"
                    filename="index.js"
                    label="discord.js v14"
                    code={DISCORD_JS}
                    html={discordHtml}
                    caption="a loader, a dispatcher, a login — and a deploy script you still run by hand"
                />
                <EditorCard
                    className="order-1 lg:order-2"
                    filename="seyfert.config.mjs + index.ts"
                    label="seyfert"
                    code={SEYFERT}
                    html={seyfertHtml}
                    caption="say where things live · start() does the rest · it's super effective!"
                    accent
                />
            </div>

            {/* receipts — a single mono line */}
            <div
                className={`${GeistMono.className} flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-dim)]/70`}
            >
                <span className="text-[var(--brand-indigo)]">0 loaders</span>
                <span aria-hidden className="text-[var(--text-dim)]/30">
                    ·
                </span>
                <span>0 dispatchers</span>
                <span aria-hidden className="text-[var(--text-dim)]/30">
                    ·
                </span>
                <span>0 deploy scripts</span>
            </div>

            {/* Miller's planet, but for migrations */}
            <p
                className={`${GeistMono.className} -mt-8 text-[11px] leading-relaxed tracking-[0.05em] text-[var(--text-dim)]/70`}
            >
                {"// one hour here is seven years in discord.js"}
            </p>

        </section>
    );
}

// One editor card: hairline-bordered surface, slim top bar with a mono filename
// tab + copy slot, then the shiki-rendered body. The seyfert card carries a
// brand-indigo hairline accent on its filename tab; discord.js reads dimmer.
function EditorCard({
    filename,
    label,
    code,
    html,
    caption,
    accent = false,
    className = "",
}: {
    filename: string;
    label: string;
    code: string;
    html: string;
    caption: string;
    accent?: boolean;
    className?: string;
}) {
    return (
        <figure className={`flex min-w-0 flex-col gap-3 ${className}`}>
            <div
                className={`flex min-w-0 flex-col overflow-hidden rounded-lg border bg-[var(--space-deep)]/70 ${
                    accent ? "border-white/10" : "border-white/[0.07]"
                }`}
            >
                {/* top bar — no fake macOS dots; a filename tab + copy slot */}
                <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                        {/* filename tab; seyfert gets the indigo hairline accent */}
                        <span
                            className={`${GeistMono.className} truncate border-b pb-[3px] text-[11px] tracking-[0.08em] ${
                                accent
                                    ? "border-[var(--brand-indigo)] text-[var(--text-bright)]"
                                    : "border-transparent text-[var(--text-dim)]"
                            }`}
                        >
                            {filename}
                        </span>
                        <span
                            className={`${GeistMono.className} shrink-0 text-[9px] uppercase tracking-[0.24em] ${
                                accent
                                    ? "text-[var(--brand-indigo)]/80"
                                    : "text-[var(--text-dim)]/50"
                            }`}
                        >
                            {label}
                        </span>
                    </div>
                    <CopyButton text={code} />
                </div>

                {/* body — shiki output, bg overridden to transparent, mono font */}
                <div
                    className={`${GeistMono.className} overflow-x-auto px-4 py-4 text-[13px] leading-relaxed [&_code]:!bg-transparent [&_pre]:!bg-transparent`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>

            {/* caption — the asymmetry, surfaced in mono */}
            <figcaption
                className={`${GeistMono.className} px-1 text-[10px] uppercase leading-relaxed tracking-[0.18em] ${
                    accent
                        ? "text-[var(--brand-indigo)]/70"
                        : "text-[var(--text-dim)]/55"
                }`}
            >
                {caption}
            </figcaption>
        </figure>
    );
}
