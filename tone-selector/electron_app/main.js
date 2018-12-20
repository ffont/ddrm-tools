// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu} = require('electron')
var path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1016, 
    height: 690,
    backgroundColor: '#fff',
    icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
    title: 'DDRM CS80 Tone Selector',
    webPreferences: {
      webSecurity: false
    },
  })

  mainWindow.setResizable(false);

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  mainWindow.on("page-title-updated", function(event) {
      // Don't update apps title with with pages <title> tag
      event.preventDefault()
  });

  // open target="_blank" links in browser
  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  // Define contents of the menu (needed to enable copy & paste!)

  var template = [{
      label: "Application",
      submenu: [
          //{ label: "About Application", selector: "orderFrontStandardAboutPanel:" },
          //{ type: "separator" },
          { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]}/*, {
      label: "Edit",
      submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
          { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          //{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]}*/
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

