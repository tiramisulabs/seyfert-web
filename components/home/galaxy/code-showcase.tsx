import { highlight } from "@/lib/highlight";
import { GeistMono } from "geist/font/mono";
import { ArmLabel } from "./arm-label";
import { CopyButton } from "./copy-button";

// First contact — the proof shot. Real, verified Seyfert echo command rendered
// server-side with shiki (vesper, warm-dark). Slots between the hero and arm 01.
// Async server component: codeToHtml runs at build/request time, the copy
// buttons are the section's only client islands.

const CODE = `import {
  Declare, Options, Command, createStringOption,
  type CommandContext,
} from 'seyfert';

const options = {
  message: createStringOption({
    description: 'What should I echo back?',
    required: true,
  }),
};

@Declare({ name: 'echo', description: 'Repeat after me' })
@Options(options)
export default class EchoCommand extends Command {
  async run(ctx: CommandContext<typeof options>) {
    //          ^ ctx.options.message is inferred as string
    await ctx.write({ content: ctx.options.message });
  }
}
// that's the whole file.`;

const INSTALL = "npm i seyfert";

export default async function CodeShowcase() {
    const html = await highlight(CODE);

    return (
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
            {/* left rail — masthead, sticky on desktop like the capabilities arm */}
            <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                <ArmLabel index="00" name="First contact" />

                <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--text-bright)]">
                    Your first command,{" "}
                    <span className="text-[var(--brand-indigo)]">fully typed</span>
                </h2>

                <p className="max-w-[42ch] text-[15px] leading-relaxed text-[var(--text-dim)]">
                    You write the command once. Decorators declare it, the
                    registry uploads it, and{" "}
                    <span className="text-[var(--text-bright)]">ctx.options</span>{" "}
                    is read straight from your schema — so the type already knows
                    what you asked for. No casts, no{" "}
                    <span className={`${GeistMono.className} text-[var(--text-bright)]`}>
                        getString()
                    </span>
                    , nothing to babysit.
                </p>

                {/* install line — mono pill with inline copy */}
                <div className="flex items-center gap-3 rounded-md border border-white/10 bg-[var(--space-deep)]/70 px-3.5 py-2.5">
                    <span
                        className={`${GeistMono.className} select-none text-[13px] leading-none text-[var(--text-dim)]/50`}
                        aria-hidden
                    >
                        $
                    </span>
                    <code
                        className={`${GeistMono.className} flex-1 text-[13px] leading-none text-[var(--text-bright)]`}
                    >
                        {INSTALL}
                    </code>
                    <CopyButton text={INSTALL} label="copy install command" />
                </div>
            </div>

            {/* right column — the editor card */}
            <div className="lg:col-span-8 lg:col-start-5">
                <div className="overflow-hidden rounded-lg border border-white/10 bg-[var(--space-deep)]/70">
                    {/* top bar — mono filename tab + copy slot, no fake macOS dots */}
                    <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
                        <span
                            className={`${GeistMono.className} inline-flex items-center gap-2 text-[11px] tracking-[0.15em] text-[var(--text-dim)]`}
                        >
                            <span
                                className="h-1.5 w-1.5 rounded-full bg-[var(--brand-indigo)]/70"
                                aria-hidden
                            />
                            src/commands/echo.ts
                        </span>
                        <CopyButton text={CODE} label="copy command source" />
                    </div>

                    {/* shiki output — bg overridden to transparent, mono + relaxed */}
                    <div
                        className={`${GeistMono.className} overflow-x-auto px-4 py-4 text-[13px] leading-relaxed [&_code]:!bg-transparent [&_pre]:!bg-transparent [&_pre]:!outline-none`}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>

                {/* microline — restates the payoff in the page's own annotation voice */}
                <p
                    className={`${GeistMono.className} mt-3 text-[11px] leading-relaxed tracking-[0.05em] text-[var(--text-dim)]`}
                >
                    {"// no casts. no getString(). the type system already knows."}
                </p>
            </div>
        </section>
    );
}
