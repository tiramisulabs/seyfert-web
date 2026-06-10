// Single server-side GitHub fetch shared by the hero star count and the
// finale stats — one cached request instead of a server fetch + a duplicate
// client fetch that double-burned the unauthenticated 60 req/h IP budget.

export interface Contributor {
    avatar_url: string;
    login: string;
}

export interface RepoStats {
    stars: number;
    contributors: Contributor[];
    /** latest release tag, normalized to a leading "v" (null if none) */
    latestTag: string | null;
    /** ISO date of the latest release (null if none) */
    publishedAt: string | null;
}

const EMPTY: RepoStats = {
    stars: 0,
    contributors: [],
    latestTag: null,
    publishedAt: null,
};

export async function getRepoStats(
    repository: string,
    pkg = "seyfert",
): Promise<RepoStats> {
    try {
        const [repoRes, contribRes, npmRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${repository}`, {
                next: { revalidate: 3600 },
            }),
            fetch(`https://api.github.com/repos/${repository}/contributors`, {
                next: { revalidate: 3600 },
            }),
            // the repo releases via npm, not GitHub Releases — the registry's
            // dist-tag is the version users actually install
            fetch(`https://registry.npmjs.org/${pkg}`, {
                next: { revalidate: 3600 },
            }),
        ]);
        if (!repoRes.ok || !contribRes.ok) return EMPTY;
        const repo = await repoRes.json();
        const contributors = (await contribRes.json()) as Contributor[];
        let latestTag: string | null = null;
        let publishedAt: string | null = null;
        if (npmRes.ok) {
            const doc = await npmRes.json();
            const version = doc["dist-tags"]?.latest;
            if (typeof version === "string" && version) {
                latestTag = `v${version}`;
                publishedAt = doc.time?.[version] ?? null;
            }
        }
        return {
            stars: repo.stargazers_count ?? 0,
            contributors: contributors ?? [],
            latestTag,
            publishedAt,
        };
    } catch {
        return EMPTY;
    }
}

/** "TODAY" / "THIS WEEK" / "3W AGO" / "2MO AGO" — the recency chip voice */
export function releaseRecency(publishedAt: string): string {
    const days = Math.floor(
        (Date.now() - new Date(publishedAt).getTime()) / 86_400_000,
    );
    if (days <= 1) return "TODAY";
    if (days < 7) return "THIS WEEK";
    if (days < 56) return `${Math.round(days / 7)}W AGO`;
    return `${Math.round(days / 30)}MO AGO`;
}
