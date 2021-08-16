const settings = {};

chrome.storage.sync.get('settings', (data) => {
  Object.assign(settings, data.settings);
  if (typeof settings.autoRefresh === 'undefined') {
    settings.autoRefresh = true;
  }
  document.getElementById('refreshButton').checked = settings.autoRefresh;
  chrome.storage.sync.set({ settings });
});

document.getElementById('refreshButton').addEventListener('change', function () {
  settings.autoRefresh = this.checked;
  chrome.storage.sync.set({ settings });
})