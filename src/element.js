/**
 * `<imatex-editor>` — the same editor as a custom element, for hosts that would rather write
 * a tag than call a constructor. Not required by anything; ImaTeX itself has no idea it exists.
 *
 *   const node = document.createElement('imatex-editor');
 *   node.renderer = (tex, target) => { … };
 *   node.value = '\\frac{a}{b}';
 *   node.addEventListener('imatex-submit', (e) => console.log(e.detail.value));
 */
import { ImaTeX } from './imatex.js';

export class ImaTeXElement extends HTMLElement {
  connectedCallback() {
    if (this.editor) return;
    this.editor = new ImaTeX({
      mount: this,
      value: this.getAttribute('value') || this._value || '',
      display: this.hasAttribute('display'),
      render: this.renderer || (() => {}),
      onChange: (v) => this.dispatchEvent(new CustomEvent('imatex-change', { detail: { value: v } })),
      onSubmit: (v, d) => this.dispatchEvent(new CustomEvent('imatex-submit', { detail: { value: v, display: d } })),
      onCancel: () => this.dispatchEvent(new CustomEvent('imatex-cancel')),
    });
  }
  disconnectedCallback() { this.editor?.destroy(); this.editor = null; }
  get value() { return this.editor ? this.editor.value : (this._value || ''); }
  set value(v) { this._value = v; this.editor?.setValue(v); }
}

if (typeof customElements !== 'undefined' && !customElements.get('imatex-editor')) {
  customElements.define('imatex-editor', ImaTeXElement);
}
