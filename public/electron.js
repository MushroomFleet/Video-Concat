const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { join } = require('path');
const { ElectronVideoProcessor } = require('../dist-electron/main/videoProcessor');

// Keep a global reference of the window object
let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:8080';

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../dist-electron/preload/preload.js'),
      webSecurity: true
    },
    icon: join(__dirname, './favicon.ico')
  });

  // Load the app
  if (isDev && VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Initialize video processor
  new ElectronVideoProcessor();
  
  createWindow();

  app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== VITE_DEV_SERVER_URL && !isDev) {
      navigationEvent.preventDefault();
    }
  });
});

// IPC handlers for file dialogs
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'MP4 Video', extensions: ['mp4'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result;
});

// App info
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', () => {
  return process.platform;
});
