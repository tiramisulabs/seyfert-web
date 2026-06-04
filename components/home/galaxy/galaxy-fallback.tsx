// Static galaxy: warm CSS core glow + faint starfield. Server-rendered under
// the WebGL canvas so LCP and no-WebGL/reduced-motion users get the full look.
export function GalaxyFallback() {
    return (
        <div aria-hidden data-galaxy-fallback className="absolute inset-0 overflow-hidden transition-opacity duration-1000">
            {/* starfield — two offset layers, cool faint stars */}
            <div
                className="absolute inset-0 opacity-50"
                style={{
                    backgroundImage:
                        "radial-gradient(rgba(244,239,230,0.32) 0.5px, transparent 0.5px), radial-gradient(rgba(200,216,240,0.22) 0.5px, transparent 0.5px)",
                    backgroundSize: "47px 47px, 91px 91px",
                    backgroundPosition: "0 0, 23px 37px",
                }}
            />
            {/* warm AGN core, off-center for asymmetry */}
            <div className="core-glow animate-spiral-pulse absolute left-[62%] top-[34%] h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80" />
            {/* coppery dust haze hugging the core */}
            <div
                className="absolute left-[58%] top-[40%] h-[28rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-25 blur-3xl"
                style={{ background: "radial-gradient(ellipse, rgba(180,104,60,0.55), transparent 65%)" }}
            />
        </div>
    );
}
