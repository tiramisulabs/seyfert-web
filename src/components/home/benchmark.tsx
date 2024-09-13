import { IconArrowBadgeRightFilled } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeBench() {
    return (
        <div className="w-full xl:w-full text-xs sm:text-sm md:text-md  flex-1">
            <div className="flex flex-col w-full gap-2 sm:gap-3 md:gap-4">
                {[
                    { name: "Seyfert", width: "w-1/3", memory: "75 MB", gradient: true },
                    { name: "Eris", width: "w-2/5", memory: "79 MB" },
                    { name: "Discord.js", width: "w-1/2", memory: "89 MB" },
                    { name: "Detritus", width: "w-3/5", memory: "99 MB" },
                    { name: "Oceanic", width: "w-3/5", memory: "104 MB" },
                ].map((item, index) => (
                    <div key={index} className="flex w-full items-center">
                        <p className={`w-full max-w-16 sm:max-w-24 font-semibold`}>
                            {item.name}
                        </p>
                        <div className={`flex items-center w-full p-1 border border-background-400 rounded-md`}>
                            <div
                                className={`bg-primary ${item.gradient ? "from-brand-500 to-green-500" : ""} ${item.width} h-6 sm:h-8 md:h-10 rounded-md`}
                            />
                            <p className="ml-auto mr-auto font-semibold text-base">{item.memory}</p>
                        </div>
                    </div>
                ))}
                <div className="mt-2 sm:mt-4 md:mt-6">
                    <Link href="/benchmark" prefetch={false}>
                        <Button className="md:text-md transition-all duration-200 rounded-full font-bold hover:bg-green-400 hover:text-white hover:translate-y-[-2px] hover:scale-105 hover:shadow-[0_0_15px_rgba(0,255,0,0.5)]">
                            View Benchmark
                            <IconArrowBadgeRightFilled size={20} className="ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}