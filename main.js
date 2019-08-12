'use strict'

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const pathFn = require('path');
const urlFn = require('url');
const defaultGateway = require('default-gateway');
const address = require('address');
const libServe = require('./lib/serve');
const libStart = require('./lib/start');
// const log = require('electron-log');
const isDevelopment = process.env.NODE_ENV !== 'production'

Menu.setApplicationMenu(null)
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ 
    width: 800, 
    height: 600, 
    webPreferences: {
      nodeIntegration: true
    }
  });

  const settings = pathFn.resolve(app.getPath('userData'), 'settings.json');
  
  if (process.env.NODE_ENV === 'development') {
    libServe({ settings, isElectron: true });
    win.loadURL('http://localhost:8082/');
    win.webContents.openDevTools();
  } else {
    const server = libStart({ settings, isElectron: true })  
    // when server inited
    const { port } = server.options;
    const appUrl = urlFn.format({
      pathname: pathFn.join(__dirname, 'electron_dist/index.html'),
      protocol: 'file:',
      slashes: true
    });

    win.loadURL(`${appUrl}?port=${port}`);
    //win.webContents.openDevTools();
  }

  win.on('closed', () => win = null)
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
})

//listen to an open-file-dialog command and sending back selected information
ipcMain.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openDirectory'] // only allow select dir
  }, function (dir) {
    if (dir) event.sender.send('selected-file', dir)
  })
});

ipcMain.on('win-load', function(event) {
  const result = defaultGateway.v4.sync();
  const host = address.ip(result && result.interface);
  event.sender.send('app-config', { host })
});



// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
