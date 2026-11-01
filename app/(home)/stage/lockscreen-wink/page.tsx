import { DemoFrame } from "@/components/stage-demos/frame";
import LockscreenWink from "@/components/stage-demos/lockscreen-wink";

export default function Page() {
    return (
        <DemoFrame id="lockscreen-wink" index={7} title="A wink at 3am" where="live · home, hover a bot in the Orbit">
            <LockscreenWink />
        </DemoFrame>
    );
}
