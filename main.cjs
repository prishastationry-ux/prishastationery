const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const iconPath = fs.existsSync(path.join(__dirname, 'public', 'pwa-512x512.png'))
    ? path.join(__dirname, 'public', 'pwa-512x512.png')
    : path.join(__dirname, 'dist', 'pwa-512x512.png');

  const win = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    title: "PRISHA STATIONERY & ONLINE SERVICES",
    autoHideMenuBar: true,
    icon: iconPath
  });

  const liveUrl = 'https://prishastationery.vercel.app';
  const indexPath = path.join(__dirname, 'dist', 'index.html');

  // Load local dist/index.html immediately for 0-second offline launch, or fallback to live site
  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath).catch(() => {
      win.loadURL(liveUrl).catch(e => console.error("URL Load Error:", e));
    });
  } else {
    win.loadURL(liveUrl).catch(e => console.error("URL Load Error:", e));
  }

  // Open external links (e.g. UPI payment, WhatsApp, maps) in default browser
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
