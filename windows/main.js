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

    const ext = path.extname(filePath);
    let mimeType = 'text/plain; charset=utf-8';
    if (ext === '.html') mimeType = 'text/html; charset=utf-8';
    else if (ext === '.js' || ext === '.mjs') mimeType = 'application/javascript; charset=utf-8';
    else if (ext === '.css') mimeType = 'text/css; charset=utf-8';
    else if (ext === '.json') mimeType = 'application/json; charset=utf-8';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.woff2') mimeType = 'font/woff2';
    else if (ext === '.woff') mimeType = 'font/woff';

    try {
      const data = fs.readFileSync(filePath);
      return new Response(data, {
        headers: { 'Content-Type': mimeType }
      });
    } catch (err) {
      return new Response('Not Found', { status: 404 });
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
