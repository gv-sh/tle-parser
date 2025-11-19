/**
 * Electron Preload Script
 * Exposes TLE API to renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tleAPI', {
  parseTLE: (line1, line2, line0) =>
    ipcRenderer.invoke('parse-tle', { line1, line2, line0 }),

  calculatePosition: (line1, line2, line0, date) =>
    ipcRenderer.invoke('calculate-position', { line1, line2, line0, date }),

  calculateVisibilityWindows: (line1, line2, line0, groundLocation, days) =>
    ipcRenderer.invoke('visibility-windows', { line1, line2, line0, groundLocation, days })
});
