import { DemoFrame } from "@/components/stage-demos/frame";
import TestingRun from "@/components/stage-demos/testing-run";
import { TEST_SOURCE } from "@/components/stage-demos/testing-run/source";
import { stageTokens } from "@/lib/stage-code";

export default async function Page() {
    const code = await stageTokens(TEST_SOURCE);
    return (
        <DemoFrame id="testing-run" index={6} title="Test it without Discord" where="live · docs/testing">
            <TestingRun code={code} />
        </DemoFrame>
    );
}
