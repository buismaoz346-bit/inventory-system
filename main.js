const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

let mainWindow;
let server;

function startServerAndApp() {
  const expressApp = express();
  
  // Serve the root directory
  expressApp.use(express.static(__dirname));
  
  // Listen on a random open port, or a fixed one. Let's use 8999
  server = expressApp.listen(8999, 'localhost', () => {
    console.log('Local server running on http://localhost:8999');
    
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      title: "ElectroParts IMS",
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      },
      icon: path.join(__dirname, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp')
    });

    // Load via HTTP to bypass Firebase file:// restrictions
    mainWindow.loadURL('http://localhost:8999/index.html');
  });
}

app.whenReady().then(() => {
  startServerAndApp();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) startServerAndApp();
  });
});

app.on('window-all-closed', function () {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});
