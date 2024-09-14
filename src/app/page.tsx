import { MultiDirectionSlide } from '@/components/effect';
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
          <Badge className="w-fit bg-primary/40 text-primary hover:text-white" variant="default">
            <Link href="https://npmjs.com/package/seyfert" target="_blank" className="flex items-center">
              <span>Seyfert 2.0 is out!</span>
              <IconAlbum size={16} className="ml-2" />
            </Link>
          </Badge>

          <MultiDirectionSlide />
          <p className="pr-0 lg:pr-5">
            Seyfert is a brand new, edge-bleeding Discord framework made with scalability and performance in mind.
          </p>
          <div className="flex flex-col sm:flex-row w-full sm:auto gap-2">
            <Link href="https://docs.seyfert.dev" target="_blank">
              <Button size="lg">
                Get started
              </Button>
            </Link>
            <Link href="https://discord.gg/seyfert" target="_blank">
              <Button size="lg" variant="secondary">
                Join the chat now
              </Button>
            </Link>
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