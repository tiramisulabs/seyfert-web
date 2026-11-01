// The command @slipher/eslint-plugin's require-declare flags: a class that
// extends Seyfert's Command with no @Declare on it.
export const UNDECLARED_SOURCE = `import { Command } from 'seyfert';

export default class PingCommand extends Command {}`;
