import { Button } from "@/components/ui/button";
import { ArrowUpRight, } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/magicui/gradient-text";
import { Spotlight } from "@/components/ui/spotlight";
import HomeSections from './sections';
import { Badge } from "@/components/ui/badge";
import { Link } from 'next-view-transitions'
import { StarryBackground } from "@/components/ui/starry";
export default function Home() {
  return (
    <main className="flex flex-col">
      <StarryBackground starCount={300} speed={0.5} />
      <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden gap-10">
        <Spotlight
          className="-top-20 -left-12 lg:left-70 lg:-top-20"
          fill="rgba(255, 255, 255, 0.5)"
        />
        <div className="text-center max-w-2xl z-2">
          <AnimatedGradientText className="flex items-center gap-2 px-3">
            <Badge variant="secondary" className="rounded-full">
              Announcement
            </Badge>

            Released v2.3
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
          <div className="mt-10 flex items-center justify-center">
            <Link
              href="/docs"
            >
              <Button
                className="relative px-6 py-3 font-medium group cursor-pointer text-base"
              >
                <span className="rounded-sm absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-white group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                <span className="rounded-sm absolute inset-0 w-full h-full bg-white group-hover:bg-white"></span>
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

        <HomeSections />
      </div>
    </main>
  );
};
