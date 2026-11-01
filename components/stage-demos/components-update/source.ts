// The handler the demo shows: the ComponentCommand from the components guide
// (content/docs/learn/components/handling-components.mdx), filtered on its
// customId and answering with ctx.update, so Discord edits the message the
// button sits on instead of sending a new one. The message's own content is
// the count ("41 clicks"), so the handler needs no storage. Without the
// import line, as the echo demo shows its command.
export const COUNT_SOURCE = `export default class CountButton extends ComponentCommand {
  componentType = 'Button' as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === 'count';
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    const clicks = Number.parseInt(ctx.message.content, 10) + 1;
    await ctx.update({
      content: \`\${clicks} clicks\`,
    });
  }
}`;
