import type { Metadata } from "next";
import { codeToTokens } from "shiki";
import { RevealPage, type CodeLines } from "@/components/home/reveal/reveal";

// Experiment: a trailer-style reveal (think the GTA VI preview site) — the
// SEYFERT wordmark you scroll *through* into the black hole, then pinned
// chapters the scroll assembles, strikes out and counts down. Not indexed.
export const metadata: Metadata = {
    title: "Seyfert | The TypeScript framework for Discord",
    robots: { index: false },
};

const ECHO = `import {
  Declare, Options, Command, createStringOption, type CommandContext,
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
}`;

// the discord.js v14 guide's boot, honestly: loader, dispatcher, and a
// separate deploy script you still run by hand
const DJS = `const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const folders = readdirSync(join(__dirname, 'commands'));
for (const folder of folders) {
  const files = readdirSync(join(__dirname, 'commands', folder));
  for (const file of files.filter((f) => f.endsWith('.js'))) {
    const command = require(join(__dirname, 'commands', folder, file));
    client.commands.set(command.data.name, command);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  await command.execute(interaction);
});

client.login(token);
// …then: node deploy-commands.js`;

const BOOT = `// seyfert.config.mjs
export default config.bot({
  token: process.env.BOT_TOKEN ?? '',
  locations: { base: 'dist', commands: 'commands' },
  intents: ['Guilds'],
});

// src/index.ts
const client = new Client();
client.start().then(() => client.uploadCommands());`;

async function tokens(code: string): Promise<CodeLines> {
    const { tokens } = await codeToTokens(code, { lang: "ts", theme: "vesper" });
    return tokens.map((line) => line.map((t) => ({ c: t.content, k: t.color ?? "#e5e5e5" })));
}

export default async function Page() {
    const [echo, djs, boot] = await Promise.all([tokens(ECHO), tokens(DJS), tokens(BOOT)]);
    return <RevealPage echo={echo} djs={djs} boot={boot} />;
}
