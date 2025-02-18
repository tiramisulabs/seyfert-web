import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { cn } from "@/lib/utils"
import { GridBG } from "../ui/grid-bg"

const testimonials = [
    {
        name: "Socram09",
        review: "The error handling is amazing - it catches errors so well I never know what actually went wrong.",
        avatar: "/avatars/socram09.png"
    },
    {
        name: "MARCROCK22",
        review: "The documentation is so vast, I hired an archaeologist to explore it. They're still searching for the table of contents!.",
        avatar: "/avatars/marcrock22.png"
    },
    {
        name: "FreeAoi",
        review: "This framework is so advanced, my bot now responds to commands that I never even programmed.",
        avatar: "/avatars/freeaoi.png"
    },
    {
        name: "Deivid",
        review: "Memory management is incredible - it only needs all my PC's RAM, my phone's memory, and my smart fridge to run a startup bot connection.",
        avatar: "/avatars/deivid.png"
    },
    {
        name: "JustEvil",
        review: "The type system is so helpful it suggests types that TypeScript hasn't even invented yet.",
        avatar: "/avatars/justevil.png"
    },
    {
        name: "Miia",
        review: "Event handling is so fast, my bot responds to messages before users even think about sending them.",
        avatar: "/avatars/miia.png"
    }
]

export function Testimonials() {
    return (
        <section className="flex flex-col">
            <div className="text-center">
                <h2 className="text-4xl font-bold leading-[1.1] tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
                    Everyone loves it
                </h2>
                <p className="mt-4 mb-4 text-base leading-relaxed text-neutral-400">
                    Discover what our amazing community has to say about their experience with Seyfert.
                </p>

                <div className="flex items-center justify-center gap-2 my-4">
                    <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="relative h-2 w-2">
                        <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                        <div className="absolute inset-0 rounded-full bg-white/60" />
                    </div>
                    <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-5">
                {testimonials.map((testimonial, index) => (
                    <div
                        className={cn(
                            // Base styles
                            "group w-full border border-neutral-800 p-5 h-full rounded-sm",
                            "relative overflow-hidden transition-all duration-300",
                            // Hover effect styles
                            "hover:-translate-y-1",
                            "before:absolute before:top-0 before:left-0 before:w-[200%] before:h-full",
                            "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                            "before:skew-x-[-20deg] before:translate-x-[-100%]",
                            "before:transition-transform before:duration-1000 before:ease-in-out",
                            "hover:before:translate-x-[50%]",
                            // Conditional styles for specific cards
                            index === 1 || index === 4 ? "md:hover:-translate-y-4 md:-translate-y-3 md:shadow-lg md:shadow-neutral-900/50" : ""
                        )}
                        key={index}
                    >
                        <GridBG size={20} />
                        <div className="w-full flex mb-4 items-center">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={testimonial.avatar} />
                                <AvatarFallback>
                                    {testimonial.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow pl-3">
                                <p className="font-bold text-sm uppercase">{testimonial.name}</p>
                                <p className="text-neutral-400 text-sm">@{testimonial.name.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="w-full">
                            <p className="text-sm">
                                {testimonial.review}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}