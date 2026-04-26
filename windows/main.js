const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const url = require('url');

// Custom protocol to serve the static files and handle react-router correctly
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
]);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // For bypassing standard CORS since it's a file:// protocol app connecting to absolute remote api
    },
    autoHideMenuBar: true, // Hides the default electron menu
  });

  // Load using custom protocol
  mainWindow.loadURL('app://-/index.html');
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    let requestUrl = request.url.slice('app://-/'.length);
    if (!requestUrl) requestUrl = 'index.html';
    
    // remove query parameters if any
    requestUrl = requestUrl.split('?')[0];

    // For react router, if the file doesn't exist, fallback to index.html
    const fs = require('fs');
    let filePath = path.join(__dirname, 'app', requestUrl);
    
    // If the path doesn't have an extension, it's likely a React Router navigation
    if (!fs.existsSync(filePath) || !path.extname(filePath)) {
      filePath = path.join(__dirname, 'app', 'index.html');
    }

    return net.fetch(url.pathToFileURL(filePath).toString());
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
