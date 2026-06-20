// Shared helpers for the blog index and post pages.

/**
 * Splits a release title like "Seyfert v4.3.0: The One Where…" into its
 * version tag and the clean headline. Falls back to the raw title.
 */
export function parseBlogTitle(title: string) {
    const match = title.match(/^Seyfert\s+(v[\d.]+)\s*[:–—-]\s*(.+)$/);
    return match
        ? { version: match[1], clean: match[2] }
        : { version: null as string | null, clean: title };
}

/** "v4.3.0" -> "4.3" for the giant background watermark. */
export function versionWatermark(version: string | null) {
    if (!version) return "";
    return version.replace(/^v/, "").split(".").slice(0, 2).join(".");
}

export function formatBlogDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
}
