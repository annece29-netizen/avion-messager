// Pont sécurisé entre la fenêtre de réglages et l'application :
// la page web n'a accès qu'à ces trois actions, rien d'autre.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('avion', {
  saveUrl: (url) => ipcRenderer.invoke('save-ics-url', url),
  openCalendar: () => ipcRenderer.invoke('open-google-calendar'),
  openOutlook: () => ipcRenderer.invoke('open-outlook-calendar'),
  testFlight: () => ipcRenderer.invoke('test-flight'),
});
