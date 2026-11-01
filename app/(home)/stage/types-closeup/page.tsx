import { DemoFrame } from "@/components/stage-demos/frame";
import TypesCloseup from "@/components/stage-demos/types-closeup";
import { stageTokens } from "@/lib/stage-code";
import { ECHO_SOURCE } from "@/lib/stage-sources";

export default async function Page() {
    const code = await stageTokens(ECHO_SOURCE);
    return (
        <DemoFrame id="types-closeup" index={2} title="Inference you can watch" where="live · docs/learn/commands/options">
            <TypesCloseup code={code} />
        </DemoFrame>
    );
}
