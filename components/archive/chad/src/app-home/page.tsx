import Hero from "@/components/archive/chad/src/components/home/hero";
import HomeSections from "./sections";

export default function Home() {
  return (
    <main className="flex min-w-0 flex-col">
      <Hero />
      <div className="home-content relative isolate w-full">
        <div className="relative z-10 mx-auto w-full min-w-0 sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl px-2 sm:px-6 mt-8 space-y-16 pb-16">
          <HomeSections />
        </div>
      </div>
    </main>
  );
}
