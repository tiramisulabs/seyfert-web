import DiscordEcho from "@/components/stage-demos/discord-echo";
import { DemoFrame } from "@/components/stage-demos/frame";
import { stageTokens } from "@/lib/stage-code";
import { ECHO_SOURCE } from "@/lib/stage-sources";

export default async function Page() {
    const code = await stageTokens(ECHO_SOURCE);
    return (
        <DemoFrame id="discord-echo" index={1} title="The reply lands in Discord" where="live · home, after “A command is one file”">
            <DiscordEcho code={code} />
        </DemoFrame>
    );
}
