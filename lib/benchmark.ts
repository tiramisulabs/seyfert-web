// The one summary figure the site quotes for a benchmark series: the landing's
// Memory chapter and /benchmark both read medians through this, so the claim
// on the landing and the number it links to can't drift apart.

/** median of a series, rounded to whole MB as both pages show it */
export function medianMb(samples: readonly number[]) {
    const sorted = [...samples].sort((a, b) => a - b);
    const middle = sorted.length / 2;
    return Math.round((sorted[Math.floor(middle)] + sorted[Math.ceil(middle) - 1]) / 2);
}
