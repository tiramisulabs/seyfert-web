import * as motion from "motion/react-client";
import CodeShowcase from "@/components/home/galaxy/code-showcase";
import Versus from "@/components/home/galaxy/versus";
import { FeaturesSectionWithHoverEffects } from "@/components/home/galaxy/features";
import { BenchTeaser } from "@/components/home/galaxy/bench-teaser";
import { Accretion } from "@/components/home/galaxy/accretion";
import Finale from "@/components/home/galaxy/finale";
import { config } from "@/app.config";

// Each arm reveals once as it enters the viewport — drifting in like matter
// falling toward the core.
const Arm = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

export default function SpiralSections() {
    return (
        <>
            <Arm><CodeShowcase /></Arm>

            <Arm delay={0.08}><FeaturesSectionWithHoverEffects /></Arm>

            <Arm delay={0.08}><Versus number="02" /></Arm>

            <Arm delay={0.08}><BenchTeaser /></Arm>

            <Arm delay={0.08}><Accretion /></Arm>

            <Arm delay={0.08}><Finale repository={config.repository} /></Arm>
        </>
    );
}
