/**
 * Electron Main Process
 * Demonstrates IPC communication for TLE operations
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { parseTLE, calculatePosition, calculateVisibilityWindow } = require('tle-parser');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

// TLE Parsing IPC Handler
ipcMain.handle('parse-tle', async (event, { line1, line2, line0 }) => {
  try {
    const tle = parseTLE(line1, line2, line0);
    return { success: true, data: tle };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Calculate Position IPC Handler
ipcMain.handle('calculate-position', async (event, { line1, line2, line0, date }) => {
  try {
    const tle = parseTLE(line1, line2, line0);
    const position = calculatePosition(tle, date ? new Date(date) : new Date());
    return { success: true, data: position };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Visibility Windows IPC Handler
ipcMain.handle('visibility-windows', async (event, { line1, line2, line0, groundLocation, days }) => {
  try {
    const tle = parseTLE(line1, line2, line0);
    const windows = calculateVisibilityWindow(tle, groundLocation, new Date(), days || 7);
    return { success: true, data: windows };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
