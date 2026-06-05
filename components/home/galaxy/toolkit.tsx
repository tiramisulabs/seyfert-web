import { highlight } from "@/lib/highlight";
import { ArmLabel } from "./arm-label";
import { ToolkitTabs, type ToolkitPane } from "./toolkit-tabs";

// THE TOOLKIT — the journey's code beat. Four files = a whole bot: the
// command itself, a guard in front of it, components that answer back and
// replies in any language. Each pane is REAL code lifted from the guide
// (getting-started/first-command, commands/middlewares, components/
// collectors, i18n/languages). The framing deliberately avoids re-singing
// the type story — versus and capabilities already own it. Async server
// component: shiki renders all four panes here, the client island only swaps.

const COMMAND = `import {
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
    await ctx.write({ content: ctx.options.message });
  }
}
// that's the whole file.`;

const MIDDLEWARE = `import { createMiddleware } from 'seyfert';

// runs before any command that asks for it — verify, log, bail
export const logger = createMiddleware<void>((middle) => {
  middle.context.client.logger.info(
    \`\${middle.context.author.username} ran /\${middle.context.resolver.fullCommandName}\`,
  );
  middle.next(); // or don't. your call.
});

// then, on any command — one line:
@Middlewares(['logger'])`;

const COLLECTOR = `const row = new ActionRow<Button>().setComponents([
  new Button().setCustomId('hello').setLabel('Hello!')
    .setStyle(ButtonStyle.Primary),
]);

const message = await ctx.write({ components: [row] }, true);

// clicks belong to THIS message — no global handler maze
const collector = message.createComponentCollector();
collector.run('hello', (i) => i.write({ content: 'world' }));`;

const I18N = `// languages/en.ts
export default {
  ping: { reply: ({ ms }: { ms: number }) => \`pong: \${ms}ms\` },
};

// in your command — t is typed from the file above
const t = ctx.t.get('en');
await ctx.write({
  content: t.ping.reply({ ms: ctx.client.gateway.latency }),
});
// add es.ts, ja.ts, pt.ts — same shape, served per locale.`;

const PANES: Omit<ToolkitPane, "html">[] = [
    {
        id: "commands",
        file: "echo.command.ts",
        label: "Commands",
        code: COMMAND,
        caption:
            "declare it and run it — registration and uploads happen on their own",
    },
    {
        id: "middlewares",
        file: "logger.middleware.ts",
        label: "Middlewares",
        code: MIDDLEWARE,
        caption:
            "guards, logging, cooldowns — one decorator, the chain runs before your command",
    },
    {
        id: "components",
        file: "hello.command.ts",
        label: "Components",
        code: COLLECTOR,
        caption: "component interactions scoped to the message that owns them",
    },
    {
        id: "i18n",
        file: "en.lang.ts",
        label: "i18n",
        code: I18N,
        caption:
            "your bot in every language — locales are plain files, served per server",
    },
];

export default async function Toolkit() {
    const panes: ToolkitPane[] = await Promise.all(
        PANES.map(async (p) => ({ ...p, html: await highlight(p.code) })),
    );

    return (
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
            {/* masthead — left rail, sticky like first contact's */}
            <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                <ArmLabel index="02" name="The toolkit" />

                <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--text-bright)]">
                    Your whole bot,{" "}
                    <span className="text-[var(--brand-indigo)]">
                        in four files
                    </span>
                </h2>

                <p className="max-w-[42ch] text-[15px] leading-relaxed text-[var(--text-dim)]">
                    A command. A guard in front of it. Buttons that talk back.
                    Replies in any language. The everyday machinery of a real
                    bot, already wired in. Pick a tab, steal the code.
                </p>
            </div>

            {/* right column — the instrument panel */}
            <div className="lg:col-span-8 lg:col-start-5">
                <ToolkitTabs panes={panes} />
            </div>
        </section>
    );
}
