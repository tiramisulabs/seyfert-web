import type { ReactNode } from "react";
import { archiveMetadata } from "@/lib/design-archive";
import HistoricalLayout from "@/components/archive/classic/src/app-home/layout";

// The (home) layout exactly as it shipped (Poppins, its own Navbar), only
// mounted at /classic with archive metadata.
export const metadata = archiveMetadata("classic");

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <HistoricalLayout>{children}</HistoricalLayout>
        </>
    );
}
