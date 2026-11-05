// ReadEase Popup Logic
const PRESETS = {
  dyslexia: { profile: 'dyslexia', fontFamily: 'Lexend, system-ui, sans-serif', letterSpacing: '0.12em', wordSpacing: '0.16em', lineHeight: '1.5', maxWidth: '65ch', tint: '#fbf5e6', ruler: true, zoom: 1, contrast: 1, cbType: 'protanopia', cbStrength: 0 },
  lowvision: { profile: 'lowvision', fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em', wordSpacing: '0.08em', lineHeight: '1.6', maxWidth: 'none', tint: '#ffffff', ruler: false, zoom: 1.25, contrast: 1.4, cbType: 'protanopia', cbStrength: 0 },
  colorblind: { profile: 'colorblind', fontFamily: 'system-ui, sans-serif', letterSpacing: '0em', wordSpacing: '0em', lineHeight: '1.5', maxWidth: 'none', tint: 'transparent', ruler: false, zoom: 1, contrast: 1, cbType: 'protanopia', cbStrength: 1.0 }
};

const DEFAULTS = { profile: 'off', fontFamily: 'system-ui, sans-serif', letterSpacing: '0em', wordSpacing: '0em', lineHeight: '1.5', maxWidth: 'none', tint: 'transparent', ruler: false, cbType: 'protanopia', cbStrength: 1.0, zoom: 1, contrast: 1, disabledHosts: [] };
let settings = { ...DEFAULTS }, currentHost = '';

const $ = id => document.getElementById(id);
const save = () => chrome.storage.sync.set({ settings, ...(settings.profile !== 'off' ? { lastProfile: settings.profile } : {}) });

function render() {
  ['dyslexia', 'lowvision', 'colorblind'].forEach(p => $('btn-' + p).setAttribute('aria-pressed', String(settings.profile === p)));
  $('cb-section').classList.toggle('hidden', settings.profile !== 'colorblind');
  $('cbType').value = settings.cbType || 'protanopia';
  $('cbStrength').value = settings.cbStrength ?? 1;
  $('cbStrength-val').textContent = Math.round((settings.cbStrength ?? 1) * 100) + '%';
  $('fontFamily').value = settings.fontFamily || 'system-ui, sans-serif';
  $('zoom').value = settings.zoom || 1;
  $('zoom-val').textContent = Number(settings.zoom || 1).toFixed(2) + 'x';
  $('lineHeight').value = settings.lineHeight || 1.5;
  $('lineHeight-val').textContent = settings.lineHeight || '1.5';
  $('letterSpacing').value = parseFloat(settings.letterSpacing) || 0;
  $('letterSpacing-val').textContent = settings.letterSpacing || '0em';
  $('wordSpacing').value = parseFloat(settings.wordSpacing) || 0;
  $('wordSpacing-val').textContent = settings.wordSpacing || '0em';
  const mw = parseInt(settings.maxWidth, 10) || 95;
  $('maxWidth').value = mw;
  $('maxWidth-val').textContent = mw >= 95 ? 'None' : mw + 'ch';
  $('contrast').value = settings.contrast || 1;
  $('contrast-val').textContent = Number(settings.contrast || 1).toFixed(1) + 'x';
  $('tint').value = settings.tint || 'transparent';
  $('ruler').checked = Boolean(settings.ruler);

  if (currentHost) {
    const isPaused = (settings.disabledHosts || []).includes(currentHost);
    $('btn-pause').setAttribute('aria-pressed', String(isPaused));
    $('btn-pause').textContent = isPaused ? 'Resume site' : 'Pause site';
  } else {
    $('btn-pause').disabled = true;
  }
}

// Profile button clicks
['dyslexia', 'lowvision', 'colorblind'].forEach(p => {
  $('btn-' + p).addEventListener('click', async () => {
    settings = { ...settings, ...(settings.profile === p ? { profile: 'off' } : PRESETS[p]) };
    render(); await save();
  });
});

// Slider and select bindings
const bind = (id, key, unit = '') => {
  $(id).addEventListener('input', async () => {
    settings[key] = unit ? `${$(id).value}${unit}` : Number($(id).value);
    render(); await save();
  });
};
bind('zoom', 'zoom'); bind('lineHeight', 'lineHeight'); bind('contrast', 'contrast'); bind('cbStrength', 'cbStrength');
bind('letterSpacing', 'letterSpacing', 'em'); bind('wordSpacing', 'wordSpacing', 'em');

$('maxWidth').addEventListener('input', async () => {
  const v = Number($('maxWidth').value);
  settings.maxWidth = v >= 95 ? 'none' : `${v}ch`;
  render(); await save();
});
['fontFamily', 'cbType', 'tint'].forEach(id => $(id).addEventListener('change', async () => { settings[id] = $(id).value; render(); await save(); }));
$('ruler').addEventListener('change', async () => { settings.ruler = $('ruler').checked; render(); await save(); });

// Pause site & Reset
$('btn-pause').addEventListener('click', async () => {
  if (!currentHost) return;
  const list = settings.disabledHosts || [];
  const idx = list.indexOf(currentHost);
  if (idx >= 0) list.splice(idx, 1); else list.push(currentHost);
  settings.disabledHosts = list;
  render(); await save();
});
$('btn-reset').addEventListener('click', async () => {
  settings = { ...settings, ...(PRESETS[settings.profile] || DEFAULTS) };
  render(); await save();
});

// Init
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url?.startsWith('http')) { try { currentHost = new URL(tab.url).hostname; } catch {} }
  const data = await chrome.storage.sync.get('settings');
  if (data?.settings) settings = { ...DEFAULTS, ...data.settings };
  render();
})();
