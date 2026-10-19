// The SEYFERT wordmark for /reveal, drawn rather than typeset: extended,
// squared caps in the spirit of mission insignia, one stroke weight, flat
// cuts. Every middle stroke (S spine, E and F arms, Y fork, R bowl) sits on
// the same axis, y = 50: the galactic plane the word is threaded on, which
// the page draws on past the letters. Owning the geometry means no font
// swap on load and a known dive point: the nucleus where the F's stem meets
// that plane.
//
// Glyphs are centerlines stroked at STROKE in a 100-unit cap height.

export const CAP = 100;
export const STROKE = 20;

type Glyph = { w: number; d: (x: number) => string };

const glyphs: Record<string, Glyph> = {
    // squared S: two 18-unit corners per bowl, flat vertical terminals
    S: {
        w: 88,
        d: (x) =>
            `M${x + 88} 10H${x + 28}A18 18 0 0 0 ${x + 10} 28V32A18 18 0 0 0 ${x + 28} 50` +
            `H${x + 60}A18 18 0 0 1 ${x + 78} 68V72A18 18 0 0 1 ${x + 60} 90H${x}`,
    },
    E: { w: 72, d: (x) => `M${x + 72} 10H${x + 10}V90H${x + 72}M${x + 10} 50H${x + 64}` },
    // arms run past the cap line and are cut flat by the clip
    Y: { w: 88, d: (x) => `M${x + 12} -6L${x + 44} 50L${x + 76} -6M${x + 44} 50V${CAP}` },
    F: { w: 68, d: (x) => `M${x + 68} 10H${x + 10}V${CAP}M${x + 10} 50H${x + 60}` },
    R: {
        w: 84,
        d: (x) =>
            `M${x + 10} ${CAP}V10H${x + 56}A18 18 0 0 1 ${x + 74} 28V32A18 18 0 0 1 ${x + 56} 50H${x + 10}` +
            `M${x + 46} 50L${x + 74} 106`,
    },
    T: { w: 80, d: (x) => `M${x} 10H${x + 80}M${x + 40} 10V${CAP}` },
};

const WORD = "SEYFERT";
const GAP = 20;

function layout() {
    let x = 0;
    let d = "";
    let nucleus = 0;
    for (const ch of WORD) {
        const g = glyphs[ch];
        d += g.d(x);
        if (ch === "F") nucleus = x + 10; // stem centerline
        x += g.w + GAP;
    }
    return { d, width: x - GAP, nucleus };
}

const built = layout();
export const WORD_PATH = built.d;
export const WORD_W = built.width;
/** the dive point, in word units: the F stem on the plane */
export const NUCLEUS = { x: built.nucleus, y: CAP / 2 };

// A standalone copy for CSS masks (the plate the letters are cut from).
const maskSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORD_W} ${CAP}">` +
    `<clipPath id="c"><rect width="${WORD_W}" height="${CAP}"/></clipPath>` +
    `<path clip-path="url(#c)" d="${WORD_PATH}" fill="none" stroke="#000" stroke-width="${STROKE}" stroke-linejoin="miter" stroke-miterlimit="8"/>` +
    `</svg>`;
export const WORD_MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}")`;
