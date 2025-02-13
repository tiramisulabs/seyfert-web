import AnimatedGridPattern from "@/components/ui/animated-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/magicui/gradient-text";
import { Spotlight } from "@/components/ui/spotlight";
import Particles from "@/components/ui/particles";
import HomeSections from './sections';
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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
        <div className="text-center max-w-2xl z-2">
          <AnimatedGradientText className="flex items-center gap-2 px-3">
            <Badge variant="secondary" className="rounded-full">
              Announcement
            </Badge>

            Released v2.3
          </AnimatedGradientText>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-5xl font-bold leading-[1.1] tracking-normal">
            Powerful Discord Bots Made Simple with{" "}
            <span className="tracking-normal animate-text-gradient bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Seyfert
            </span>
          </h1>
          <p className="tracking-normal mt-6 text-[17px] md:text-md leading-relaxed bg-gradient-to-r from-neutral-300 to-neutral-100 bg-clip-text text-transparent flex flex-col items-center">
            <span className="w-full md:max-w-[500px]">Experience the perfect balance of power and simplicity.</span>
            <span className="w-full md:max-w-[500px]">A modern Discord framework engineered for scalability, without sacrificing developer experience.</span>
          </p>
          <div className="mt-10 flex items-center justify-center">
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="/docs">
              <Button
                className="relative px-6 py-3 font-medium group cursor-pointer text-base"
              >
                <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-white group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                <span className="absolute inset-0 w-full h-full bg-white group-hover:bg-white"></span>
                <span className="relative text-black group-hover:text-black flex items-center">
                  GET STARTED
                  <ArrowUpRight className="!w-5 !h-5 ml-2" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mt-8 relative space-y-16">
        <div className="h-full w-full absolute -z-10 opacity-40">
          <Particles
            particleColors={['#ffffff', '#ffffff']}
            particleCount={450}
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
