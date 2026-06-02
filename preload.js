const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  saveFile: (data, fileName) => ipcRenderer.invoke('save-file', { data, fileName }),
  readFile: (fileName) => ipcRenderer.invoke('read-file', { fileName }),
  platform: process.platform,
  version: process.versions.electron
});

console.log('✅ Go2-Payroll Preload Script Loaded');
