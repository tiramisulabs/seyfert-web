import { codeToHtml } from "shiki";

// One place for the landing's code rendering: every snippet on the page is
// TypeScript on the vesper theme, so the lang/theme pair lives here instead of
// being repeated per-section. shiki's shorthand already memoizes a singleton
// highlighter under the hood, so concurrent callers share one instance.
export function highlight(code: string): Promise<string> {
    return codeToHtml(code, { lang: "ts", theme: "vesper" });
}
