/**
 * A popup shell around the editor, for hosts that want one rather than embedding the panel.
 *
 * Kept separate from `ImaTeX` on purpose: a host embedding the editor in its own dialog (or in
 * a page, or a side panel) should not have to fight a modal it did not ask for.
 */
import { ImaTeX } from './imatex.js';

export function openImaTeX(opts = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'imatex-modal';
  overlay.innerHTML = `<div class="imatex-modal-box" role="dialog" aria-modal="true" aria-label="LaTeX editor">
      <div class="imatex-modal-head"><h2>${opts.title || 'LaTeX'}</h2>
        <button type="button" class="imatex-btn" data-act="close" aria-label="Close">✕</button></div>
      <div class="imatex-modal-body"></div>
      <div class="imatex-modal-foot">
        <button type="button" class="imatex-btn" data-act="cancel">Cancel</button>
        <button type="button" class="imatex-btn is-primary" data-act="ok">${opts.okLabel || 'Insert'}</button>
      </div></div>`;
  (opts.container || document.body).appendChild(overlay);

  let editor = null;
  const close = () => { editor?.destroy(); overlay.remove(); document.removeEventListener('keydown', onKey); };
  const cancel = () => { close(); opts.onCancel?.(); };
  const ok = () => { const v = editor.value, d = editor.displayMode; close(); opts.onSubmit?.(v, d); };
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); cancel(); } };

  editor = new ImaTeX({ ...opts, mount: overlay.querySelector('.imatex-modal-body'), onSubmit: ok, onCancel: cancel });
  overlay.querySelector('[data-act="close"]').onclick = cancel;
  overlay.querySelector('[data-act="cancel"]').onclick = cancel;
  overlay.querySelector('[data-act="ok"]').onclick = ok;
  // A click on the backdrop cancels; a click inside must not, or a drag that ends outside
  // the box would throw the work away.
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) cancel(); });
  document.addEventListener('keydown', onKey);
  setTimeout(() => editor.input.focus(), 0);
  return { editor, close };
}
