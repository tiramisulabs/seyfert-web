// The source a demo shows, kept in one place so a demo and its page agree.
// Same command as the home's ECHO, without the import line.
export const ECHO_SOURCE = `const options = {
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
