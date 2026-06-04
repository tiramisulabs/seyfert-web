import { ClassicHome } from "./classic-home";
import { ChadHome } from "./chad-home";

// Default landing is the classic home. The brutalist/chad redesign lives on
// as an easter egg, shown whenever `?chad` is present in the URL. No
// persistence — navigating away and back to `/` returns to the classic home.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ chad?: string }>;
}) {
  const { chad } = await searchParams;
  return !chad ? <ClassicHome /> : <ChadHome />;
}
