import { codeToTokens } from "shiki";
import type { CodeLines } from "@/components/stage-demos/code";

export async function stageTokens(code: string, lang: "ts" | "tsx" | "bash" = "ts"): Promise<CodeLines> {
    const { tokens } = await codeToTokens(code, { lang, theme: "vesper" });
    return tokens.map((line) => line.map((t) => ({ c: t.content, k: t.color ?? "#e5e5e5" })));
}
