import { TestimonialCard, TestimonialAuthor } from "@/components/ui/testimonial-card"

const usedByEntries: Array<{
    author: TestimonialAuthor
    text: string
    href?: string
}> = [
        {
            author: {
                name: "CactusFire",
                handle: "@CactusFire#3759",
                avatar: "/bots/cactusfire.png"
            },
            text: "I think choosing Seyfert is a very good option, we have been working with Discord.js & Discordeno for years, and yes... It's good, but for large scale bots... nothing better than Seyfert. Besides it's a team that is very attentive, and gives us a hand whenever they can.."
        },
        {
            author: {
                name: "Listen",
                handle: "@Listen#7518",
                avatar: "/bots/listen.png"
            },
            text: "After years of experience with Discord.js, Discordeno and Eris, Seyfert proved to be unmatched for large-scale music bots - dropping our RAM usage to under 1 GB (from almost 4 GB) while handling 200% more servers. This allowed us to finally focus on our features without any constraints over all these years."
        },
        {
            author: {
                name: "Hiraku Shinzou",
                handle: "@Hiraku Shinzou#9117",
                avatar: "/bots/hiraku.png"
            },
            text: "All my homies use Seyfert so that's why I use it too."
        },
        {
            author: {
                name: "Button Bot",
                handle: "@ButtonBot",
                avatar: "/bots/buttonbot.gif"
            },
            text: "Managing custom bots for our premium users was a major challenge—until we switched to Seyfert. It handled everything seamlessly, proving to be a powerful and reliable framework for large-scale bot deployments."
        }
    ]

export function UsedBySection() {
    return (
        <section className="flex flex-col items-center text-center py-4">
            <div className="text-center">
                <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">
                    Who is using Seyfert?
                </h2>
                <p className="mt-2 text-base leading-relaxed text-neutral-400">
                    Below are some of the bots that are using Seyfert (you can add your bot to the list by opening a PR).
                </p>
                <div className="flex items-center justify-center gap-3 my-8">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse"
                            style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
            </div>

            <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
                <div className={`flex overflow-hidden [--gap:1rem] [gap:var(--gap)] flex-row [--duration:30s]`}>
                    <div className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row">
                        {usedByEntries.map((_, setIndex) => (
                            usedByEntries.map((testimonial, i) => (
                                <TestimonialCard
                                    key={`${setIndex}-${i}`}
                                    {...testimonial}
                                />
                            ))
                        ))}
                    </div>
                </div>

                <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-background sm:block" />
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-background sm:block" />
            </div>
        </section>
    )
}