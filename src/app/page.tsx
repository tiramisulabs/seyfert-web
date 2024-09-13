import { BlurIn, MultiDirectionSlide } from '@/components/effect';
import HomeBench from "@/components/home/benchmark";
import FeaturesSection from "@/components/home/features";
import HomeFooter from "@/components/home/footer";
import HatersSection from "@/components/home/haters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconAlbum } from "@tabler/icons-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <div className="flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-center">
        <div className="max-w-full lg:max-w-3xl flex flex-col gap-4 flex-">
          <Badge className="w-fit">
            <Link href="https://npmjs.com/package/seyfert" target="_blank" className="flex items-center">
              <span>Seyfert 2.0 is out!</span>
              <IconAlbum size={16} className="ml-2" />
            </Link>
          </Badge>

          <MultiDirectionSlide />
          {/* <h1 className="text-5xl font-extrabold">
            The Discord framework that{" "}
            <span className="font-mono px-2 py-1 rounded-xl text-brand-500">satisfies</span> you
          </h1> */}
          <p className="pr-0 lg:pr-5">
            Seyfert is a brand new, edge-bleeding Discord framework made with scalability and performance in mind.
          </p>
          <div className="flex flex-col sm:flex-row w-full sm:auto gap-2">
            <Button>
              <Link href="https://docs.seyfert.dev" target="_blank">
                Get started
              </Link>
            </Button>
            <Button>
              <Link href="https://discord.gg/seyfert" target="_blank">
                Join the chat now
              </Link>
            </Button>
          </div>
        </div>
        <HomeBench />
      </div>
      <FeaturesSection />
      <HatersSection />
      <HomeFooter />
    </div>
  )
}