import { cn } from "@/lib/utils";
import { Typescript01Icon, ChartIncreaseIcon, SmileIcon, CustomizeIcon, DiscordIcon, PlusSignSquareIcon } from "hugeicons-react";

export function FeaturesSectionWithHoverEffects() {
    const features = [
        {
            title: "Written in TypeScript",
            description:
                "Seyfert is written in TypeScript, so you can enjoy the benefits of type safety.",
            icon: <Typescript01Icon />,
        },
        {
            title: "Scalable",
            description:
                "Seyfert is tested on both big and small bots and there were perfect performance results on both of them..",
            icon: <ChartIncreaseIcon />,
        },
        {
            title: "Effortless Development",
            description:
                "Developer experience is at the core of Seyfert, with a focus on easy setup to only worry about your bot's logic.",
            icon: <SmileIcon />,
        },
        {
            title: "Full customization",
            description:
                "Seyfert makes customization easier, you can customize each aspect of seyfert if you need specific behavior.",
            icon: <CustomizeIcon />,
        },
        {
            title: "Latest Features",
            description:
                "Seyfert is always up to date with the latest features of Discord.",
            icon: <DiscordIcon />,
        },
        {
            title: "And more...",
            description:
                "Actually I got out of ideas for this section, but I'm sure there are more features.",
            icon: <PlusSignSquareIcon />,
        }
    ];
    return (
        <section className="flex flex-col gap-4 items-center">
            <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">
                Packed with unique features
            </h2>

            <div className="flex items-center justify-center my-2">
                <div className="relative w-72 h-[2px] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-600 to-transparent animate-[fade_3s_ease-in-out_infinite]" />
                </div>
                <div className="absolute">
                    <div className="w-1.5 h-1.5 border border-neutral-700 rotate-45" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                {features.map((feature, index) => (
                    <Feature key={index} {...feature} index={index} />
                ))}
            </div>
        </section>
    );
}

const Feature = ({
    title,
    description,
    icon,
    index,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    index: number;
}) => {
    return (
        <div
            className={cn(
                "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
                (index === 0 || index === 3) && "lg:border-l dark:border-neutral-800",
                index < 3 && "lg:border-b dark:border-neutral-800"
            )}
        >
            {index < 3 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
            )}
            {index >= 3 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
            )}
            <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
                {icon}
            </div>
            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-[2px] rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
                    {title}
                </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
                {description}
            </p>
        </div>
    );
};
