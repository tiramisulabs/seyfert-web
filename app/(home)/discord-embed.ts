import type { APIContainerComponent } from "seyfert/lib/types";

// Discord component embed for the landing — the link preview Discord shows
// when seyfert.dev is pasted in chat. Linked rather than inlined because only
// the root layout owns <head>, and this preview belongs to `/` alone; docs and
// blog keep their Open Graph cards. Spec: Discord's "Component Embeds" docs —
// one Container, at most 40 components, 3000 bytes, link buttons only.

// The JSON href must live on the host Discord fetched (or a sub/parent
// domain), so preview deployments point at themselves instead of production.
const origin =
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://www.seyfert.dev";

export const discordEmbedUrl = `${origin}/discord-embed.json`;

export const discordEmbed = {
    component: {
        type: 17,
        accent_color: 0x818cf8,
        components: [
            {
                type: 12,
                items: [
                    {
                        media: { url: `${origin}/opengraph-image.png` },
                        description: "Seyfert, the black magic framework",
                    },
                ],
            },
            {
                type: 9,
                components: [
                    {
                        type: 10,
                        content:
                            "# Seyfert\n**The TypeScript framework for Discord.** Powerful Discord bots made simple, from your first command to a million guilds.",
                    },
                ],
                accessory: {
                    type: 2,
                    style: 5,
                    label: "Get started",
                    url: `${origin}/docs/learn/getting-started`,
                },
            },
            { type: 14, spacing: 1 },
            {
                type: 10,
                content:
                    "✓ **Typed end to end**: options, events and replies, 0 `as any`\n✓ **84 MB** where discord.js needs 206, under the same load\n✓ **Day-1 support** for components v2, polls and threads\n```\nnpm i seyfert\n```\n-# // one hour here is seven years in discord.js",
            },
            {
                type: 1,
                components: [
                    { type: 2, style: 5, label: "Benchmarks", url: `${origin}/benchmark` },
                    { type: 2, style: 5, label: "GitHub", url: "https://github.com/tiramisulabs/seyfert" },
                    { type: 2, style: 5, label: "Discord", url: "https://discord.gg/hEeJNaSqnS" },
                ],
            },
        ],
    },
} satisfies { component: APIContainerComponent };
