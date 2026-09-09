/**
 * ImaTeX — a LaTeX editor you can drop into any page.
 *
 * ## Why it has no dependencies
 *
 * ImaTeX never imports a maths renderer. It takes a `render(tex, target, display)` callback and calls
 * it; the host decides whether that is latex.js, KaTeX, MathJax or a server round trip. That
 * one decision is what lets it work with latex.js (which is what it was built for) without
 * being welded to it, and what keeps the package at zero runtime dependencies.
 *
 * The same reasoning applies to the UI. It builds plain DOM and exposes a small imperative
 * API, so React, Angular, Vue or nothing at all can host it. `element.js` wraps it as a custom
 * element for hosts that prefer a tag. Styling is entirely CSS custom properties with usable
 * fallbacks, so a host can hand it a palette (ImaDoc hands it the editor's own) without
 * forking the stylesheet.
 *
 * ## Layout
 *
 *   ┌──────────┬────────────────────────────┐
 *   │ symbols  │  code editor (highlighted) │
 *   │ (tree +  ├────────────────────────────┤
 *   │  search) │  live preview              │
 *   └──────────┴────────────────────────────┘
 */
import { CATALOGUE, COMMANDS, describe } from './catalogue.js';
import { tokenize, tokenAt, braceProblems, KIND } from './tokenize.js';
import { QUICK_FIXES, findFixes, applyFixes, describeFixes } from './fixes.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/** Undo history with coalescing, so a burst of typing is one undo rather than forty. */
class History {
  constructor(initial, coalesceMs = 500) {
    this.stack = [{ value: initial, caret: initial.length }];
    this.at = 0;
    this.coalesceMs = coalesceMs;
    this.last = 0;
  }
  push(value, caret, { coalesce = false } = {}) {
    const cur = this.stack[this.at];
    if (cur && cur.value === value) { cur.caret = caret; return; }
    const now = Date.now();
    // Typing coalesces; an insertion from the menu never does, because that is exactly the
    // action someone wants to take back in one press.
    if (coalesce && now - this.last < this.coalesceMs && this.at === this.stack.length - 1) {
      this.stack[this.at] = { value, caret };
    } else {
      this.stack.length = this.at + 1;
      this.stack.push({ value, caret });
      this.at = this.stack.length - 1;
    }
    this.last = now;
  }
  undo() { return this.at > 0 ? this.stack[--this.at] : null; }
  redo() { return this.at < this.stack.length - 1 ? this.stack[++this.at] : null; }
  get canUndo() { return this.at > 0; }
  get canRedo() { return this.at < this.stack.length - 1; }
}

export class ImaTeX {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.mount      where to build the UI
   * @param {string}  [opts.value]        initial LaTeX
   * @param {boolean} [opts.display]      display maths rather than inline
   * @param {(tex:string,target:HTMLElement,display:boolean)=>void|Promise<void>} opts.render
   *   `display` is the toggle's current state, so the preview can be typeset the way the
   *   formula will actually appear. A host that does not care may ignore it.
   * @param {(tex:string,display:boolean)=>void} [opts.onSubmit]
   * @param {()=>void} [opts.onCancel]
   * @param {(tex:string)=>void} [opts.onChange]
   * @param {{from:string,to:string,why:string}[]} [opts.fixes]  offered by the Quick fix
   *   button when the preview fails; defaults to the spacing control symbols, `[]` to disable
   */
  constructor(opts) {
    this.opts = opts;
    this.render = opts.render || (() => {});
    this.history = new History(opts.value || '');
    this.previewTimer = null;
    this.build(opts.mount);
    this.setValue(opts.value || '', { silent: true, keepHistory: true });
    this.paint();
    this.queuePreview(0);
  }

  // ---- construction --------------------------------------------------------------------

