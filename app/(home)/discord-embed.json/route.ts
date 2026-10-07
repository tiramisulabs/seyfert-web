import { discordEmbed } from "../discord-embed";

export const dynamic = "force-static";

// Discord silently drops a component embed over 3000 bytes; fail the build
// instead of shipping a preview that never renders.
const body = JSON.stringify(discordEmbed);
if (Buffer.byteLength(body) > 3000) {
    throw new Error(`Discord component embed is ${Buffer.byteLength(body)} bytes; the limit is 3000.`);
}

export function GET() {
    return new Response(body, {
        headers: { "Content-Type": "application/json" },
    });
}
