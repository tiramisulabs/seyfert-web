import { SectionIndex } from "@/components/archive/chad/src/components/home/section-index";
import { FeaturesSectionWithHoverEffects } from "@/components/archive/chad/src/components/home/features";
import { Testimonials } from "@/components/archive/chad/src/components/home/testimonials";
import { Footer } from "@/components/archive/chad/src/components/home/footer";
import { UsedBySection } from "@/components/archive/chad/src/components/home/usedby";
import { VirginVsChad } from "@/components/archive/chad/src/components/home/virgin-vs-chad";
import { CodeFight } from "@/components/archive/chad/src/components/home/code-fight";
import { Migration } from "@/components/archive/chad/src/components/home/migration";
import * as motion from "motion/react-client";
import OpenSource from "@/components/archive/chad/src/components/home/github";
import { config } from "@/components/archive/chad/src/app.config";

const AnimatedSection = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default function HomeSections() {
  return (
    <>
      {/* Concrete proof first */}
      <AnimatedSection>
        <div className="relative">
          <SectionIndex index={1} stamp="PROOF" />
          <CodeFight />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="relative">
          <SectionIndex index={2} stamp="VS" />
          <VirginVsChad />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <div className="relative">
          <SectionIndex index={3} stamp="ARSENAL" />
          <FeaturesSectionWithHoverEffects />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <div className="relative">
          <SectionIndex index={4} stamp="MIGRATE" />
          <Migration />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <div className="relative">
          <SectionIndex index={5} stamp="WITNESS" />
          <Testimonials />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <div className="relative">
          <SectionIndex index={6} stamp="HOF" />
          <UsedBySection />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <div className="relative">
          <SectionIndex index={7} stamp="OSS" />
          <OpenSource repository={config.repository} />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.5}>
        <div className="relative">
          <SectionIndex index={8} stamp="FINAL" />
          <Footer />
        </div>
      </AnimatedSection>
    </>
  );
}
