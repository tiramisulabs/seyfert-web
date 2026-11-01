import SlipherBento from "@/components/stage-demos/slipher-bento";
import { DemoFrame } from "@/components/stage-demos/frame";
import { UNDECLARED_SOURCE } from "@/components/stage-demos/slipher-bento/source";
import { stageTokens } from "@/lib/stage-code";

export default async function Page() {
    const code = await stageTokens(UNDECLARED_SOURCE);
    return (
        <DemoFrame id="slipher-bento" index={5} title="The ecosystem, one rule apart" where="live · docs/plugins/official">
            <SlipherBento code={code} />
        </DemoFrame>
    );
}
