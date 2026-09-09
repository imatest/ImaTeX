/**
 * Quick fixes: rewrites for input that is valid TeX but that the renderer will not take.
 *
 * The default table is the spacing control symbols. `\:`, `\;`, `\!` and `\>` are TeX
 * primitives that LaTeX documents use constantly, and several web renderers — latex.js among
 * them — never define them, because they parse the document themselves and only hand the
 * maths on. The failure is unusually cruel: an undefined control symbol derails the parse, so
 * the message is about the far end of the document ("\end{document} missing") and says
 * nothing about the two characters that caused it. Every one of them has a named macro that
 * means exactly the same thing and is implemented, so the repair is lossless.
 *
 * A host with a renderer that implements them passes its own table, or `[]` to turn the
 * button off. Nothing here is renderer detection: it is a list of substitutions the host
 * decided it wants offered.
 */
import { tokenize, KIND } from './tokenize.js';

export const QUICK_FIXES = [
  { from: '\\:', to: '\\medspace', why: 'medium space' },
  { from: '\\;', to: '\\thickspace', why: 'thick space' },
  { from: '\\!', to: '\\negthinspace', why: 'negative thin space' },
  { from: '\\>', to: '\\medspace', why: 'medium space (plain TeX)' },
];

/**
 * Which fixes apply, and how often.
 *
 * Matched over tokens rather than by searching the text, so an escaped backslash is not
 * mistaken for the start of a command: in `\\:` — a line break followed by a colon — the
 * colon is ordinary text, and a `\:` search would find one two characters in and corrupt the
 * line break by rewriting it.
 *
 * @returns {{from: string, to: string, why: string, count: number}[]}
 */
export function findFixes(src, table = QUICK_FIXES) {
  const counts = new Map();
  for (const t of tokenize(String(src))) {
    if (t.kind !== KIND.COMMAND) continue;
    const fix = table.find((f) => f.from === t.text);
    if (fix) counts.set(fix, (counts.get(fix) ?? 0) + 1);
  }
  return [...counts].map(([fix, count]) => ({ ...fix, count }));
}

/** Apply every applicable fix. @returns {{out: string, applied: ReturnType<typeof findFixes>}} */
export function applyFixes(src, table = QUICK_FIXES) {
  const text = String(src);
  const applied = findFixes(text, table);
  if (!applied.length) return { out: text, applied };
  let out = '';
  let at = 0;
  for (const t of tokenize(text)) {
    if (t.kind !== KIND.COMMAND) continue;
    const fix = table.find((f) => f.from === t.text);
    if (!fix) continue;
    out += text.slice(at, t.start) + fix.to;
    at = t.end;
  }
  return { out: out + text.slice(at), applied };
}

/** One line saying what a fix would do, for the button's tooltip and the status after it runs. */
export function describeFixes(applied) {
  return applied
    .map((f) => `${f.count} × ${f.from} (${f.why}) → ${f.to}`)
    .join(', ');
}
