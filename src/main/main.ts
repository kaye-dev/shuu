/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 */
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { promisify } from 'util';
import { exec } from 'child_process';
// Use the default import directly to avoid potential issues with CommonJS/ESM interop
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import electronLog from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const log = electronLog;

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// Source map support for production
if (process.env.NODE_ENV === 'production') {
  import('source-map-support')
    .then((sourceMapSupport) => {
      sourceMapSupport.install();
    })
    .catch(err => {
      console.error('Source map support initialization failed:', err);
    });
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  import('electron-debug')
    .then((electronDebug) => {
      electronDebug.default();
    })
    .catch(err => {
      console.error('Electron debug initialization failed:', err);
    });
}

const installExtensions = async () => {
  try {
    const { default: installExtension, REACT_DEVELOPER_TOOLS } =
      await import('electron-devtools-installer');

    // Install React DevTools
    const name = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`${name}をインストールしました`);
  } catch (err) {
    console.log('開発者拡張機能のインストールに失敗しました:', err);
  }
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    // FYI: https://www.electronjs.org/ja/docs/latest/api/frameless-window
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, '../preload/index.js') // 本番環境用
        : path.join(__dirname, '../../.electron-vite/dist/preload/index.js'), // 開発環境用パスを修正
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true // Explicitly enable sandbox mode
    }
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.maximize(); // ウィンドウを最大化
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ディレクトリ選択ダイアログを表示するハンドラ
ipcMain.handle('select-directory', async () => {
  try {
    if (!mainWindow) {
      throw new Error('メインウィンドウが存在しません');
    }

    // ディレクトリ選択ダイアログを表示
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    const dirPath = filePaths[0];
    if (!fs.existsSync(dirPath)) {
      throw new Error(`ディレクトリが存在しません: ${dirPath}`);
    }

    // ディレクトリの内容を取得
    return getDirectoryStructure(dirPath);
  } catch (error) {
    console.error('ディレクトリ選択エラー:', error);
    throw error;
  }
});

// ディレクトリ内容を取得するハンドラ
ipcMain.handle('open-directory', async (_, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`ディレクトリが存在しません: ${dirPath}`);
    }

    return getDirectoryStructure(dirPath);
  } catch (error) {
    console.error('ディレクトリ読み込みエラー:', error);
    throw error;
  }
});

// ディレクトリ内の階層構造を取得するハンドラ
ipcMain.handle('get-directory-contents', async (_, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`ディレクトリが存在しません: ${dirPath}`);
    }

    return getDirectoryContents(dirPath);
  } catch (error) {
    console.error('ディレクトリ内容取得エラー:', error);
    throw error;
  }
});

// ディレクトリ構造をオブジェクトとして取得する関数
function getDirectoryStructure(directoryPath: string) {
  const name = path.basename(directoryPath);

  return {
    path: directoryPath,
    name,
    type: 'directory' as const,
    children: getDirectoryContents(directoryPath)
  };
}

// ディレクトリ内のファイル・フォルダを取得する関数
function getDirectoryContents(directoryPath: string) {
  try {
    const items = fs.readdirSync(directoryPath, { withFileTypes: true });

    return items
      .filter(item => !item.name.startsWith('.')) // 隠しファイルを除外
      .map(item => {
        const itemPath = path.join(directoryPath, item.name);
        const isDirectory = item.isDirectory();

        return {
          name: item.name,
          path: itemPath,
          type: isDirectory ? 'directory' : 'file',
          ...(isDirectory
            ? { children: [] } // 子ディレクトリの内容は初期状態では空配列（展開時に読み込む）
            : {})
        };
      })
      .sort((a, b) => {
        // ディレクトリを先に、ファイルを後に表示
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        // 同じタイプ同士はアルファベット順
        return a.name.localeCompare(b.name);
      });
  } catch (error) {
    console.error(`ディレクトリ内容取得エラー: ${directoryPath}`, error);
    return [];
  }
}

// ファイル選択ダイアログを表示するハンドラ
ipcMain.handle('select-file', async () => {
  try {
    if (!mainWindow) {
      throw new Error('メインウィンドウが存在しません');
    }

    // ファイル選択ダイアログを表示
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      filters: [
        { name: 'テキストファイル', extensions: ['txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    const filePath = filePaths[0];
    if (!fs.existsSync(filePath)) {
      throw new Error(`ファイルが存在しません: ${filePath}`);
    }

    // ファイルの内容を読み込む
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    return { path: filePath, name: fileName, content };
  } catch (error) {
    console.error('ファイル選択エラー:', error);
    throw error;
  }
});

// ファイル読み込みハンドラ
ipcMain.handle('open-file', async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`ファイルが存在しません: ${filePath}`);
    }

    // ファイルの内容を読み込む
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    return { path: filePath, name: fileName, content };
  } catch (error) {
    console.error('ファイル読み込みエラー:', error);
    throw error;
  }
});

// ファイル保存ハンドラ
ipcMain.handle('save-file', async (_, options: { defaultPath: string; content: string; overwrite?: boolean }) => {
  try {
    const { defaultPath, content, overwrite = false } = options;

    if (!mainWindow) {
      throw new Error('メインウィンドウが存在しません');
    }

    let filePath = defaultPath;

    // 上書きモードでなければ、またはパスが存在しなければダイアログを表示
    if (!overwrite || !fs.existsSync(defaultPath)) {
      // ダイアログを表示してファイルパスを取得
      const { canceled, filePath: selectedPath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath,
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'Text', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['createDirectory']
      });

      // キャンセルされた場合
      if (canceled || !selectedPath) {
        return null;
      }

      filePath = selectedPath;
    }

    // ファイルに保存
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`ファイルを保存しました: ${filePath}`);

    // 保存したファイルパスを返す
    return filePath;
  } catch (error) {
    console.error('ファイル保存エラー:', error);
    throw error;
  }
});

