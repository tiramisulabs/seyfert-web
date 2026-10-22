import { codeToHtml } from "shiki";
import { cn } from "@/lib/utils";
import { GradientItalic, SectionHeading } from "@/components/archive/chad/src/components/home/gradient-italic";

// Real comparison — both bots ship a working /ping slash command.
// That library that ends in .js needs every command to live in the same registry + handler.
// seyfert auto-loads /commands and uploads them once.

const virginCode = `// src/index.ts — every new command grows this file
import {
  Client, GatewayIntentBits,
  REST, Routes, SlashCommandBuilder,
} from 'that-library.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const rest = new REST({ version: '10' }).setToken(TOKEN);

await rest.put(
  Routes.applicationCommands(APP_ID),
  {
    body: [
      new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Show latency with Discord')
        .toJSON(),
    ],
  },
);

client.on('interactionCreate', async (i) => {
  if (!i.isChatInputCommand()) return;
  if (i.commandName !== 'ping') return;
  const ping = client.ws.ping;
  await i.reply(\`The latency is \\\`\${ping}\\\`\`);
});

client.login(TOKEN);`;

// Seyfert: one-time bootstrap + a file per command. Auto-loaded.
const chadCode = `// src/index.ts — written once. Auto-loads commands/.
import { Client } from 'seyfert';

const client = new Client();
client.start().then(() =>
  client.uploadCommands({ cachePath: './commands.json' }),
);

// src/commands/ping.ts — drop file → command exists
import { Declare, Command, type CommandContext } from 'seyfert';

@Declare({
  name: 'ping',
  description: 'Show latency with Discord',
})
export default class PingCommand extends Command {
  async run(ctx: CommandContext) {
    const ping = ctx.client.gateway.latency;
    await ctx.write({ content: \`The latency is \\\`\${ping}\\\`\` });
  }
}`;

async function highlight(code: string) {
  return codeToHtml(code, {
    lang: "typescript",
    theme: "github-dark-default",
  });
}

export async function CodeFight() {
  const [virginHtml, chadHtml] = await Promise.all([
    highlight(virginCode),
    highlight(chadCode),
  ]);

  return (
    <section className="flex w-full min-w-0 flex-col gap-10 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 border border-white/15 bg-white/5">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-300 font-mono">
            // The Proof
          </span>
        </div>
        <SectionHeading className="text-3xl sm:text-4xl">
          Same{" "}
          <code className="font-mono italic text-white/90 text-2xl sm:text-3xl md:text-5xl px-2 border-2 border-white/20 bg-white/5 align-baseline">/ping</code>{" "}
          command.
          <br />
          <GradientItalic variant="sky">One side looks jacked.</GradientItalic>
        </SectionHeading>
        <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
          Real code. Real comparison. No editing tricks. Spot the Chad.
        </p>
      </div>

      <div className="grid w-full min-w-0 gap-[2px] border border-white/10 bg-white/10 md:grid-cols-2">
        <CodeBlock
          label="The Virgin"
          framework="that-library.js"
          loc={28}
          files="1 file, grows per command"
          loader="manual REST.put + handler switch"
          html={virginHtml}
          virgin
        />
        <CodeBlock
          label="The Chad"
          framework="seyfert"
          loc={16}
          files="bootstrap + 1 file per command"
          loader="auto-load from /commands"
          html={chadHtml}
        />
      </div>

      {/* Conclusion strip */}
      <div className="border-y border-white/15 bg-white/[0.02] py-4 sm:-mx-6">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-1 text-center text-[10px] uppercase tracking-[0.15em] font-mono text-zinc-500 sm:gap-x-8 sm:tracking-[0.3em]">
          <span>
            <span className="text-white font-bold">~43% LESS CODE</span>{" "}
            <span className="text-zinc-700">·</span>{" "}
            <span>same feature</span>
          </span>
          <span className="text-white/30">★</span>
          <span>
            <span className="text-white font-bold">AUTOLOADED</span>{" "}
            <span className="text-zinc-700">·</span>{" "}
            <span>drop file → command exists</span>
          </span>
          <span className="text-white/30">★</span>
          <span>
            <span className="text-white font-bold">DECORATORS</span>{" "}
            <span className="text-zinc-700">·</span>{" "}
            <span>no REST.put, no switch case</span>
          </span>
        </div>
      </div>
    </section>
  );
}

function CodeBlock({
  label,
  framework,
  loc,
  files,
  loader,
  html,
  virgin = false,
}: {
  label: string;
  framework: string;
  loc: number;
  files: string;
  loader: string;
  html: string;
  virgin?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col bg-[#0a0a0a]",
        virgin && "opacity-95"
      )}
    >
      {/* Card header */}
      <div className="flex min-w-0 items-center justify-between gap-2 px-5 py-3 border-b border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.25em] font-mono font-bold",
              virgin ? "text-red-500/80" : "text-emerald-400"
            )}
          >
            // {label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-600">
          <span
            className={cn(
              "font-bold",
              virgin ? "text-red-500/80" : "text-emerald-400"
            )}
          >
            {loc} LOC
          </span>
        </div>
      </div>

      {/* Framework name */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <span
          className={cn(
            "text-3xl select-none",
            virgin && "grayscale opacity-60"
          )}
        >
          {virgin ? "😬" : "💪"}
        </span>
        <h3
          className={cn(
            "text-2xl md:text-3xl font-black uppercase italic leading-none tracking-tight",
            virgin ? "text-zinc-500" : "text-white"
          )}
        >
          {framework}
        </h3>
      </div>

      {/* Code */}
      <div
        className={cn(
          "min-w-0 max-w-full overflow-x-auto",
          "text-[12px] sm:text-[13px] font-mono leading-[1.7]",
          "p-5 bg-[#0d1117] flex-1",
          // shiki output: remove inner pre padding/bg so our wrapper styles it
          "[&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:w-max [&_pre]:min-w-full",
          "[&_code]:!bg-transparent [&_code]:whitespace-pre",
          virgin && "saturate-[0.7]"
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Stat footer */}
      <div className="grid grid-cols-2 border-t border-white/10">
        <StatCell label="File layout" value={files} highlight={!virgin} />
        <StatCell label="Command loader" value={loader} highlight={!virgin} />
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 px-4 py-3 border-r last:border-r-0 border-white/10">
      <div className="text-[9px] uppercase tracking-[0.25em] font-mono text-zinc-600">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-xs font-bold uppercase tracking-wider break-words",
          highlight ? "text-white" : "text-zinc-500"
        )}
      >
        {value}
      </div>
    </div>
  );
}
