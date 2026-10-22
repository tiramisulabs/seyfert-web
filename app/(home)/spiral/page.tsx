import { SpiralHome } from "@/components/archive/spiral/src/app-home/spiral-home";
import { archiveMetadata } from "@/lib/design-archive";

// The original Spiral home as of 509cf65: two-column editorial hero with the
// raymarched Gargantua on the right. Its galaxy renderer is a snapshot under
// components/archive/spiral, so later Cygnus changes to the live renderer
// don't rewrite this one.
export const metadata = archiveMetadata("spiral");

export default function Page() {
    return (
        <>
            <SpiralHome />
        </>
    );
}
