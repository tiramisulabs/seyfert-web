// Static galaxy: a REAL captured frame of the WebGL render, not a CSS
// approximation. The first paint already shows the full-detail black hole,
// so when the live canvas crossfades in there is nothing left to "appear" —
// no glow→detail pop, no matter how long shader compilation takes. Also what
// no-WebGL and reduced-motion users keep.
//
// Alignment contract with the shaders: hole center sits at 79% of the width
// (desktop march) / 86.8% (phone lite), vertical position and scale are
// height-proportional. Rendering the photo at h-full/w-auto and anchoring it
// with left = holeFraction·100% − holeFraction·imageWidth(vh) keeps the
// photo's hole exactly on the live hole for any viewport aspect; captures
// are wide enough to cover up to ~2.8:1.
export function GalaxyFallback() {
    return (
        <div aria-hidden data-galaxy-fallback className="absolute inset-0 overflow-hidden transition-opacity duration-500">
            {/* faint dot starfield behind the photo — covers the slivers the
                 photo can't reach on extreme aspect ratios */}
            <div
                className="absolute inset-0 opacity-50"
                style={{
                    backgroundImage:
                        "radial-gradient(rgba(244,239,230,0.32) 0.5px, transparent 0.5px), radial-gradient(rgba(200,216,240,0.22) 0.5px, transparent 0.5px)",
                    backgroundSize: "47px 47px, 91px 91px",
                    backgroundPosition: "0 0, 23px 37px",
                }}
            />
            <picture>
                <source media="(min-width: 768px)" srcSet="/galaxy-static-wide.webp" />
                {/* plain img on purpose: full-bleed photo with calc() anchoring,
                    next/image adds nothing here */}
                <img
                    src="/galaxy-static-mobile.webp"
                    alt=""
                    fetchPriority="high"
                    decoding="async"
                    className="absolute top-0 h-full w-auto max-w-none left-[calc(86.8%_-_38.57vh)] md:left-[calc(79%_-_139.57vh)]"
                />
            </picture>
        </div>
    );
}
