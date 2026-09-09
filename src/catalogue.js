/**
 * The command catalogue: one table behind three features.
 *
 * The left-hand menu, the hover tooltips and the syntax highlighter all read from this, and
 * that is deliberate — three separate lists of LaTeX commands would drift apart within a
 * month, and the one that drifts silently is the tooltip.
 *
 * Each entry is `[command, label, sample?]`:
 *   command  what is inserted, with `#` marking where the caret should land and `%` marking
 *            a further tab stop. `\frac{#}{%}` puts the caret in the numerator.
 *   label    what a human calls it. This is what the tooltip says and what the menu搜索
 *            matches, so it is written for someone who does not yet know the command.
 *   sample   what to draw on the menu button when the command itself is not legible as a
 *            glyph. Omitted when the rendered command IS the glyph.
 *
 * "All of LaTeX" is not a finite set — it is a macro language, and any package can add more.
 * What this aims at is complete coverage of the *maths* command space that latex.js and KaTeX
 * actually implement, which is the part an author of this kind of documentation needs.
 */

/** @typedef {[string, string, string?]} Entry */

export const CATALOGUE = [
  { id: 'greek', label: 'Greek', groups: [
    { label: 'Lowercase', items: [
      ['\\alpha', 'alpha'], ['\\beta', 'beta'], ['\\gamma', 'gamma'], ['\\delta', 'delta'],
      ['\\epsilon', 'epsilon'], ['\\varepsilon', 'epsilon (variant)'], ['\\zeta', 'zeta'],
      ['\\eta', 'eta'], ['\\theta', 'theta'], ['\\vartheta', 'theta (variant)'],
      ['\\iota', 'iota'], ['\\kappa', 'kappa'], ['\\lambda', 'lambda'], ['\\mu', 'mu'],
      ['\\nu', 'nu'], ['\\xi', 'xi'], ['\\pi', 'pi'], ['\\varpi', 'pi (variant)'],
      ['\\rho', 'rho'], ['\\varrho', 'rho (variant)'], ['\\sigma', 'sigma'],
      ['\\varsigma', 'sigma (final)'], ['\\tau', 'tau'], ['\\upsilon', 'upsilon'],
      ['\\phi', 'phi'], ['\\varphi', 'phi (variant)'], ['\\chi', 'chi'], ['\\psi', 'psi'],
      ['\\omega', 'omega'],
    ] },
    { label: 'Uppercase', items: [
      ['\\Gamma', 'Gamma'], ['\\Delta', 'Delta'], ['\\Theta', 'Theta'], ['\\Lambda', 'Lambda'],
      ['\\Xi', 'Xi'], ['\\Pi', 'Pi'], ['\\Sigma', 'Sigma'], ['\\Upsilon', 'Upsilon'],
      ['\\Phi', 'Phi'], ['\\Psi', 'Psi'], ['\\Omega', 'Omega'],
    ] },
  ] },

  { id: 'operators', label: 'Operators', groups: [
    { label: 'Binary', items: [
      ['+', 'plus'], ['-', 'minus'], ['\\pm', 'plus or minus'], ['\\mp', 'minus or plus'],
      ['\\times', 'multiplied by'], ['\\div', 'divided by'], ['\\cdot', 'centred dot'],
      ['\\ast', 'asterisk'], ['\\star', 'star'], ['\\circ', 'ring'], ['\\bullet', 'bullet'],
      ['\\oplus', 'circled plus'], ['\\ominus', 'circled minus'], ['\\otimes', 'circled times'],
      ['\\oslash', 'circled slash'], ['\\odot', 'circled dot'],
      ['\\cap', 'intersection'], ['\\cup', 'union'], ['\\sqcap', 'square cap'],
      ['\\sqcup', 'square cup'], ['\\vee', 'logical or'], ['\\wedge', 'logical and'],
      ['\\setminus', 'set minus'], ['\\wr', 'wreath product'], ['\\dagger', 'dagger'],
      ['\\ddagger', 'double dagger'], ['\\amalg', 'amalgamation'],
    ] },
    { label: 'Big operators', items: [
      ['\\sum_{#}^{%}', 'sum over a range', '\\sum'],
      ['\\prod_{#}^{%}', 'product over a range', '\\prod'],
      ['\\coprod_{#}^{%}', 'coproduct', '\\coprod'],
      ['\\int_{#}^{%}', 'integral', '\\int'],
      ['\\iint_{#}', 'double integral', '\\iint'],
      ['\\iiint_{#}', 'triple integral', '\\iiint'],
      ['\\oint_{#}', 'contour integral', '\\oint'],
      ['\\bigcup_{#}', 'union over a range', '\\bigcup'],
      ['\\bigcap_{#}', 'intersection over a range', '\\bigcap'],
      ['\\bigoplus_{#}', 'direct sum', '\\bigoplus'],
      ['\\bigotimes_{#}', 'tensor product', '\\bigotimes'],
      ['\\bigvee_{#}', 'logical or over a range', '\\bigvee'],
      ['\\bigwedge_{#}', 'logical and over a range', '\\bigwedge'],
      ['\\bigsqcup_{#}', 'square union over a range', '\\bigsqcup'],
    ] },
    { label: 'Named functions', items: [
      ['\\log', 'logarithm'], ['\\ln', 'natural logarithm'], ['\\lg', 'base-2 logarithm'],
      ['\\exp', 'exponential'], ['\\sin', 'sine'], ['\\cos', 'cosine'], ['\\tan', 'tangent'],
      ['\\csc', 'cosecant'], ['\\sec', 'secant'], ['\\cot', 'cotangent'],
      ['\\arcsin', 'arcsine'], ['\\arccos', 'arccosine'], ['\\arctan', 'arctangent'],
      ['\\sinh', 'hyperbolic sine'], ['\\cosh', 'hyperbolic cosine'], ['\\tanh', 'hyperbolic tangent'],
      ['\\coth', 'hyperbolic cotangent'], ['\\lim_{#}', 'limit'], ['\\limsup', 'limit superior'],
      ['\\liminf', 'limit inferior'], ['\\max', 'maximum'], ['\\min', 'minimum'],
      ['\\sup', 'supremum'], ['\\inf', 'infimum'], ['\\arg', 'argument'], ['\\deg', 'degree'],
      ['\\det', 'determinant'], ['\\dim', 'dimension'], ['\\gcd', 'greatest common divisor'],
      ['\\hom', 'hom'], ['\\ker', 'kernel'], ['\\Pr', 'probability'],
      ['\\operatorname{#}', 'a function name of your own'],
    ] },
  ] },

  { id: 'relations', label: 'Relations', groups: [
    { label: 'Equality and order', items: [
      ['=', 'equals'], ['\\neq', 'not equal to'], ['\\equiv', 'equivalent to'],
      ['\\approx', 'approximately equal to'], ['\\cong', 'congruent to'],
      ['\\simeq', 'asymptotically equal to'], ['\\sim', 'similar to'],
      ['\\propto', 'proportional to'], ['<', 'less than'], ['>', 'greater than'],
      ['\\leq', 'less than or equal to'], ['\\geq', 'greater than or equal to'],
      ['\\ll', 'much less than'], ['\\gg', 'much greater than'],
      ['\\prec', 'precedes'], ['\\succ', 'succeeds'], ['\\preceq', 'precedes or equals'],
      ['\\succeq', 'succeeds or equals'], ['\\doteq', 'approaches the limit'],
      ['\\asymp', 'asymptotic to'], ['\\bowtie', 'bowtie'],
    ] },
    { label: 'Sets and logic', items: [
      ['\\in', 'is a member of'], ['\\notin', 'is not a member of'], ['\\ni', 'contains'],
      ['\\subset', 'is a subset of'], ['\\supset', 'is a superset of'],
      ['\\subseteq', 'is a subset of or equal to'], ['\\supseteq', 'is a superset of or equal to'],
      ['\\sqsubseteq', 'square subset or equal'], ['\\sqsupseteq', 'square superset or equal'],
      ['\\emptyset', 'the empty set'], ['\\varnothing', 'the empty set (variant)'],
      ['\\forall', 'for all'], ['\\exists', 'there exists'], ['\\nexists', 'there does not exist'],
      ['\\neg', 'logical not'], ['\\top', 'top'], ['\\bot', 'bottom'],
      ['\\vdash', 'proves'], ['\\dashv', 'is proved by'], ['\\models', 'models'],
      ['\\perp', 'perpendicular to'], ['\\parallel', 'parallel to'], ['\\mid', 'divides'],
    ] },
  ] },

  { id: 'arrows', label: 'Arrows', groups: [
    { label: 'Simple', items: [
      ['\\leftarrow', 'left arrow'], ['\\rightarrow', 'right arrow'],
      ['\\leftrightarrow', 'left-right arrow'], ['\\uparrow', 'up arrow'],
      ['\\downarrow', 'down arrow'], ['\\updownarrow', 'up-down arrow'],
      ['\\nearrow', 'north-east arrow'], ['\\searrow', 'south-east arrow'],
      ['\\swarrow', 'south-west arrow'], ['\\nwarrow', 'north-west arrow'],
      ['\\mapsto', 'maps to'], ['\\to', 'to'], ['\\gets', 'gets'],
      ['\\hookleftarrow', 'hooked left arrow'], ['\\hookrightarrow', 'hooked right arrow'],
      ['\\rightharpoonup', 'right harpoon up'], ['\\leftharpoonup', 'left harpoon up'],
      ['\\rightleftharpoons', 'equilibrium'],
    ] },
    { label: 'Double and long', items: [
      ['\\Leftarrow', 'double left arrow'], ['\\Rightarrow', 'implies'],
      ['\\Leftrightarrow', 'if and only if'], ['\\Uparrow', 'double up arrow'],
      ['\\Downarrow', 'double down arrow'], ['\\Updownarrow', 'double up-down arrow'],
      ['\\longleftarrow', 'long left arrow'], ['\\longrightarrow', 'long right arrow'],
      ['\\longleftrightarrow', 'long left-right arrow'],
      ['\\Longleftarrow', 'long double left arrow'], ['\\Longrightarrow', 'long implies'],
      ['\\Longleftrightarrow', 'long if and only if'], ['\\longmapsto', 'long maps to'],
      ['\\xrightarrow{#}', 'right arrow with a label over it'],
      ['\\xleftarrow{#}', 'left arrow with a label over it'],
    ] },
  ] },

  { id: 'structures', label: 'Structures', groups: [
    { label: 'Fractions and roots', items: [
      ['\\frac{#}{%}', 'a fraction', '\\frac{a}{b}'],
      ['\\dfrac{#}{%}', 'a fraction, always full size', '\\dfrac{a}{b}'],
      ['\\tfrac{#}{%}', 'a fraction, always small', '\\tfrac{a}{b}'],
      ['\\cfrac{#}{%}', 'a continued fraction', '\\frac{a}{b}'],
      ['\\binom{#}{%}', 'binomial coefficient', '\\binom{n}{k}'],
      ['\\sqrt{#}', 'square root', '\\sqrt{x}'],
      ['\\sqrt[#]{%}', 'nth root', '\\sqrt[3]{x}'],
    ] },
    { label: 'Scripts', items: [
      ['^{#}', 'superscript', 'x^{2}'], ['_{#}', 'subscript', 'x_{i}'],
      ['^{#}_{%}', 'super and subscript', 'x^{2}_{i}'],
      ['\\overset{#}{%}', 'something set above', '\\overset{a}{b}'],
      ['\\underset{#}{%}', 'something set below', '\\underset{a}{b}'],
      ['\\stackrel{#}{%}', 'a relation with something above it', '\\stackrel{a}{=}'],
      ['\\substack{# \\\\ %}', 'a multi-line subscript', '\\sum_{\\substack{a\\\\b}}'],
    ] },
    { label: 'Accents', items: [
      ['\\hat{#}', 'hat', '\\hat{x}'], ['\\widehat{#}', 'wide hat', '\\widehat{xy}'],
      ['\\bar{#}', 'bar', '\\bar{x}'], ['\\overline{#}', 'overline', '\\overline{xy}'],
      ['\\underline{#}', 'underline', '\\underline{xy}'],
      ['\\vec{#}', 'vector arrow', '\\vec{v}'],
      ['\\overrightarrow{#}', 'wide vector arrow', '\\overrightarrow{AB}'],
      ['\\dot{#}', 'dot', '\\dot{x}'], ['\\ddot{#}', 'double dot', '\\ddot{x}'],
      ['\\tilde{#}', 'tilde', '\\tilde{x}'], ['\\widetilde{#}', 'wide tilde', '\\widetilde{xy}'],
      ['\\check{#}', 'caron', '\\check{x}'], ['\\breve{#}', 'breve', '\\breve{x}'],
      ['\\acute{#}', 'acute', '\\acute{x}'], ['\\grave{#}', 'grave', '\\grave{x}'],
      ['\\overbrace{#}', 'brace above', '\\overbrace{xy}'],
      ['\\underbrace{#}', 'brace below', '\\underbrace{xy}'],
    ] },
    { label: 'Delimiters', items: [
      ['\\left( # \\right)', 'auto-sized parentheses', '(x)'],
      ['\\left[ # \\right]', 'auto-sized brackets', '[x]'],
      ['\\left\\{ # \\right\\}', 'auto-sized braces', '\\{x\\}'],
      ['\\left| # \\right|', 'absolute value', '|x|'],
      ['\\left\\| # \\right\\|', 'norm', '\\|x\\|'],
      ['\\langle # \\rangle', 'angle brackets', '\\langle x \\rangle'],
      ['\\lfloor # \\rfloor', 'floor', '\\lfloor x \\rfloor'],
      ['\\lceil # \\rceil', 'ceiling', '\\lceil x \\rceil'],
      ['\\bigl( # \\bigr)', 'slightly larger parentheses', '(x)'],
      ['\\Bigl( # \\Bigr)', 'larger parentheses', '(x)'],
    ] },
  ] },

  { id: 'environments', label: 'Environments', groups: [
    { label: 'Matrices', items: [
      ['\\begin{matrix} # & % \\\\ a & b \\end{matrix}', 'a matrix with no delimiters', '\\begin{matrix}a&b\\\\c&d\\end{matrix}'],
      ['\\begin{pmatrix} # & % \\\\ a & b \\end{pmatrix}', 'a matrix in parentheses', '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}'],
      ['\\begin{bmatrix} # & % \\\\ a & b \\end{bmatrix}', 'a matrix in brackets', '\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}'],
      ['\\begin{vmatrix} # & % \\\\ a & b \\end{vmatrix}', 'a determinant', '\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}'],
      ['\\begin{Bmatrix} # & % \\\\ a & b \\end{Bmatrix}', 'a matrix in braces', '\\begin{Bmatrix}a&b\\\\c&d\\end{Bmatrix}'],
    ] },
    { label: 'Alignment', items: [
      ['\\begin{cases} # & \\text{if } % \\\\ 0 & \\text{otherwise} \\end{cases}', 'a case distinction', '\\begin{cases}a&x>0\\\\b&x<0\\end{cases}'],
      ['\\begin{aligned} # &= % \\\\ &= c \\end{aligned}', 'several lines aligned on a symbol', '\\begin{aligned}a&=b\\\\&=c\\end{aligned}'],
      ['\\begin{array}{cc} # & % \\\\ a & b \\end{array}', 'an array with column alignment', '\\begin{array}{cc}a&b\\end{array}'],
      ['\\\\', 'a line break'],
      ['&', 'an alignment point'],
    ] },
  ] },

  { id: 'style', label: 'Style', groups: [
    { label: 'Fonts', items: [
      ['\\mathrm{#}', 'upright roman', '\\mathrm{abc}'],
      ['\\mathbf{#}', 'bold', '\\mathbf{abc}'],
      ['\\mathit{#}', 'italic', '\\mathit{abc}'],
      ['\\mathsf{#}', 'sans serif', '\\mathsf{abc}'],
      ['\\mathtt{#}', 'monospace', '\\mathtt{abc}'],
      ['\\mathcal{#}', 'calligraphic', '\\mathcal{ABC}'],
      ['\\mathbb{#}', 'blackboard bold', '\\mathbb{RNZ}'],
      ['\\mathfrak{#}', 'fraktur', '\\mathfrak{abc}'],
      ['\\text{#}', 'ordinary text inside maths', '\\text{abc}'],
      ['\\textbf{#}', 'bold text'], ['\\textit{#}', 'italic text'],
    ] },
    { label: 'Size and spacing', items: [
      ['\\displaystyle ', 'render as display maths'], ['\\textstyle ', 'render as inline maths'],
      ['\\scriptstyle ', 'render at script size'],
      ['\\,', 'a thin space'], ['\\:', 'a medium space'], ['\\;', 'a thick space'],
      ['\\!', 'a negative thin space'], ['\\quad', 'a quad of space'],
      ['\\qquad', 'two quads of space'], ['\\ ', 'an ordinary space'],
      ['\\phantom{#}', 'space the size of something invisible'],
      ['\\color{red}{#}', 'coloured maths'],
    ] },
  ] },

  { id: 'symbols', label: 'Symbols', groups: [
    { label: 'Common', items: [
      ['\\infty', 'infinity'], ['\\partial', 'partial derivative'], ['\\nabla', 'nabla / del'],
      ['\\hbar', 'reduced Planck constant'], ['\\ell', 'script l'], ['\\Re', 'real part'],
      ['\\Im', 'imaginary part'], ['\\aleph', 'aleph'], ['\\wp', 'Weierstrass p'],
      ['\\prime', 'prime'], ['\\degree', 'degree'], ['\\angle', 'angle'],
      ['\\triangle', 'triangle'], ['\\square', 'square'], ['\\surd', 'radical'],
      ['\\flat', 'flat'], ['\\natural', 'natural'], ['\\sharp', 'sharp'],
      ['\\clubsuit', 'clubs'], ['\\diamondsuit', 'diamonds'], ['\\heartsuit', 'hearts'],
      ['\\spadesuit', 'spades'],
    ] },
    { label: 'Dots', items: [
      ['\\ldots', 'dots on the baseline'], ['\\cdots', 'centred dots'],
      ['\\vdots', 'vertical dots'], ['\\ddots', 'diagonal dots'],
    ] },
  ] },
];

