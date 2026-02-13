import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/magicui/gradient-text";
import { Spotlight } from "@/components/ui/spotlight";
import { StarryBackground } from "@/components/ui/starry";
import { Rocket, Users } from "lucide-react";
import Link from 'next/link';
import HomeSections from './sections';
export default function Home() {
  return (
    <main className="flex flex-col">
      <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden gap-10">
        <div className="absolute inset-0 -z-10 w-full h-full">
          <StarryBackground />
        </div>

        <Spotlight
          className="-top-20 -left-12 lg:left-80 lg:-top-30"
          fill="rgba(255, 255, 255, 0.8)"
        />

        <div className="text-center max-w-2xl z-2">
          <AnimatedGradientText className="flex items-center gap-2 px-3">
            <Badge variant="secondary" className="rounded-full">
              Announcement
            </Badge>

            Released v4.2
          </AnimatedGradientText>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-5xl font-bold leading-[1.1]">
            Powerful Discord Bots Made Simple with{" "}
            <span className="animate-text-gradient bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Seyfert
            </span>
          </h1>
          <p className="mt-6 text-[17px] md:text-md bg-gradient-to-r from-neutral-300 to-neutral-100 bg-clip-text text-transparent flex flex-col items-center">
            <span className="w-full md:max-w-[500px]">Experience the perfect balance of power and simplicity.</span>
            <span className="w-full md:max-w-[500px]">A modern Discord framework engineered for scalability, without sacrificing developer experience.</span>
          </p>
          <div className="mt-10 flex items-center justify-center gap-5">
            <Link
              href="/guide"
              target="_blank"
            >
              <Button
                className="font-medium cursor-pointer text-base gap-3"
              >
                Get Started
                <Rocket className="size-5" />
              </Button>
            </Link>
            <Link
              href="https://discord.gg/hEeJNaSqnS"
              target="_blank"
            >
              <Button
                variant="outline"
                className="font-medium cursor-pointer text-base gap-3"
              >
                Community
                <Users className="size-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mt-8 relative space-y-16">

        <HomeSections />
      </div>
    </main>
  );
};
