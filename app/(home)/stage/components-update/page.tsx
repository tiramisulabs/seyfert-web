import ComponentsUpdate from "@/components/stage-demos/components-update";
import { COUNT_SOURCE } from "@/components/stage-demos/components-update/source";
import { DemoFrame } from "@/components/stage-demos/frame";
import { stageTokens } from "@/lib/stage-code";

export default async function Page() {
    const code = await stageTokens(COUNT_SOURCE);
    return (
        <DemoFrame id="components-update" index={3} title="A button, handled in place" where="live · docs/learn/components/handling-components">
            <ComponentsUpdate code={code} />
        </DemoFrame>
    );
}
