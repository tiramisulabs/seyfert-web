// Shiki tokens handed from a server page to a client demo: one entry per
// line, each a run of text and its color (the vesper theme the home uses).
export type CodeLines = { c: string; k: string }[][];

export function CodeRow({ line }: { line: CodeLines[number] }) {
    return <>{line.length === 0 ? " " : line.map((t, i) => <span key={i} style={{ color: t.k }}>{t.c}</span>)}</>;
}