/** Flat index: command → { label, category, group, sample }. Backs tooltips and search. */
export const COMMANDS = (() => {
  const map = new Map();
  for (const cat of CATALOGUE) {
    for (const grp of cat.groups) {
      for (const [cmd, label, sample] of grp.items) {
        // The key is what the highlighter will find in the source: `\frac{#}{%}` is looked
        // up as `\frac`. An environment keys on `\begin{name}`, not on the bare `\begin` —
        // otherwise the first matrix in the list becomes the definition of `\begin` itself,
        // and hovering `\begin` in a `cases` block explains a matrix.
        const env = /^\\begin\{([a-zA-Z*]+)\}/.exec(cmd);
        const key = env ? `\\begin{${env[1]}}`
          : /^\\[a-zA-Z]+/.test(cmd) ? (cmd.match(/^\\[a-zA-Z]+/) || [])[0] : cmd;
        if (!map.has(key)) map.set(key, { label, category: cat.label, group: grp.label, sample, insert: cmd });
      }
    }
  }
  return map;
})();

/** Commands the catalogue does not list but the highlighter should still describe. */
export const EXTRA_DOCS = new Map(Object.entries({
  '\\begin': 'start an environment',
  '\\end': 'end an environment',
  '\\left': 'open an auto-sized delimiter',
  '\\right': 'close an auto-sized delimiter',
  '\\label': 'name this equation so it can be referenced',
  '\\ref': 'refer to a labelled equation',
  '\\tag': 'give this equation a custom number',
  '\\newcommand': 'define a macro',
  '\\mathopen': 'treat as an opening delimiter',
  '\\mathclose': 'treat as a closing delimiter',
  '\\limits': 'put the limits above and below',
  '\\nolimits': 'put the limits to the side',
}));

/** What a command means, for a tooltip. Null when nothing is known about it. */
export function describe(cmd, envName) {
  // A structural command is described by EXTRA_DOCS even when the catalogue also lists
  // something that begins with it, so `\left` is "open an auto-sized delimiter" rather than
  // whichever delimiter pair happens to be first in the list.
  const extra = EXTRA_DOCS.get(cmd);
  if (extra) {
    const env = envName && COMMANDS.get(`\\begin{${envName}}`);
    return env ? { label: `${extra}: ${env.label}`, category: `${env.category} · ${env.group}` }
      : { label: extra, category: 'Structure' };
  }
  const hit = COMMANDS.get(cmd);
  return hit ? { label: hit.label, category: `${hit.category} · ${hit.group}` } : null;
}
