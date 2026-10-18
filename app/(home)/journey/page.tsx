import type { Metadata } from "next";
import { highlight } from "@/lib/highlight";
import { Journey } from "@/components/home/journey/journey";

// Preview of the "journey" landing: one /echo falls from the Discord gateway
// through Seyfert's rings into the core and is shot back out as a reply.
// Lives beside the spiral home so both can be compared; not indexed.
export const metadata: Metadata = {
    title: "Seyfert | Follow one command into the core",
    robots: { index: false },
};

const ECHO = `const options = {
  message: createStringOption({
    description: 'What should I echo back?',
    required: true,
  }),
};

@Declare({ name: 'echo', description: 'Repeat after me' })
@Options(options)
@Middlewares(['logger'])
export default class EchoCommand extends Command {
  async run(ctx: CommandContext<typeof options>) {
    await ctx.write({ content: ctx.options.message });
  }
}`;

const LOGGER = `export const logger = createMiddleware<void>((middle) => {
  middle.context.client.logger.info(
    \`\${middle.context.author.username} ran /\${middle.context.fullCommandName}\`,
  );
  middle.next(); // or don't. your call.
});`;

export default async function JourneyPage() {
    const [echoHtml, loggerHtml] = await Promise.all([
        highlight(ECHO),
        highlight(LOGGER),
    ]);
    return <Journey echoHtml={echoHtml} loggerHtml={loggerHtml} />;
}
