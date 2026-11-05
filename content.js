// ReadEase Content Script - restyles pages dynamically via CSS variables
const S_MAT = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
};
const E_MAT = [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]];
let activeSettings = null, targetY = 150, rafId = null;

// Daltonization 4x5 feColorMatrix (Machado et al. 2009)
function buildMatrix(type, str) {
  const S = S_MAT[type] || S_MAT.protanopia;
  const I_S = [0, 1, 2].map(r => [0, 1, 2].map(c => (r === c ? 1 : 0) - S[r][c]));
  const E_mult = [0, 1, 2].map(r => [0, 1, 2].map(c => E_MAT[r][0] * I_S[0][c] + E_MAT[r][1] * I_S[1][c] + E_MAT[r][2] * I_S[2][c]));
  const F = [0, 1, 2].map(r => [0, 1, 2].map(c => (r === c ? 1 : 0) + str * E_mult[r][c]));
  return [...F[0], 0, 0, ...F[1], 0, 0, ...F[2], 0, 0, 0, 0, 0, 1, 0].map(v => Number(v.toFixed(4))).join(' ');
}

// Injects base CSS rules driven by custom properties
function ensureStyle() {
  if (document.getElementById('readease-style')) return;
  const s = document.createElement('style');
  s.id = 'readease-style';
  s.textContent = `
    :root { --re-font: inherit; --re-ls: normal; --re-ws: normal; --re-lh: normal; --re-mw: none; --re-ps: inherit; --re-bg: transparent; --re-color: inherit; --re-zoom: 1; --re-filter: none; --re-link: inherit; --re-outline: none; --re-cursor: auto; }
    body, p, li, td, h1, h2, h3, h4, h5, h6, a, span { font-family: var(--re-font) !important; letter-spacing: var(--re-ls) !important; word-spacing: var(--re-ws) !important; line-height: var(--re-lh) !important; color: var(--re-color) !important; }
    p { margin-bottom: var(--re-ps) !important; } p, li { max-width: var(--re-mw) !important; }
    html { background-color: var(--re-bg) !important; filter: var(--re-filter) !important; zoom: var(--re-zoom) !important; cursor: var(--re-cursor) !important; }
    body { background-color: var(--re-bg) !important; }
    a { text-decoration: var(--re-link) !important; }
    *:focus, *:focus-visible { outline: var(--re-outline) !important; outline-offset: 2px !important; }
  `;
  (document.head || document.documentElement).appendChild(s);
}

// Reading ruler animation and overlay
function updateRuler() {
  rafId = null;
  const t = document.getElementById('readease-ruler-top'), b = document.getElementById('readease-ruler-btm');
  if (t && b) { t.style.height = Math.max(0, targetY - 32) + 'px'; b.style.top = (targetY + 32) + 'px'; }
}
const onMouseMove = (e) => { targetY = e.clientY; if (!rafId) rafId = requestAnimationFrame(updateRuler); };

function ensureRuler(enable) {
  let el = document.getElementById('readease-ruler');
  if (!enable) { el?.remove(); window.removeEventListener('mousemove', onMouseMove); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'readease-ruler';
    el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647;';
    el.innerHTML = '<div id="readease-ruler-top" style="position:absolute;top:0;left:0;width:100%;height:0;background:rgba(15,23,42,0.38);"></div><div id="readease-ruler-btm" style="position:absolute;bottom:0;left:0;width:100%;background:rgba(15,23,42,0.38);"></div>';
    (document.body || document.documentElement).appendChild(el);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    updateRuler();
  }
}

// SVG filter for Daltonization
function ensureSvg(enable, type, str) {
  let svg = document.getElementById('readease-svg');
  if (!enable) { svg?.remove(); return; }
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'readease-svg';
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    svg.innerHTML = '<filter id="readease-cb" color-interpolation-filters="linearRGB"><feColorMatrix id="readease-matrix" type="matrix"/></filter>';
    (document.body || document.documentElement).appendChild(svg);
  }
  document.getElementById('readease-matrix')?.setAttribute('values', buildMatrix(type, str ?? 1));
}

// Clean up injected elements
function cleanup() {
  document.getElementById('readease-style')?.remove();
  ensureRuler(false); ensureSvg(false);
  const root = document.documentElement?.style;
  if (root) ['--re-font', '--re-ls', '--re-ws', '--re-lh', '--re-mw', '--re-ps', '--re-bg', '--re-color', '--re-zoom', '--re-filter', '--re-link', '--re-outline', '--re-cursor'].forEach(p => root.removeProperty(p));
}

// Update CSS variables based on active settings
function applySettings(s) {
  activeSettings = s;
  if (!s || s.profile === 'off' || s.disabledHosts?.includes(location.hostname)) { cleanup(); return; }
  ensureStyle();
  ensureRuler(Boolean(s.ruler));
  ensureSvg(s.profile === 'colorblind', s.cbType, s.cbStrength);

  const root = document.documentElement.style;
  root.setProperty('--re-font', s.fontFamily || 'inherit');
  root.setProperty('--re-ls', s.letterSpacing || 'normal');
  root.setProperty('--re-ws', s.wordSpacing || 'normal');
  root.setProperty('--re-lh', s.lineHeight || 'normal');
  root.setProperty('--re-mw', s.maxWidth && s.maxWidth !== 'none' ? s.maxWidth : 'none');
  root.setProperty('--re-ps', s.profile === 'dyslexia' ? '2em' : 'inherit');
  root.setProperty('--re-bg', s.tint || 'transparent');
  root.setProperty('--re-color', s.tint === '#18181b' ? '#f8fafc' : (s.tint && s.tint !== 'transparent' ? '#111827' : 'inherit'));
  root.setProperty('--re-zoom', s.zoom || 1);
  root.setProperty('--re-link', s.profile === 'lowvision' ? 'underline' : 'inherit');
  root.setProperty('--re-outline', s.profile === 'lowvision' ? '3px solid #005fcc' : 'none');
  root.setProperty('--re-cursor', s.profile === 'lowvision' ? "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><path d=\"M0,0 L0,26 L7,20 L13,31 L17,29 L11,18 L20,18 Z\" fill=\"%23000\" stroke=\"%23fff\" stroke-width=\"2\"/></svg>') 0 0, auto" : 'auto');
  root.setProperty('--re-filter', s.profile === 'colorblind' ? ('url(#readease-cb)' + (s.contrast > 1 ? ` contrast(${s.contrast})` : '')) : (s.contrast && s.contrast !== 1 ? `contrast(${s.contrast})` : 'none'));
}

// Throttled observer to persist elements on single-page apps
let obsTimer = null;
new MutationObserver(() => {
  if (obsTimer || !activeSettings || activeSettings.profile === 'off') return;
  obsTimer = setTimeout(() => { obsTimer = null; applySettings(activeSettings); }, 250);
}).observe(document.documentElement, { childList: true, subtree: true });

// Read settings on load & listen for updates (no message passing)
chrome.storage.sync.get('settings', ({ settings }) => applySettings(settings));
chrome.storage.onChanged.addListener((c, a) => { if (a === 'sync' && c.settings) applySettings(c.settings.newValue); });
