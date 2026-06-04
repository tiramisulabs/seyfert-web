import Hero from "@/components/home/hero";
import HomeSections from "./sections";

// Chad / brutalist landing — easter egg, only rendered at `?chad=true`.
// Kept byte-for-byte identical to the previous default home body so the
// easter egg behaves exactly like the old landing did.
export function ChadHome() {
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
