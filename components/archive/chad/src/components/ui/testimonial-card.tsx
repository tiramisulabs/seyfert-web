import { cn } from "@/lib/utils"
import { Avatar, AvatarImage } from "@/components/archive/chad/src/components/ui/avatar"

export interface TestimonialAuthor {
    name: string
    handle: string
    avatar: string
}

export interface TestimonialCardProps {
    author: TestimonialAuthor
    text: string
    href?: string
    className?: string
}

export function TestimonialCard({
    author,
    text,
    href,
    className
}: TestimonialCardProps) {
    const Card = href ? 'a' : 'div'

    return (
        <Card
            {...(href ? { href } : {})}
            className={cn(
                "group flex flex-col rounded-none",
                "border-2 border-white/15 bg-[#0a0a0a]",
                "p-5 text-start sm:p-6",
                "hover:border-white/35 hover:bg-white/[0.03]",
                "min-w-[320px] max-w-[420px] sm:min-w-[380px] sm:max-w-[460px]",
                "transition-all duration-300 relative overflow-hidden",
                className
            )}
        >
            {/* Top label */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-zinc-600">
                    // Built With Seyfert
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-white/60">
                    <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                </span>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <Avatar className="h-11 w-11 rounded-none border border-white/20">
                    <AvatarImage src={author.avatar} alt={author.name} loading="lazy" className="rounded-none grayscale group-hover:grayscale-0 transition-all" />
                </Avatar>
                <div className="flex flex-col items-start">
                    <h3 className="text-sm font-black uppercase tracking-wide leading-none text-white">
                        {author.name}
                    </h3>
                    <p className="text-[11px] text-zinc-600 font-mono mt-1.5">
                        {author.handle}
                    </p>
                </div>
            </div>
            <p className="text-sm mt-4 text-zinc-300 leading-relaxed line-clamp-5">
                {text}
            </p>
        </Card>
    )
}
