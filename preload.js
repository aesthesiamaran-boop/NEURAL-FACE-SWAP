const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  pick: (title) => ipcRenderer.invoke('pick-image', title),
  swap: (o) => ipcRenderer.invoke('swap', o),
  save: () => ipcRenderer.invoke('save-png'),
  onProgress: (cb) => ipcRenderer.on('progress', (_e, m) => cb(m))
});
