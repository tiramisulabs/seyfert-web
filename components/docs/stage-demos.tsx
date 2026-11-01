import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import ComponentsUpdate from "@/components/stage-demos/components-update";
import { COUNT_SOURCE } from "@/components/stage-demos/components-update/source";
import SlipherBento from "@/components/stage-demos/slipher-bento";
import { UNDECLARED_SOURCE } from "@/components/stage-demos/slipher-bento/source";
import TestingRun from "@/components/stage-demos/testing-run";
import { TEST_SOURCE } from "@/components/stage-demos/testing-run/source";
import TypesCloseup from "@/components/stage-demos/types-closeup";
import { stageTokens } from "@/lib/stage-code";
import { ECHO_SOURCE } from "@/lib/stage-sources";

// Product demos placed in the guides. Each is a figure: the stage is
// decorative (its faux UI would read as noise to a screen reader) and the
// caption says what it shows. The docs column wants the wide design down to
// a phone, so compact only takes over under 560px.
function Plate({ caption, children }: { caption: ReactNode; children: ReactNode }) {
    return (
        <figure className={`not-prose sy-plate my-8 ${GeistSans.variable} ${GeistMono.variable}`}>
            <div aria-hidden className="overflow-hidden rounded-[14px] bg-[#05070d] ring-1 ring-black/10 dark:ring-white/10">
                {children}
            </div>
            <figcaption className={`${GeistMono.className} mt-3 text-[12px] leading-relaxed text-fd-muted-foreground`}>{caption}</figcaption>
        </figure>
    );
}

export async function OptionInferenceDemo() {
    const code = await stageTokens(ECHO_SOURCE);
    return (
        <Plate caption="Flip required and the option's type follows: string becomes string | undefined.">
            <TypesCloseup code={code} compactBelow={560} />
        </Plate>
    );
}

export async function ComponentUpdateDemo() {
    const code = await stageTokens(COUNT_SOURCE);
    return (
        <Plate caption="filter() routes the click by customId, run() edits the message in place with ctx.update.">
            <ComponentsUpdate code={code} compactBelow={560} variant="docs" />
        </Plate>
    );
}

export async function TestingRunDemo() {
    const code = await stageTokens(TEST_SOURCE);
    return (
        <Plate caption="A slash command dispatched to the mock bot and asserted on, without a token or a gateway.">
            <TestingRun code={code} compactBelow={560} />
        </Plate>
    );
}

export async function SlipherEcosystemDemo() {
    const code = await stageTokens(UNDECLARED_SOURCE);
    return (
        <figure className={`not-prose sy-plate my-8 ${GeistSans.variable} ${GeistMono.variable}`}>
            <SlipherBento code={code} />
        </figure>
    );
}
