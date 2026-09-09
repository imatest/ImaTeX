/**
 * A LaTeX tokenizer, used for both syntax highlighting and hover lookup.
 *
 * One pass produces spans with a kind and a source range, and both features read those: the
 * highlighter paints them, the hover finds the span under the pointer. Doing it twice — a
 * regex to colour and another to identify what the mouse is over — is how the tooltip ends up
 * disagreeing with the colour on the same character.
 *
 * @typedef {{ kind: string, start: number, end: number, text: string, env?: string }} Token
 */

const KIND = {
  COMMAND: 'command',   // \frac, \alpha
  BRACE: 'brace',       // { }
  BRACKET: 'bracket',   // [ ]
  SCRIPT: 'script',     // ^ _
  ALIGN: 'align',       // & \\
  NUMBER: 'number',
  OPERATOR: 'operator', // + - = < > /
  COMMENT: 'comment',   // % to end of line
  TEXT: 'text',
};

/** @returns {Token[]} every character of `src` covered exactly once, in order. */
export function tokenize(src) {
  /** @type {Token[]} */
  const out = [];
  const push = (kind, start, end, env) => { if (end > start) out.push({ kind, start, end, text: src.slice(start, end), env }); };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    // A comment runs to the end of the line — unless the % was escaped, which is common in
    // this corpus because a literal percent is what a tolerance is written with.
    if (c === '%') {
      let j = src.indexOf('\n', i);
      if (j < 0) j = src.length;
      push(KIND.COMMENT, i, j); i = j; continue;
    }
    if (c === '\\') {
      // \\ is a line break, not the start of a command called "\".
      if (src[i + 1] === '\\') { push(KIND.ALIGN, i, i + 2); i += 2; continue; }
      const m = /^\\[a-zA-Z]+\*?/.exec(src.slice(i));
      if (m) {
        const name = m[0];
        // \begin{env} / \end{env}: the environment name travels with the token so a hover on
        // \begin can say which environment it opens.
        let env;
        const after = /^\s*\{([a-zA-Z*]+)\}/.exec(src.slice(i + name.length));
        if (after && (name === '\\begin' || name === '\\end')) env = after[1];
        push(KIND.COMMAND, i, i + name.length, env);
        i += name.length; continue;
      }
      // An escaped character: \{ \} \% \& \_ \$ \# and friends.
      push(KIND.COMMAND, i, i + 2); i += 2; continue;
    }
    if (c === '{' || c === '}') { push(KIND.BRACE, i, i + 1); i += 1; continue; }
    if (c === '[' || c === ']') { push(KIND.BRACKET, i, i + 1); i += 1; continue; }
    if (c === '^' || c === '_') { push(KIND.SCRIPT, i, i + 1); i += 1; continue; }
    if (c === '&') { push(KIND.ALIGN, i, i + 1); i += 1; continue; }
    if (/[0-9]/.test(c)) {
      const m = /^[0-9]*\.?[0-9]+/.exec(src.slice(i));
      push(KIND.NUMBER, i, i + m[0].length); i += m[0].length; continue;
    }
    if ('+-=<>/*|'.includes(c)) { push(KIND.OPERATOR, i, i + 1); i += 1; continue; }
    // Plain text runs to the next character that means something.
    const m = /^[^\\{}\[\]^_&%0-9+\-=<>/*|]+/.exec(src.slice(i));
    const len = m ? m[0].length : 1;
    push(KIND.TEXT, i, i + len); i += len;
  }
  return out;
}

export { KIND };

/** The token containing `pos`, or null. Used by the hover. */
export function tokenAt(tokens, pos) {
  for (const t of tokens) if (pos >= t.start && pos < t.end) return t;
  return null;
}

/**
 * Unbalanced braces, reported as positions.
 *
 * Not a LaTeX validator — latex.js is the authority on whether the source is valid, and it
 * says so in the preview. This catches only the one mistake that is both overwhelmingly the
 * most common and genuinely hard to see in a long expression.
 */
export function braceProblems(src) {
  const tokens = tokenize(src);
  const stack = [];
  const bad = [];
  for (const t of tokens) {
    if (t.kind !== KIND.BRACE) continue;
    if (t.text === '{') stack.push(t.start);
    else if (stack.length) stack.pop();
    else bad.push({ pos: t.start, why: 'closing brace with nothing open' });
  }
  for (const pos of stack) bad.push({ pos, why: 'brace is never closed' });
  return bad.sort((a, b) => a.pos - b.pos);
}
