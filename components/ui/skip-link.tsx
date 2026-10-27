// First tab stop on the page: hidden until focused, then jumps past the
// navigation to the layout's content region.
export function SkipLink({ href }: { href: string }) {
    return (
        <a
            href={href}
            className="sr-only z-[100] bg-[#f8f1e4] px-4 py-2.5 text-sm font-semibold text-[#05070d] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#818cf8]"
        >
            Skip to content
        </a>
    );
}
