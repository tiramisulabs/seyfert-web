import { ofetch } from "ofetch";

/**
 * Get the 4 repos with the most stars in the org.
 * @returns The 4 repos with the most stars in the org.
 */
export async function getRepos() {
	const { repos } = await ofetch<{ repos: GitHubRepo[] }, "json">(
		"https://ungh.cc/orgs/tiramisulabs/repos",
		{
			responseType: "json",
		},
	);

	return repos.slice(0, 4).sort((a, b) => b.stars - a.stars);
}

export interface GitHubRepo {
	id: number;
	name: string;
	repo: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	pushedAt: string;
	stars: number;
	watchers: number;
	forks: number;
	defaultBranch: string;
}
