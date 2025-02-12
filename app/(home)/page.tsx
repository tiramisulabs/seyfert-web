"use client";

import AnimatedGridPattern from "@/components/ui/animated-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/magicui/gradient-text";
import { Spotlight } from "@/components/ui/spotlight";
import { Github01Icon } from "hugeicons-react";
import Particles from "@/components/ui/particles";
import HomeSections from './sections';
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="flex flex-col">
      <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden gap-10">
        <AnimatedGridPattern
          numSquares={20}
          maxOpacity={0.2}
          duration={3}
          repeatdelay={1}
          className={cn(
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
            "inset-x-0 h-full skew-y-12"
          )}
        />
        <Spotlight
          className="-top-20 -left-12 md:left-70 md:-top-20"
          fill="rgba(255, 255, 255, 0.7)"
        />
        <div className="text-center max-w-2xl">
          <AnimatedGradientText className="flex items-center gap-2 px-3">
            <Badge variant="secondary" className="rounded-full">
              Announcement
            </Badge>

            Released v2.3
          </AnimatedGradientText>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-5xl font-bold leading-[1.1] tracking-tight">
            Powerful Discord Bots Made Simple with{" "}
            <span className="animate-text-gradient bg-gradient-to-r from-blue-300 via-purple-500 to-blue-900 bg-clip-text text-transparent">
              Seyfert
            </span>
          </h1>
          <p className="mt-6 text-[17px] md:text-md ">
            Experience the perfect balance of power and simplicity. A modern Discord framework engineered for scalability, without sacrificing developer experience.
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-md text-base cursor-pointer"
            >
              Start Now <ArrowUpRight className="!h-5 !w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-md text-base shadow-none cursor-pointer"
            >
              Repository <Github01Icon className="!h-5 !w-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-sm sm:max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-6xl mt-8 relative space-y-16">
        <div className="h-full w-full absolute -z-10 opacity-20">
          <Particles
            particleColors={['#ffffff', '#ffffff']}
            particleCount={400}
            particleSpread={20}
            speed={0.15}
            particleBaseSize={4}
            moveParticlesOnHover={false}
            disableRotation={true}
          />
        </div>

        <HomeSections />
      </div>
    </main>
  );
};
