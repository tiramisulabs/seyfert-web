import { SpiralHome } from "./spiral-home";
import { discordEmbedUrl } from "./discord-embed";

export default function Home() {
  return (
    <>
      {/* React hoists this into <head>, keeping the preview scoped to `/` */}
      <link
        rel="discord:component-embed"
        type="application/json"
        href={discordEmbedUrl}
      />
      <SpiralHome />
    </>
  );
}
