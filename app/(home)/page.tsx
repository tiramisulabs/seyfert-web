import type { Metadata } from "next";
import { codeToTokens } from "shiki";
import { RevealPage, type CodeLines } from "@/components/home/reveal/reveal";
import { discordEmbedUrl } from "./discord-embed";
import { ECHO_SOURCE } from "@/lib/stage-sources";

export const metadata: Metadata = {
    title: "Seyfert | The TypeScript framework for Discord",
    description: "Build TypeScript Discord bots with fully typed commands, less boilerplate and a faster way to get started.",
    alternates: { canonical: "/" },
};

// the command the home types out, and the same file the Discord chapter
// lights line by line
const ECHO = `import {
  Declare, Options, Command, createStringOption, type CommandContext,
} from 'seyfert';

${ECHO_SOURCE}`;

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

export default async function Home() {
    const [echo, source, djs, boot] = await Promise.all([tokens(ECHO), tokens(ECHO_SOURCE), tokens(DJS), tokens(BOOT)]);
    return (
        <>
            <link rel="discord:component-embed" type="application/json" href={discordEmbedUrl} />
            <RevealPage echo={echo} source={source} djs={djs} boot={boot} />
        </>
    );
}
