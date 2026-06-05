import { highlight } from "@/lib/highlight";
import { GeistMono } from "geist/font/mono";
import { ArmLabel } from "./arm-label";
import { CopyButton } from "./copy-button";

// The conversion weapon: the SAME task — define and handle a /greet slash
// command with one required string option — written honestly on both sides.
// discord.js v14 is idiomatic, no strawman (SlashCommandBuilder + a separate
// handler + the implied REST registration step). Seyfert is the decorator
// pattern from the guide, verbatim API. Code is rendered SERVER-SIDE with shiki
// so there is no client runtime cost; the section reveal lives in the parent.

// ── the two sources ────────────────────────────────────────────────────────
// Honest discord.js v14: a builder you export, a handler that re-fetches the
// option by string name and trusts the `true` cast, and the registration step
// you still owe the REST API yourself.
const DISCORD_JS = `import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';

// 1 · build it — exported for a separate registration script
export const data = new SlashCommandBuilder()
  .setName('greet')
  .setDescription('Greet someone')
  .addStringOption((o) =>
    o.setName('name').setDescription('Who to greet').setRequired(true),
  );

// 2 · handle it — re-fetch the option by name, typed by faith
export async function execute(i: ChatInputCommandInteraction) {
  const name = i.options.getString('name', true); // true = trust me
  await i.reply(\`Hello, \${name}!\`);
}

// 3 · still owed: register \`data\` with the REST API yourself.
`;

// Honest Seyfert: one class. The option is declared once; the compiler infers
// ctx.options.name as string through CommandContext<typeof options>. No name
// lookup, no cast, and registration is the framework's job.
const SEYFERT = `import {
  Command, Declare, Options, createStringOption,
  type CommandContext,
} from 'seyfert';

const options = {
  name: createStringOption({
    description: 'Who to greet',
    required: true,
  }),
};

@Declare({ name: 'greet', description: 'Greet someone' })
@Options(options)
export default class Greet extends Command {
  async run(ctx: CommandContext<typeof options>) {
    // ctx.options.name is string. the compiler did the paperwork.
    await ctx.write({ content: \`Hello, \${ctx.options.name}!\` });
  }
}
// registration script not found. you don't need one.
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
                <h2 className="max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--text-bright)]">
                    Same command,{" "}
                    <span className="text-[var(--brand-indigo)]">two</span>{" "}
                    worlds
                </h2>
            </div>

            {/* the two editors — discord.js LEFT, seyfert RIGHT on desktop;
                stacked on mobile with seyfert FIRST (order utilities) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                <EditorCard
                    className="order-2 lg:order-1"
                    filename="greet.ts"
                    label="discord.js v14"
                    code={DISCORD_JS}
                    html={discordHtml}
                    caption="builder + handler + manual registration · options re-fetched by name, typed by faith"
                />
                <EditorCard
                    className="order-1 lg:order-2"
                    filename="greet.command.ts"
                    label="seyfert"
                    code={SEYFERT}
                    html={seyfertHtml}
                    caption="one class · registered for you · options inferred by the compiler · it's super effective!"
                    accent
                />
            </div>

            {/* receipts — a single mono line */}
            <div
                className={`${GeistMono.className} flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.22em] text-[var(--text-dim)]/70`}
            >
                <span className="text-[var(--brand-indigo)]">−40% lines</span>
                <span aria-hidden className="text-[var(--text-dim)]/30">
                    ·
                </span>
                <span>0 manual registrations</span>
                <span aria-hidden className="text-[var(--text-dim)]/30">
                    ·
                </span>
                <span title="these aren't the casts you're looking for.">
                    0 unchecked casts
                </span>
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