  build(mount) {
    mount.classList.add('imatex');
    mount.innerHTML = '';

    const side = el('div', 'imatex-side');
    this.search = el('input', 'imatex-search');
    this.search.type = 'search';
    this.search.placeholder = 'Search symbols…';
    this.search.setAttribute('aria-label', 'Search symbols');
    this.search.oninput = () => this.renderTree(this.search.value);
    side.appendChild(this.search);
    this.tree = el('div', 'imatex-tree');
    this.tree.setAttribute('role', 'tree');
    side.appendChild(this.tree);

    const main = el('div', 'imatex-main');

    const bar = el('div', 'imatex-bar');
    this.undoBtn = this.toolButton('Undo', '↶', () => this.undo());
    this.redoBtn = this.toolButton('Redo', '↷', () => this.redo());
    bar.append(this.undoBtn, this.redoBtn);
    this.displayBtn = this.toolButton('Display maths (own centred line)', '⊟', () => {
      this.displayMode = !this.displayMode;
      this.displayBtn.setAttribute('aria-pressed', String(this.displayMode));
      this.queuePreview(0);
    });
    this.displayMode = !!this.opts.display;
    this.displayBtn.setAttribute('aria-pressed', String(this.displayMode));
    bar.appendChild(this.displayBtn);
    // Only ever shown when the preview has actually failed and a listed fix applies, so it is
    // an answer to an error on screen rather than a standing invitation to rewrite the input.
    this.fixes = this.opts.fixes ?? QUICK_FIXES;
    this.fixBtn = el('button', 'imatex-tool is-fix', 'Quick fix');
    this.fixBtn.type = 'button';
    this.fixBtn.hidden = true;
    this.fixBtn.onclick = () => this.quickFix();
    bar.appendChild(this.fixBtn);
    this.status = el('span', 'imatex-status');
    bar.appendChild(this.status);
    main.appendChild(bar);

    // The code editor: a highlighted <pre> under a transparent textarea. The textarea stays
    // the real control, so selection, undo-in-field, IME and screen readers all behave.
    const codeWrap = el('div', 'imatex-code');
    this.hl = el('pre', 'imatex-hl');
    this.hl.setAttribute('aria-hidden', 'true');
    this.input = el('textarea', 'imatex-input');
    this.input.spellcheck = false;
    this.input.setAttribute('aria-label', 'LaTeX source');
    codeWrap.append(this.hl, this.input);
    main.appendChild(codeWrap);

    const previewWrap = el('div', 'imatex-preview-wrap');
    previewWrap.appendChild(el('div', 'imatex-legend', 'Preview'));
    this.preview = el('div', 'imatex-preview');
    previewWrap.appendChild(this.preview);
    main.appendChild(previewWrap);

    mount.append(side, main);

    this.tip = el('div', 'imatex-tip');
    this.tip.hidden = true;
    mount.appendChild(this.tip);

    this.wire();
    this.renderTree('');
  }

  toolButton(title, glyph, onClick) {
    const b = el('button', 'imatex-tool', glyph);
    b.type = 'button';
    b.title = title;
    b.setAttribute('aria-label', title);
    b.onclick = onClick;
    return b;
  }

