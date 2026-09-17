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

  // Load live Cloud Run app URL for real-time live updates, with fallback to local dist/index.html
  const liveUrl = 'https://ais-dev-zd76yrx4uq4bnlzknpbhh5-583891191614.asia-southeast1.run.app';
  const indexPath = path.join(__dirname, 'dist', 'index.html');

  win.loadURL(liveUrl).catch(() => {
    console.log("Offline detected, loading local fallback...");
    win.loadFile(indexPath).catch(err => {
      console.error("Error loading application entry file:", err);
    });
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
