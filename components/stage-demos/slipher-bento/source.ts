import { TEST_SOURCE } from "../testing-run/source";

// The command @slipher/eslint-plugin's require-declare flags: a class that
// extends Seyfert's Command with no @Declare on it.
export const UNDECLARED_SOURCE = `import { Command } from 'seyfert';

export default class PingCommand extends Command {}`;

// Where a tile swaps a string in place: highlighted once on the server with
// this mark standing in for the text, filled in on the client.
export const SLOT = "§";

// The echo test from Testing → Setup (the TestingRun demo's file), with its
// message left open: the testing tile runs it on one input after another.
export const ECHO_TEST_SOURCE = TEST_SOURCE.replaceAll("hello from the core", SLOT);

// The cooldown guide's ping command, the reply the watcher tile keeps editing
export const PING_SOURCE = `import { Command, Declare, type CommandContext } from 'seyfert';

@Declare({ name: 'ping', description: 'Ping' })
export default class PingCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: '${SLOT}' });
    }
}`;
