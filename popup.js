const settings = {};

chrome.storage.sync.get('settings', (data) => {
  Object.assign(settings, data.settings);
  if (typeof settings.autoRefresh === 'undefined') {
    settings.autoRefresh = true;
  }
  updateSettings();
});

document.getElementById('refreshButton').onclick = () => {
  settings.autoRefresh = !settings.autoRefresh;
  updateSettings();
}

const updateSettings = () => {
  document.getElementById('status').innerHTML = settings.autoRefresh;
  chrome.storage.sync.set({ settings });
}