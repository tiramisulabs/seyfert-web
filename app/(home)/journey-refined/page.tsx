import { highlight } from "@/lib/highlight";
import { archiveMetadata } from "@/lib/design-archive";
import { JourneyRefined, type EchoPart } from "@/components/home/journey-refined/journey-refined";

// The reviewed iteration of /journey (local, on top of c98a8f4): centered
// hero without code, the whole annotated echo.ts at the core, quieter rings.
// Kept beside the original /journey so both proposals can be compared.
export const metadata = archiveMetadata("journey-refined", "Seyfert | Follow one command into the core");

// echo.ts, cut where the journey touches it. The core shows the chunks
// stacked (the whole file) with a note on which ring read each one.
const ECHO = {
    imports: `import {
  Command, Declare, Options,
  createStringOption, type CommandContext,
} from 'seyfert';`,
    options: `const options = {
  message: createStringOption({
    description: 'What should I echo back?',
    required: true,
  }),
};`,
    declare: `@Declare({ name: 'echo', description: 'Repeat after me' })
@Options(options)`,
    run: `export default class EchoCommand extends Command {
  async run(ctx: CommandContext<typeof options>) {
    await ctx.write({ content: ctx.options.message });
  }
}`,
} satisfies Record<EchoPart, string>;

const LOGGER = `export const logger = createMiddleware<void>((middle) => {
  middle.context.client.logger.info(
    \`\${middle.context.author.username} ran /\${middle.context.fullCommandName}\`,
  );
  middle.next(); // or don't. your call.
});`;

export default async function JourneyPage() {
    const parts = Object.keys(ECHO) as EchoPart[];
    const [loggerHtml, ...echo] = await Promise.all([highlight(LOGGER), ...parts.map((k) => highlight(ECHO[k]))]);
    const echoHtml = Object.fromEntries(parts.map((k, i) => [k, echo[i]])) as Record<EchoPart, string>;
    return (
        <>
            <JourneyRefined echoHtml={echoHtml} loggerHtml={loggerHtml} />
        </>
    );
}
