import { Menu, shell, app, ipcMain, dialog, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import electronUpdater from "electron-updater";
import electronLog from "electron-log";
import { URL } from "url";
import electronSquirrelStartup from "electron-squirrel-startup";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
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
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    return menu;
  }
  setupDevelopmentEnvironment() {
    this.mainWindow.webContents.on("context-menu", (_, props) => {
      const { x, y } = props;
      Menu.buildFromTemplate([
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
            app.quit();
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
            shell.openExternal("https://electronjs.org");
          }
        },
        {
          label: "Documentation",
          click() {
            shell.openExternal(
              "https://github.com/electron/electron/tree/main/docs#readme"
            );
          }
        },
        {
          label: "Community Discussions",
          click() {
            shell.openExternal("https://www.electronjs.org/community");
          }
        },
        {
          label: "Search Issues",
          click() {
            shell.openExternal("https://github.com/electron/electron/issues");
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
              shell.openExternal("https://electronjs.org");
            }
          },
          {
            label: "Documentation",
            click() {
              shell.openExternal(
                "https://github.com/electron/electron/tree/main/docs#readme"
              );
            }
          },
          {
            label: "Community Discussions",
            click() {
              shell.openExternal("https://www.electronjs.org/community");
            }
          },
          {
            label: "Search Issues",
            click() {
              shell.openExternal("https://github.com/electron/electron/issues");
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
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(app.getAppPath(), "dist/renderer/index.html")}`;
}
const { autoUpdater } = electronUpdater;
const log = electronLog;
class AppUpdater {
  constructor() {
    log.transports.file.level = "info";
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}
let mainWindow = null;
ipcMain.on("ipc-example", async (event, arg) => {
  const msgTemplate = (pingPong) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply("ipc-example", msgTemplate("pong"));
});
if (process.env.NODE_ENV === "production") {
  import("./source-map-support-Y74iNDS0.js").then((n) => n.s).then(({ default: sourceMapSupport }) => {
    sourceMapSupport.install();
  });
}
const isDebug = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";
if (isDebug) {
  import("electron-debug").then(({ default: electronDebug }) => {
    electronDebug();
  });
}
const installExtensions = async () => {
  try {
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import("./index-Bvwf_vkq.js").then((n) => n.i);
    await installExtension(REACT_DEVELOPER_TOOLS);
    console.log("React Devtoolsをインストールしました");
  } catch (err) {
    console.log("開発者拡張機能のインストールに失敗しました:", err);
  }
};
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }
  const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, "assets") : path.join(__dirname, "../../assets");
  const getAssetPath = (...paths) => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath("icon.png"),
    // FYI: https://www.electronjs.org/ja/docs/latest/api/frameless-window
    titleBarStyle: "hidden"
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
    shell.openExternal(edata.url);
    return { action: "deny" };
  });
  new AppUpdater();
};
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
ipcMain.handle("select-directory", async () => {
  try {
    if (!mainWindow) {
      throw new Error("メインウィンドウが存在しません");
    }
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
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
ipcMain.handle("open-directory", async (_, dirPath) => {
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
ipcMain.handle("get-directory-contents", async (_, dirPath) => {
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
ipcMain.handle("select-file", async () => {
  try {
    if (!mainWindow) {
      throw new Error("メインウィンドウが存在しません");
    }
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
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
ipcMain.handle("open-file", async (_, filePath) => {
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
ipcMain.handle("save-file", async (_, options) => {
  try {
    const { defaultPath, content, overwrite = false } = options;
    if (!mainWindow) {
      throw new Error("メインウィンドウが存在しません");
    }
    let filePath = defaultPath;
    if (!overwrite || !fs.existsSync(defaultPath)) {
      const { canceled, filePath: selectedPath } = await dialog.showSaveDialog(mainWindow, {
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
ipcMain.handle("search-in-files", async (_, searchTerm, directoryPath) => {
  try {
    if (!mainWindow) {
      throw new Error("メインウィンドウが存在しません");
    }
    let searchDir = directoryPath;
    if (!searchDir) {
      const homeDir = app.getPath("home");
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
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
    const execAsync = promisify(exec);
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
ipcMain.handle("create-file-system-item", async (_, options) => {
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
ipcMain.handle("delete-file-system-item", async (_, options) => {
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
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (mainWindow === null) createWindow();
  });
}).catch(console.log);
if (electronSquirrelStartup) {
  app.quit();
}
