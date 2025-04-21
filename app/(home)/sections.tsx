import { FeaturesSectionWithHoverEffects } from "@/components/home/features";
import { Testimonials } from "@/components/home/testimonials";
import { Footer } from "@/components/home/footer";
import { UsedBySection } from "@/components/home/usedby";
import * as motion from "motion/react-client";
import OpenSource from "@/components/home/github";
import { config } from "@/app.config";

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
      <AnimatedSection>
        <FeaturesSectionWithHoverEffects />
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <Testimonials />
      </AnimatedSection>

      <AnimatedSection delay={0.3}>
        <UsedBySection />
      </AnimatedSection>

      <AnimatedSection delay={0.4}>
        <OpenSource repository={config.repository} />
      </AnimatedSection>

      <AnimatedSection delay={0.5}>
        <Footer />
      </AnimatedSection>
    </>
  );
}
