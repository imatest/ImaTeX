import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGUE, COMMANDS, describe } from '../src/catalogue.js';
import { tokenize, tokenAt, braceProblems, KIND } from '../src/tokenize.js';

/**
 * The parts of ImaTeX that do not need a DOM. The UI is exercised in a browser (see
 * test/README.md); what is checked here is the catalogue and the tokenizer, because those two
 * back three separate features and a fault in either shows up as a wrong tooltip, which is
 * the kind of wrong that nobody reports.
 */

test('the tokenizer covers every character exactly once, in order', () => {
  // The highlighter concatenates token text to rebuild the source. Any gap or overlap and the
  // painted text stops matching what the user typed.
  for (const src of [
    '\\frac{a}{b}', 'x^{2}_{i}', '\\begin{cases}a & b\\\\c\\end{cases}',
    '% just a comment', '2.5 + \\alpha', '\\{escaped\\}', 'plain text', '',
    '\\sum_{i=1}^{n} \\alpha_i', 'a & b \\\\ c', '\\%literal percent',
  ]) {
    const toks = tokenize(src);
    let pos = 0;
    for (const t of toks) {
      assert.equal(t.start, pos, `gap or overlap in: ${src}`);
      assert.equal(t.text, src.slice(t.start, t.end));
      pos = t.end;
    }
    assert.equal(pos, src.length, `did not reach the end of: ${src}`);
    assert.equal(toks.map((t) => t.text).join(''), src, `does not rebuild: ${src}`);
  }
});

test('a double backslash is a line break, not a command named backslash', () => {
  const toks = tokenize('a \\\\ b');
  assert.equal(toks.find((t) => t.text === '\\\\')?.kind, KIND.ALIGN);
});

test('an escaped character is one token, so \\% is not a comment', () => {
  const toks = tokenize('50\\% of it');
  assert.ok(!toks.some((t) => t.kind === KIND.COMMENT), 'an escaped percent started a comment');
  assert.ok(toks.some((t) => t.text === '\\%'));
});

test('a comment runs to the end of its line and no further', () => {
  const toks = tokenize('a % note\nb');
  const c = toks.find((t) => t.kind === KIND.COMMENT);
  assert.equal(c.text, '% note');
  assert.ok(toks.some((t) => t.text.includes('b')), 'the next line was swallowed');
});

test('an environment name travels with begin and end', () => {
  // So a hover on \begin can say WHICH environment it opens, rather than "an environment".
  const toks = tokenize('\\begin{pmatrix}a\\end{pmatrix}');
  assert.equal(toks.find((t) => t.text === '\\begin')?.env, 'pmatrix');
  assert.equal(toks.find((t) => t.text === '\\end')?.env, 'pmatrix');
});

test('unbalanced braces are found, and balanced ones are not', () => {
  assert.deepEqual(braceProblems('\\frac{a}{b}'), []);
  assert.deepEqual(braceProblems('\\sqrt{x^{2}}'), []);
  assert.equal(braceProblems('\\frac{a}{b').length, 1);
  assert.equal(braceProblems('a}b')[0].why, 'closing brace with nothing open');
  // A brace inside a comment is not code and must not be counted.
  assert.deepEqual(braceProblems('\\frac{a}{b} % a { here'), []);
});

test('tokenAt finds the token under a position', () => {
  const src = '\\frac{a}{b}';
  const toks = tokenize(src);
  assert.equal(tokenAt(toks, 0).text, '\\frac');
  assert.equal(tokenAt(toks, 4).text, '\\frac');
  assert.equal(tokenAt(toks, 5).text, '{');
  assert.equal(tokenAt(toks, src.length), null);
});

test('every catalogue entry is well formed', () => {
  let count = 0;
  for (const cat of CATALOGUE) {
    assert.ok(cat.id && cat.label, 'a category has no id or label');
    for (const grp of cat.groups) {
      assert.ok(grp.label, `a group in ${cat.id} has no label`);
      for (const [cmd, label, sample] of grp.items) {
        count++;
        assert.equal(typeof cmd, 'string', `${cat.id}: command is not a string`);
        assert.ok(cmd.length, `${cat.id}: empty command`);
        assert.ok(label && label.length, `${cmd}: no label — the tooltip would be blank`);
        assert.ok(sample === undefined || typeof sample === 'string', `${cmd}: bad sample`);
        // '#' marks the caret; a second '#' would be ambiguous about where it lands.
        assert.ok((cmd.match(/#/g) || []).length <= 1, `${cmd}: more than one caret marker`);
      }
    }
  }
  assert.ok(count > 250, `only ${count} commands — the catalogue has shrunk`);
});

test('structural commands are described structurally, not by the first entry using them', () => {
  // The bug this replaces: \begin was documented as "a matrix with no delimiters" because the
  // matrix entries claimed the bare key, so hovering \begin in a cases block explained a matrix.
  assert.equal(describe('\\begin').label, 'start an environment');
  assert.equal(describe('\\left').label, 'open an auto-sized delimiter');
  assert.match(describe('\\begin', 'cases').label, /case distinction/);
  assert.equal(describe('\\frac').label, 'a fraction');
  assert.equal(describe('\\nosuchthing'), null);
});

test('every command a snippet inserts is one the tokenizer will recognise', () => {
  // Otherwise the menu inserts something its own highlighter paints as an unknown command.
  for (const cat of CATALOGUE) {
    for (const grp of cat.groups) {
      for (const [cmd] of grp.items) {
        const head = /^\\[a-zA-Z]+/.exec(cmd);
        if (!head) continue;
        const toks = tokenize(cmd.replace(/[#%]/g, 'x'));
        assert.equal(toks[0].kind, KIND.COMMAND, `${cmd}: does not start with a command token`);
        assert.equal(toks[0].text, head[0], `${cmd}: tokenized as ${toks[0].text}`);
        assert.ok(describe(head[0], toks[0].env), `${cmd}: inserts ${head[0]}, which has no description`);
      }
    }
  }
});
