const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    title: "PRISHA STATIONERY & ONLINE SERVICES",
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'dist', 'pwa-512x512.png')
  });

  // Load the built Vite production index.html file
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath).catch(err => {
    console.error("Error loading application entry file:", err);
  });

  // Open external links (e.g. UPI, maps) in default browser instead of electron window
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
