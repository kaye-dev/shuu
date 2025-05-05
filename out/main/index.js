"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const require$$0 = require("electron");
const path = require("path");
const fs = require("fs");
const require$$1 = require("util");
const child_process = require("child_process");
const pkg = require("electron-updater");
const electronLog = require("electron-log");
const url = require("url");
const electronSquirrelStartup = require("electron-squirrel-startup");
class MenuBuilder {
  mainWindow;
  constructor(mainWindow2) {
    this.mainWindow = mainWindow2;
  }
  buildMenu() {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true") {
      this.setupDevelopmentEnvironment();
    }
    const template = process.platform === "darwin" ? this.buildDarwinTemplate() : this.buildDefaultTemplate();
    const menu = require$$0.Menu.buildFromTemplate(template);
    require$$0.Menu.setApplicationMenu(menu);
    return menu;
  }
  setupDevelopmentEnvironment() {
    this.mainWindow.webContents.on("context-menu", (_, props) => {
      const { x, y } = props;
      require$$0.Menu.buildFromTemplate([
        {
          label: "Inspect element",
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          }
        }
      ]).popup({ window: this.mainWindow });
    });
  }
  buildDarwinTemplate() {
    const subMenuAbout = {
      label: "Electron",
      submenu: [
        {
          label: "About ElectronReact",
          selector: "orderFrontStandardAboutPanel:"
        },
        { type: "separator" },
        { label: "Services", submenu: [] },
        { type: "separator" },
        {
          label: "Hide ElectronReact",
          accelerator: "Command+H",
          selector: "hide:"
        },
        {
          label: "Hide Others",
          accelerator: "Command+Shift+H",
          selector: "hideOtherApplications:"
        },
        { label: "Show All", selector: "unhideAllApplications:" },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: () => {
            require$$0.app.quit();
          }
        }
      ]
    };
    const subMenuEdit = {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "Command+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+Command+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "Command+X", selector: "cut:" },
        { label: "Copy", accelerator: "Command+C", selector: "copy:" },
        { label: "Paste", accelerator: "Command+V", selector: "paste:" },
        {
          label: "Select All",
          accelerator: "Command+A",
          selector: "selectAll:"
        }
      ]
    };
    const subMenuViewDev = {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "Command+R",
          click: () => {
            this.mainWindow.webContents.reload();
          }
        },
        {
          label: "Toggle Full Screen",
          accelerator: "Ctrl+Command+F",
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        },
        {
          label: "Toggle Developer Tools",
          accelerator: "Alt+Command+I",
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    };
    const subMenuViewProd = {
      label: "View",
      submenu: [
        {
          label: "Toggle Full Screen",
          accelerator: "Ctrl+Command+F",
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        }
      ]
    };
    const subMenuWindow = {
      label: "Window",
      submenu: [
        {
          label: "Minimize",
          accelerator: "Command+M",
          selector: "performMiniaturize:"
        },
        { label: "Close", accelerator: "Command+W", selector: "performClose:" },
        { type: "separator" },
        { label: "Bring All to Front", selector: "arrangeInFront:" }
      ]
    };
    const subMenuHelp = {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click() {
            require$$0.shell.openExternal("https://electronjs.org");
          }
        },
        {
          label: "Documentation",
          click() {
            require$$0.shell.openExternal(
              "https://github.com/electron/electron/tree/main/docs#readme"
            );
          }
        },
        {
          label: "Community Discussions",
          click() {
            require$$0.shell.openExternal("https://www.electronjs.org/community");
          }
        },
        {
          label: "Search Issues",
          click() {
            require$$0.shell.openExternal("https://github.com/electron/electron/issues");
          }
        }
      ]
    };
    const subMenuView = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true" ? subMenuViewDev : subMenuViewProd;
    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }
  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: "&File",
        submenu: [
          {
            label: "&Open",
            accelerator: "Ctrl+O"
          },
          {
            label: "&Close",
            accelerator: "Ctrl+W",
            click: () => {
              this.mainWindow.close();
            }
          }
        ]
      },
      {
        label: "&View",
        submenu: process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true" ? [
          {
            label: "&Reload",
            accelerator: "Ctrl+R",
            click: () => {
              this.mainWindow.webContents.reload();
            }
          },
          {
            label: "Toggle &Full Screen",
            accelerator: "F11",
            click: () => {
              this.mainWindow.setFullScreen(
                !this.mainWindow.isFullScreen()
              );
            }
          },
          {
            label: "Toggle &Developer Tools",
            accelerator: "Alt+Ctrl+I",
            click: () => {
              this.mainWindow.webContents.toggleDevTools();
            }
          }
        ] : [
          {
            label: "Toggle &Full Screen",
            accelerator: "F11",
            click: () => {
              this.mainWindow.setFullScreen(
                !this.mainWindow.isFullScreen()
              );
            }
          }
        ]
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Learn More",
            click() {
              require$$0.shell.openExternal("https://electronjs.org");
            }
          },
          {
            label: "Documentation",
            click() {
              require$$0.shell.openExternal(
                "https://github.com/electron/electron/tree/main/docs#readme"
              );
            }
          },
          {
            label: "Community Discussions",
            click() {
              require$$0.shell.openExternal("https://www.electronjs.org/community");
            }
          },
          {
            label: "Search Issues",
            click() {
              require$$0.shell.openExternal("https://github.com/electron/electron/issues");
            }
          }
        ]
      }
    ];
    return templateDefault;
  }
}
function resolveHtmlPath(htmlFileName) {
  if (process.env.NODE_ENV === "development") {
    const port = process.env.ELECTRON_RENDERER_PORT || 5173;
    const url$1 = new url.URL(`http://localhost:${port}`);
    url$1.pathname = htmlFileName;
    return url$1.href;
  }
  return `file://${path.resolve(require$$0.app.getAppPath(), "dist/renderer/index.html")}`;
}
const { autoUpdater } = pkg;
const log = electronLog;
class AppUpdater {
  constructor() {
    log.transports.file.level = "info";
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}
let mainWindow = null;
require$$0.ipcMain.on("ipc-example", async (event, arg) => {
  const msgTemplate = (pingPong) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply("ipc-example", msgTemplate("pong"));
});
if (process.env.NODE_ENV === "production") {
  Promise.resolve().then(() => require("./source-map-support-sa1QsFNm.js")).then((n) => n.sourceMapSupport).then((sourceMapSupport) => {
    sourceMapSupport.install();
  }).catch((err) => {
    console.error("Source map support initialization failed:", err);
  });
}
const isDebug = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";
if (isDebug) {
  import("electron-debug").then((electronDebug) => {
    electronDebug.default();
  }).catch((err) => {
    console.error("Electron debug initialization failed:", err);
  });
}
const installExtensions = async () => {
  try {
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = await Promise.resolve().then(() => require("./index-BF3lRjns.js")).then((n) => n.index);
    const name = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`${name}をインストールしました`);
  } catch (err) {
    console.log("開発者拡張機能のインストールに失敗しました:", err);
  }
};
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }
  const RESOURCES_PATH = require$$0.app.isPackaged ? path.join(process.resourcesPath, "assets") : path.join(__dirname, "../../assets");
  const getAssetPath = (...paths) => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  mainWindow = new require$$0.BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath("icon.png"),
    // FYI: https://www.electronjs.org/ja/docs/latest/api/frameless-window
    titleBarStyle: "hidden",
    webPreferences: {
      preload: require$$0.app.isPackaged ? path.join(__dirname, "../preload/index.js") : path.join(__dirname, "../../.electron-vite/dist/preload/index.js"),
      // 開発環境用パスを修正
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
      // Explicitly enable sandbox mode
    }
  });
  mainWindow.loadURL(resolveHtmlPath("index.html"));
  mainWindow.on("ready-to-show", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.maximize();
      mainWindow.show();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    require$$0.shell.openExternal(edata.url);
    return { action: "deny" };
  });
  new AppUpdater();
};
require$$0.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    require$$0.app.quit();
  }
});
require$$0.ipcMain.handle("select-directory", async () => {
  try {
    if (!mainWindow) {
      throw new Error("メインウィンドウが存在しません");
    }
    const { canceled, filePaths } = await require$$0.dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"]
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    const dirPath = filePaths[0];
    if (!fs.existsSync(dirPath)) {
      throw new Error(`ディレクトリが存在しません: ${dirPath}`);
    }
    return getDirectoryStructure(dirPath);
  } catch (error) {
    console.error("ディレクトリ選択エラー:", error);
    throw error;
  }
});
require$$0.ipcMain.handle("open-directory", async (_, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`ディレクトリが存在しません: ${dirPath}`);
    }
    return getDirectoryStructure(dirPath);
  } catch (error) {
    console.error("ディレクトリ読み込みエラー:", error);
    throw error;
  }
});
require$$0.ipcMain.handle("get-directory-contents", async (_, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`ディレクトリが存在しません: ${dirPath}`);
    }
    return getDirectoryContents(dirPath);
  } catch (error) {
    console.error("ディレクトリ内容取得エラー:", error);
    throw error;
  }
});
function getDirectoryStructure(directoryPath) {
  const name = path.basename(directoryPath);
  return {
    path: directoryPath,
    name,
    type: "directory",
    children: getDirectoryContents(directoryPath)
  };
}
function getDirectoryContents(directoryPath) {
  try {
    const items = fs.readdirSync(directoryPath, { withFileTypes: true });
    return items.filter((item) => !item.name.startsWith(".")).map((item) => {
      const itemPath = path.join(directoryPath, item.name);
      const isDirectory = item.isDirectory();
      return {
        name: item.name,
        path: itemPath,
        type: isDirectory ? "directory" : "file",
        ...isDirectory ? { children: [] } : {}
      };
    }).sort((a, b) => {
      if (a.type === "directory" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`ディレクトリ内容取得エラー: ${directoryPath}`, error);
    return [];
  }
}
require$$0.ipcMain.handle("select-file", async () => {
  try {
    if (!mainWindow) {
      throw new Error("メインウィンドウが存在しません");
    }
    const { canceled, filePaths } = await require$$0.dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: "テキストファイル", extensions: ["txt", "md"] },
        { name: "All Files", extensions: ["*"] }
      ],
      properties: ["openFile"]
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    const filePath = filePaths[0];
    if (!fs.existsSync(filePath)) {
      throw new Error(`ファイルが存在しません: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);
    return { path: filePath, name: fileName, content };
  } catch (error) {
    console.error("ファイル選択エラー:", error);
    throw error;
  }
});
require$$0.ipcMain.handle("open-file", async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`ファイルが存在しません: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);
    return { path: filePath, name: fileName, content };
  } catch (error) {
    console.error("ファイル読み込みエラー:", error);
    throw error;
  }
});
require$$0.ipcMain.handle("save-file", async (_, options) => {
  try {
    const { defaultPath, content, overwrite = false } = options;
    if (!mainWindow) {
      throw new Error("メインウィンドウが存在しません");
    }
    let filePath = defaultPath;
    if (!overwrite || !fs.existsSync(defaultPath)) {
      const { canceled, filePath: selectedPath } = await require$$0.dialog.showSaveDialog(mainWindow, {
        defaultPath,
        filters: [
          { name: "Markdown", extensions: ["md"] },
          { name: "Text", extensions: ["txt"] },
          { name: "All Files", extensions: ["*"] }
        ],
        properties: ["createDirectory"]
      });
      if (canceled || !selectedPath) {
        return null;
      }
      filePath = selectedPath;
    }
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`ファイルを保存しました: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("ファイル保存エラー:", error);
    throw error;
  }
});
require$$0.ipcMain.handle("search-in-files", async (_, searchTerm, directoryPath) => {
  try {
    if (!mainWindow) {
      throw new Error("メインウィンドウが存在しません");
    }
    let searchDir = directoryPath;
    if (!searchDir) {
      const homeDir = require$$0.app.getPath("home");
      const { canceled, filePaths } = await require$$0.dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
        defaultPath: homeDir,
        title: "検索対象のディレクトリを選択"
      });
      if (canceled || filePaths.length === 0) {
        return [];
      }
      searchDir = filePaths[0];
    }
    const searchResults = [];
    const filePatterns = ["*.txt", "*.md", "*.js", "*.ts", "*.tsx", "*.jsx", "*.html", "*.css"];
    const files = await getAllFiles(searchDir, filePatterns);
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        const fileName = path.basename(filePath);
        const matches = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const columnStart = line.toLowerCase().indexOf(searchTerm.toLowerCase());
          if (columnStart !== -1) {
            matches.push({
              lineNumber: i + 1,
              // 1-indexed line numbers
              line,
              columnStart,
              columnEnd: columnStart + searchTerm.length
            });
          }
        }
        if (matches.length > 0) {
          searchResults.push({
            filePath,
            fileName,
            matches
          });
        }
      } catch (err) {
        console.error(`ファイル読み込みエラー: ${filePath}`, err);
      }
    }
    return searchResults;
  } catch (error) {
    console.error("検索エラー:", error);
    throw error;
  }
});
async function getAllFiles(dirPath, patterns) {
  try {
    const execAsync = require$$1.promisify(child_process.exec);
    let command;
    if (process.platform === "win32") {
      const patternString = patterns.map((p) => `"${p}"`).join(",");
      command = `powershell -Command "Get-ChildItem -Path '${dirPath}' -Recurse -File -Include ${patternString} | ForEach-Object { $_.FullName }"`;
    } else {
      const patternString = patterns.map((p) => `-name "${p}"`).join(" -o ");
      command = `find "${dirPath}" -type f \\( ${patternString} \\) -print`;
    }
    const { stdout } = await execAsync(command);
    return stdout.trim().split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    console.error("ファイル一覧取得エラー:", error);
    return [];
  }
}
require$$0.ipcMain.handle("create-file-system-item", async (_, options) => {
  try {
    const { parentPath, name, type } = options;
    if (!fs.existsSync(parentPath)) {
      throw new Error(`親ディレクトリが存在しません: ${parentPath}`);
    }
    const newPath = path.join(parentPath, name);
    if (fs.existsSync(newPath)) {
      throw new Error(`同名のファイル/フォルダが既に存在します: ${newPath}`);
    }
    if (type === "directory") {
      fs.mkdirSync(newPath, { recursive: true });
    } else {
      fs.writeFileSync(newPath, "", "utf-8");
    }
    return newPath;
  } catch (error) {
    console.error("ファイル/フォルダ作成エラー:", error);
    throw error;
  }
});
require$$0.ipcMain.handle("delete-file-system-item", async (_, options) => {
  try {
    const { path: itemPath, type } = options;
    if (!fs.existsSync(itemPath)) {
      throw new Error(`ファイル/フォルダが存在しません: ${itemPath}`);
    }
    if (type === "directory") {
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemPath);
    }
    return { success: true, path: itemPath };
  } catch (error) {
    console.error("ファイル/フォルダ削除エラー:", error);
    throw error;
  }
});
require$$0.app.whenReady().then(() => {
  createWindow();
  require$$0.app.on("activate", () => {
    if (mainWindow === null) createWindow();
  });
}).catch(console.log);
if (electronSquirrelStartup) {
  require$$0.app.quit();
}