  wire() {
    const ta = this.input;
    ta.addEventListener('input', () => {
      this.history.push(ta.value, ta.selectionStart, { coalesce: true });
      this.paint();
      this.queuePreview();
      this.opts.onChange?.(ta.value);
    });
    ta.addEventListener('scroll', () => { this.hl.scrollTop = ta.scrollTop; this.hl.scrollLeft = ta.scrollLeft; });
    ta.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
      else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); this.redo(); }
      else if (mod && e.key === 'Enter') { e.preventDefault(); this.submit(); }
      else if (e.key === 'Tab') { e.preventDefault(); this.nextStop(); }
    });
    // Hover tooltips come off the same tokens the highlighter painted, so what the tooltip
    // says always matches the colour under the pointer.
    ta.addEventListener('mousemove', (e) => this.hover(e));
    ta.addEventListener('mouseleave', () => { this.tip.hidden = true; });
  }

  // ---- the symbol tree -----------------------------------------------------------------

  renderTree(query) {
    const q = String(query || '').trim().toLowerCase();
    this.tree.innerHTML = '';
    let shown = 0;
    for (const cat of CATALOGUE) {
      const groups = [];
      for (const grp of cat.groups) {
        const items = grp.items.filter(([cmd, label]) =>
          !q || cmd.toLowerCase().includes(q) || label.toLowerCase().includes(q));
        if (items.length) groups.push([grp, items]);
      }
      if (!groups.length) continue;
      const det = el('details', 'imatex-cat');
      // With a query everything opens, because a closed group hiding the only match is the
      // whole reason search feels broken.
      det.open = !!q || shown === 0;
      const sum = el('summary', null, cat.label);
      det.appendChild(sum);
      for (const [grp, items] of groups) {
        det.appendChild(el('div', 'imatex-group', grp.label));
        const grid = el('div', 'imatex-grid');
        for (const [cmd, label, sample] of items) {
          const b = el('button', 'imatex-sym');
          b.type = 'button';
          b.title = `${label}\n${cmd}`;
          b.setAttribute('aria-label', `${label} (${cmd})`);
          b.dataset.insert = cmd;
          // The button shows the rendered glyph where the command draws one, and the label
          // otherwise; a grid of identical \begin{...} boxes would be unusable.
          b.dataset.tex = sample || cmd.replace(/[#%]/g, '');
          b.appendChild(el('span', 'imatex-sym-glyph'));
          b.appendChild(el('span', 'imatex-sym-label', label));
          b.onclick = () => this.insert(cmd);
          grid.appendChild(b);
        }
        det.appendChild(grid);
        shown += items.length;
      }
      this.tree.appendChild(det);
    }
    if (!shown) this.tree.appendChild(el('p', 'imatex-empty', `Nothing matches “${query}”.`));
    this.paintGlyphs();
  }

  /** Draw each menu button's glyph with the host's renderer, once, lazily. */
  paintGlyphs() {
    const buttons = [...this.tree.querySelectorAll('.imatex-sym')];
    if (!('IntersectionObserver' in window)) { buttons.forEach((b) => this.paintGlyph(b)); return; }
    // Several hundred buttons, each a full render: only the visible ones are drawn, or
    // opening the panel costs a second of layout for symbols nobody scrolled to.
    this.glyphObserver?.disconnect();
    this.glyphObserver = new IntersectionObserver((entries, obs) => {
      for (const en of entries) if (en.isIntersecting) { this.paintGlyph(en.target); obs.unobserve(en.target); }
    }, { root: this.tree, rootMargin: '120px' });
    buttons.forEach((b) => this.glyphObserver.observe(b));
  }

  paintGlyph(btn) {
    const target = btn.querySelector('.imatex-sym-glyph');
    if (!target || target.dataset.done) return;
    target.dataset.done = '1';
    try { this.render(btn.dataset.tex, target); } catch { target.textContent = btn.dataset.insert; }
  }

  // ---- editing -------------------------------------------------------------------------

  get value() { return this.input.value; }

  setValue(v, { silent = false, keepHistory = false, caret } = {}) {
    this.input.value = v;
    if (caret != null) this.input.selectionStart = this.input.selectionEnd = caret;
    if (!keepHistory) this.history.push(v, this.input.selectionStart);
    this.paint();
    if (!silent) { this.queuePreview(); this.opts.onChange?.(v); }
  }

  /**
   * Insert a snippet at the caret. `#` marks where the caret lands and `%` a further stop, so
   * `\frac{#}{%}` leaves you in the numerator with Tab ready to jump to the denominator.
   */
  insert(snippet) {
    const ta = this.input;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const selected = ta.value.slice(start, end);
    // A selection is wrapped rather than replaced: selecting `x` and choosing \sqrt should
    // give \sqrt{x}, which is what someone means by it.
    let body = snippet.includes('#') && selected ? snippet.replace('#', selected) : snippet;
    const caretAt = body.indexOf('#');
    const clean = body.replace(/#/g, '').replace(/%/g, '');
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    ta.value = before + clean + after;
    const caret = start + (caretAt >= 0 ? caretAt : clean.length);
    ta.selectionStart = ta.selectionEnd = caret;
    // Never coalesced: an insertion is one discrete action to undo.
    this.history.push(ta.value, caret);
    this.paint();
    this.queuePreview();
    this.opts.onChange?.(ta.value);
    ta.focus();
  }

  /** Tab: jump to the next empty group `{}`, which is where a snippet left a hole. */
  nextStop() {
    const ta = this.input;
    const from = ta.selectionEnd ?? 0;
    const idx = ta.value.indexOf('{}', from);
    const at = idx >= 0 ? idx + 1 : ta.value.indexOf('{}') + 1;
    if (at > 0) { ta.selectionStart = ta.selectionEnd = at; ta.focus(); }
  }

  undo() { const s = this.history.undo(); if (s) this.apply(s); }
  redo() { const s = this.history.redo(); if (s) this.apply(s); }
  apply(state) {
    this.input.value = state.value;
    this.input.selectionStart = this.input.selectionEnd = Math.min(state.caret, state.value.length);
    this.paint();
    this.queuePreview();
    this.opts.onChange?.(state.value);
    this.input.focus();
  }

  submit() { this.opts.onSubmit?.(this.input.value, this.displayMode); }
  cancel() { this.opts.onCancel?.(); }

  // ---- painting ------------------------------------------------------------------------

  paint() {
    const src = this.input.value;
    const tokens = tokenize(src);
    let html = '';
    for (const t of tokens) {
      const known = t.kind === KIND.COMMAND && (COMMANDS.has(t.text) || describe(t.text, t.env));
      const cls = `imatex-t-${t.kind}${t.kind === KIND.COMMAND && !known ? ' imatex-t-unknown' : ''}`;
      html += `<span class="${cls}">${esc(t.text)}</span>`;
    }
    this.hl.innerHTML = html + '\n';
    this.hl.scrollTop = this.input.scrollTop;
    this.undoBtn.disabled = !this.history.canUndo;
    this.redoBtn.disabled = !this.history.canRedo;
    const bad = braceProblems(src);
    this.status.textContent = bad.length ? `⚠ ${bad[0].why} at character ${bad[0].pos + 1}` : '';
    this.status.className = `imatex-status${bad.length ? ' is-warn' : ''}`;
  }

  /**
   * Apply every applicable fix, as one undoable step, and say what changed. The caret is left
   * at the end because the text around it has moved; putting it back where it looked like it
   * was would land it inside a macro name it was never in.
   */
  quickFix() {
    const { out, applied } = applyFixes(this.input.value, this.fixes);
    if (!applied.length) return;
    this.setValue(out, { caret: out.length });
    this.queuePreview(0);
    this.status.textContent = `Fixed: ${describeFixes(applied)}`;
    this.status.className = 'imatex-status';
    this.input.focus();
  }

  queuePreview(delay = 250) {
    clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => this.paintPreview(), delay);
  }

  async paintPreview() {
    const tex = this.input.value;
    this.preview.classList.toggle('is-display', this.displayMode);
    this.preview.textContent = '';
    if (!tex.trim()) { this.preview.appendChild(el('span', 'imatex-empty', 'Nothing to preview yet.')); return; }
    try {
      await this.render(tex, this.preview, this.displayMode);
      this.offerFixes(null);
    } catch (e) {
      // A half-typed formula is invalid most of the time, so this is the normal state while
      // someone works, not an error worth shouting about.
      this.preview.textContent = '';
      this.preview.appendChild(el('span', 'imatex-invalid', String(e && e.message || e)));
      this.offerFixes(findFixes(tex, this.fixes));
    }
  }

  /**
   * Show the Quick fix button, and say what the renderer actually objected to.
   *
   * The message a renderer gives for an undefined control symbol is about wherever its parse
   * came apart, which is usually the end of the document and never the two characters at
   * fault. When a listed fix matches, the culprit is named here instead.
   */
  offerFixes(applied) {
    const has = !!applied?.length;
    this.fixBtn.hidden = !has;
    if (!has) return;
    this.fixBtn.title = `Replace ${describeFixes(applied)}`;
    this.preview.appendChild(el('span', 'imatex-fix-note',
      `${applied.map((f) => f.from).join(', ')} is not supported by this renderer. `
      + `Quick fix replaces it with ${applied.map((f) => f.to).join(', ')}, which means the same thing.`));
  }

  // ---- hover ---------------------------------------------------------------------------

  hover(e) {
    const pos = this.caretFromPoint(e);
    if (pos == null) { this.tip.hidden = true; return; }
    const t = tokenAt(tokenize(this.input.value), pos);
    if (!t || t.kind !== KIND.COMMAND) { this.tip.hidden = true; return; }
    const doc = describe(t.text, t.env);
    if (!doc) { this.tip.hidden = true; return; }
    this.tip.textContent = '';
    this.tip.appendChild(el('code', 'imatex-tip-cmd', t.text + (t.env ? `{${t.env}}` : '')));
    this.tip.appendChild(el('span', 'imatex-tip-label', doc.label));
    this.tip.appendChild(el('span', 'imatex-tip-cat', doc.category));
    this.tip.hidden = false;
    const host = this.opts.mount.getBoundingClientRect();
    this.tip.style.left = `${Math.max(4, e.clientX - host.left + 8)}px`;
    this.tip.style.top = `${e.clientY - host.top + 18}px`;
  }

  /**
   * Which character of the source is under the pointer.
   *
   * A textarea exposes no such mapping, so this measures against the highlight overlay, which
   * holds the same text at the same metrics — the one real advantage of painting it twice.
   */
  caretFromPoint(e) {
    const range = document.caretRangeFromPoint?.(e.clientX, e.clientY)
      ?? (document.caretPositionFromPoint ? (() => {
        const p = document.caretPositionFromPoint(e.clientX, e.clientY);
        return p && { startContainer: p.offsetNode, startOffset: p.offset };
      })() : null);
    if (!range || !this.hl.contains(range.startContainer)) {
      // The overlay is behind the textarea and does not receive the pointer, so walk the
      // spans and hit-test their rectangles instead.
      for (const span of this.hl.querySelectorAll('span')) {
        for (const r of span.getClientRects()) {
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
            return this.offsetOfSpan(span);
          }
        }
      }
      return null;
    }
    return this.offsetOfSpan(range.startContainer.parentElement) + range.startOffset;
  }

  offsetOfSpan(span) {
    let n = 0;
    for (const s of this.hl.querySelectorAll('span')) {
      if (s === span) return n;
      n += s.textContent.length;
    }
    return n;
  }

  destroy() {
    this.glyphObserver?.disconnect();
    clearTimeout(this.previewTimer);
    this.opts.mount.innerHTML = '';
  }
}

export { CATALOGUE, COMMANDS, describe, tokenize, braceProblems };
