import { SpiralHome } from "../spiral-home";
import { archiveMetadata } from "@/lib/design-archive";

// The live Cygnus home (centered black hole, lit-metal wordmark), moved off
// `/` when the root became the design index. Same components, untouched.
export const metadata = archiveMetadata("cygnus", "Seyfert | The Black Magic Framework");

export default function Page() {
    return (
        <>
            <SpiralHome />
        </>
    );
}
