import * as motion from "motion/react-client";
import Versus from "@/components/home/galaxy/versus";
import Toolkit from "@/components/home/galaxy/toolkit";
import { FeaturesSectionWithHoverEffects } from "@/components/home/galaxy/features";
import { BenchTeaser } from "@/components/home/galaxy/bench-teaser";
import { Accretion } from "@/components/home/galaxy/accretion";
import Finale from "@/components/home/galaxy/finale";
import { config } from "@/app.config";
import type { RepoStats } from "@/lib/github";

// Each arm reveals once as it enters the viewport — drifting in like matter
// falling toward the core.
const Arm = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        // offscreen sections (shiki panes, orbit animations, avatar rows)
        // cost zero style/paint while the hero canvas is running
        style={{ contentVisibility: "auto", containIntrinsicSize: "auto 700px" }}
    >
        {children}
    </motion.div>
);

export default function SpiralSections({ stats }: { stats: RepoStats }) {
    return (
        <>
            <Arm><FeaturesSectionWithHoverEffects /></Arm>

            <Arm delay={0.08}><Toolkit /></Arm>

            <Arm delay={0.08}><Versus number="03" /></Arm>

            <Arm delay={0.08}><BenchTeaser /></Arm>

            <Arm delay={0.08}><Accretion /></Arm>

            <Arm delay={0.08}><Finale repository={config.repository} stats={stats} /></Arm>
        </>
    );
}
