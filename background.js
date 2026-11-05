// ReadEase Service Worker (MV3)
const PRESETS = {
  dyslexia: { fontFamily: 'Lexend, system-ui, sans-serif', letterSpacing: '0.12em', wordSpacing: '0.16em', lineHeight: '1.5', maxWidth: '65ch', tint: '#fbf5e6', ruler: true, zoom: 1, contrast: 1 },
  lowvision: { fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em', wordSpacing: '0.08em', lineHeight: '1.6', maxWidth: 'none', tint: '#ffffff', ruler: false, zoom: 1.25, contrast: 1.4 },
  colorblind: { cbType: 'protanopia', cbStrength: 1.0, fontFamily: 'system-ui, sans-serif', letterSpacing: '0em', wordSpacing: '0em', lineHeight: '1.5', maxWidth: 'none', tint: 'transparent', ruler: false, zoom: 1, contrast: 1 }
};
const BADGES = { dyslexia: 'DYS', lowvision: 'LV', colorblind: 'CB' };

async function updateBadge(profile) {
  const text = (!profile || profile === 'off') ? '' : (BADGES[profile] || 'ON');
  await chrome.action.setBadgeText({ text });
  if (text) await chrome.action.setBadgeBackgroundColor({ color: '#1d4ed8' });
}

chrome.storage.onChanged.addListener((c, a) => { if (a === 'sync' && c.settings) updateBadge(c.settings.newValue?.profile); });
chrome.runtime.onInstalled.addListener(async () => { const { settings } = await chrome.storage.sync.get('settings'); updateBadge(settings?.profile); });

// Alt+Shift+D shortcut: toggle 'off' <-> lastProfile
chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== 'toggle-profile') return;
  const { settings = {}, lastProfile = 'dyslexia' } = await chrome.storage.sync.get(['settings', 'lastProfile']);
  const active = settings.profile && settings.profile !== 'off';
  if (active) {
    await chrome.storage.sync.set({ lastProfile: settings.profile, settings: { ...settings, profile: 'off' } });
  } else {
    const target = lastProfile in PRESETS ? lastProfile : 'dyslexia';
    await chrome.storage.sync.set({ lastProfile: target, settings: { ...settings, ...PRESETS[target], profile: target } });
  }
});