// 検索結果の型定義
interface SearchMatch {
  lineNumber: number;
  line: string;
  columnStart: number;
  columnEnd: number;
}

interface SearchFileResult {
  filePath: string;
  fileName: string;
  matches: SearchMatch[];
}

// ファイル内検索を行うハンドラ
ipcMain.handle('search-in-files', async (_, searchTerm, directoryPath) => {
  try {
    if (!mainWindow) {
      throw new Error('メインウィンドウが存在しません');
    }

    // 検索対象のディレクトリ
    let searchDir = directoryPath;

    // ディレクトリパスが指定されていない場合
    if (!searchDir) {
      // 現在開いているディレクトリパスを取得（ここでは仮にユーザーのホームディレクトリを使用）
      const homeDir = app.getPath('home');

      // 検索対象のディレクトリを選択するダイアログを表示
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        defaultPath: homeDir,
        title: '検索対象のディレクトリを選択'
      });

      if (canceled || filePaths.length === 0) {
        return [] as SearchFileResult[];
      }

      searchDir = filePaths[0];
    }

    // 検索結果を格納する配列
    const searchResults: SearchFileResult[] = [];

    // 検索対象のファイルパターン
    const filePatterns = ['*.txt', '*.md', '*.js', '*.ts', '*.tsx', '*.jsx', '*.html', '*.css'];

    // ファイル一覧を取得して、各ファイルで検索を実行
    const files = await getAllFiles(searchDir, filePatterns);

    for (const filePath of files) {
      try {
        // ファイルの内容を読み込む
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const fileName = path.basename(filePath);

        // 検索ワードにマッチする行を探す
        const matches: SearchMatch[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const columnStart = line.toLowerCase().indexOf(searchTerm.toLowerCase());

          if (columnStart !== -1) {
            matches.push({
              lineNumber: i + 1, // 1-indexed line numbers
              line,
              columnStart,
              columnEnd: columnStart + searchTerm.length
            });
          }
        }

        // マッチがあればファイル情報と一緒に結果に追加
        if (matches.length > 0) {
          searchResults.push({
            filePath,
            fileName,
            matches
          });
        }
      } catch (err) {
        console.error(`ファイル読み込みエラー: ${filePath}`, err);
        // エラーがあっても他のファイルの検索は継続
      }
    }

    return searchResults;
  } catch (error) {
    console.error('検索エラー:', error);
    throw error;
  }
});

// 指定ディレクトリ内のすべてのファイルを取得する関数
async function getAllFiles(dirPath: string, patterns: string[]): Promise<string[]> {
  try {
    const execAsync = promisify(exec);

    // 検索パターンを作成（Windowsとそれ以外で異なるコマンドを使用）
    let command;
    if (process.platform === 'win32') {
      // Windowsの場合はPowerShellを使用
      const patternString = patterns.map(p => `"${p}"`).join(',');
      command = `powershell -Command "Get-ChildItem -Path '${dirPath}' -Recurse -File -Include ${patternString} | ForEach-Object { $_.FullName }"`;
    } else {
      // macOSやLinuxの場合はfindとgrepを使用
      const patternString = patterns.map(p => `-name "${p}"`).join(' -o ');
      command = `find "${dirPath}" -type f \\( ${patternString} \\) -print`;
    }

    const { stdout } = await execAsync(command);

    // 各行がファイルパス
    return stdout.trim().split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    return [];
  }
}

// 新規ファイル・フォルダを作成するハンドラ
ipcMain.handle('create-file-system-item', async (_, options: { parentPath: string; name: string; type: 'file' | 'directory' }) => {
  try {
    const { parentPath, name, type } = options;

    if (!fs.existsSync(parentPath)) {
      throw new Error(`親ディレクトリが存在しません: ${parentPath}`);
    }

    const newPath = path.join(parentPath, name);

    // すでに存在する場合はエラー
    if (fs.existsSync(newPath)) {
      throw new Error(`同名のファイル/フォルダが既に存在します: ${newPath}`);
    }

    if (type === 'directory') {
      // ディレクトリの場合は再帰的に作成
      fs.mkdirSync(newPath, { recursive: true });
    } else {
      // ファイルの場合は空ファイルを作成
      fs.writeFileSync(newPath, '', 'utf-8');
    }

    return newPath;
  } catch (error) {
    console.error('ファイル/フォルダ作成エラー:', error);
    throw error;
  }
});

// ファイル/フォルダを削除するハンドラ
ipcMain.handle('delete-file-system-item', async (_, options: { path: string; type: 'file' | 'directory' }) => {
  try {
    const { path: itemPath, type } = options;

    if (!fs.existsSync(itemPath)) {
      throw new Error(`ファイル/フォルダが存在しません: ${itemPath}`);
    }

    // 削除実行
    if (type === 'directory') {
      // ディレクトリの場合は再帰的に削除
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      // ファイルの場合は単純に削除
      fs.unlinkSync(itemPath);
    }

    return { success: true, path: itemPath };
  } catch (error) {
    console.error('ファイル/フォルダ削除エラー:', error);
    throw error;
  }
});

// アプリケーションの起動処理
app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
