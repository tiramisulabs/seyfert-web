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
}

export async function getRepoStats(repository: string): Promise<RepoStats> {
    try {
        const [repoRes, contribRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${repository}`, {
                next: { revalidate: 3600 },
            }),
            fetch(`https://api.github.com/repos/${repository}/contributors`, {
                next: { revalidate: 3600 },
            }),
        ]);
        if (!repoRes.ok || !contribRes.ok) return { stars: 0, contributors: [] };
        const repo = await repoRes.json();
        const contributors = (await contribRes.json()) as Contributor[];
        return { stars: repo.stargazers_count ?? 0, contributors: contributors ?? [] };
    } catch {
        return { stars: 0, contributors: [] };
    }
}
