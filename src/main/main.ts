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

// ログレベルを設定
const log = electronLog;
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// ログファイルの場所をコンソールに出力（デバッグ用）
console.log('ログファイルの場所: ', log.transports.file.getFile().path);

class AppUpdater {
  constructor() {
    autoUpdater.logger = log;

    // 署名が無い場合でも自動更新をチェックできるようにする
    autoUpdater.forceDevUpdateConfig = true;

    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      log.error('自動更新チェック中にエラーが発生しました:', error);
    }
  }
}

// 起動時にロギングを行う
log.info('アプリケーション起動: ' + new Date().toLocaleString());

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
  try {
    if (isDebug) {
      await installExtensions();
    }

    // リソースパスの決定
    let RESOURCES_PATH = '';
    try {
      RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');

      // リソースパスが存在するか確認
      if (!fs.existsSync(RESOURCES_PATH)) {
        log.warn(`リソースパスが存在しません: ${RESOURCES_PATH}`);
        log.info('代替リソースパスを使用します');

        // 代替パスを試みる
        RESOURCES_PATH = app.isPackaged
          ? path.join(process.resourcesPath, 'app', 'assets')
          : path.join(__dirname, '../../assets');

        if (!fs.existsSync(RESOURCES_PATH)) {
          log.warn(`代替リソースパスも存在しません: ${RESOURCES_PATH}`);
        } else {
          log.info(`代替リソースパス: ${RESOURCES_PATH}`);
        }
      }
    } catch (error) {
      log.error('リソースパスの設定中にエラーが発生しました:', error);
    }

    const getAssetPath = (...paths: string[]): string => {
      return path.join(RESOURCES_PATH, ...paths);
    };

    // ブラウザウィンドウの作成
    mainWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
      icon: getAssetPath('icon.png'),
      // FYI: https://www.electronjs.org/ja/docs/latest/api/frameless-window
      titleBarStyle: 'hidden',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true // Explicitly enable sandbox mode
      }
    });

    // メインウィンドウにHTMLを読み込み
    try {
      // 通常のパスから読み込みを試みる
      const url = resolveHtmlPath('index.html');
      log.info(`初期HTML URL: ${url}`);
      log.info(`アプリパス: ${app.getAppPath()}`);
      log.info(`isPackaged: ${app.isPackaged}`);

      // いくつかの可能性のあるパスを確認
      log.info('可能なパスを確認中...');

      // パスパターンの配列
      const possiblePaths: string[] = [];
      const possibleUrls: string[] = [];

      if (app.isPackaged) {
        // 実行可能ファイルの場所を取得
        const exePath = process.execPath;
        log.info(`実行パス: ${exePath}`);
        log.info(`リソースパス: ${process.resourcesPath}`);

        // 本番環境のパスパターン
        // パターン1: app.asar内のrendererディレクトリ
        possiblePaths.push(path.join(app.getAppPath(), 'out/renderer', 'index.html'));

        // パターン2: app.asar隣接のrendererディレクトリ
        possiblePaths.push(path.join(path.dirname(app.getAppPath()), 'renderer', 'index.html'));

        // パターン3: Resourcesディレクトリ直下の renderer
        possiblePaths.push(path.join(process.resourcesPath, 'renderer', 'index.html'));

        // パターン4: Contentsディレクトリ直下の renderer
        possiblePaths.push(path.join(path.dirname(process.resourcesPath), 'renderer', 'index.html'));

        // パターン5: asarUnpack用のディレクトリ
        possiblePaths.push(path.join(app.getAppPath() + '.unpacked', 'out/renderer', 'index.html'));

        // パターン6: パッケージルート直下
        possiblePaths.push(path.join(path.dirname(path.dirname(process.resourcesPath)), 'renderer', 'index.html'));

        // パターン7: アプリケーションフォルダ内
        const appDir = path.dirname(path.dirname(path.dirname(process.resourcesPath)));
        possiblePaths.push(path.join(appDir, 'renderer', 'index.html'));

        // パターン8: out/renderer直下（相対パス）
        possiblePaths.push(path.join(process.resourcesPath, 'app', 'out', 'renderer', 'index.html'));
      } else {
        // 開発環境のパス
        possiblePaths.push(path.join(__dirname, '../../out/renderer', 'index.html'));
        possiblePaths.push(path.join(process.cwd(), 'out/renderer', 'index.html'));
      }

      // URLの作成
      possiblePaths.forEach(p => {
        possibleUrls.push(`file://${p}`);
      });

      // パスの存在確認（存在確認はasarでは正確でないかもしれないが、ログ用に記録）
      let foundValidPath = false;
      for (let i = 0; i < possiblePaths.length; i++) {
        const p = possiblePaths[i];
        const u = possibleUrls[i];
        try {
          const exists = fs.existsSync(p);
          log.info(`パスパターン${i+1}: ${p} - 存在: ${exists}`);

          if (exists) {
            log.info(`有効なパスを発見 #${i+1}: ${p}`);
            try {
              // 発見したパスからURLを読み込み
              await mainWindow.loadURL(u);
              log.info(`HTML読み込み成功: ${u}`);
              foundValidPath = true;
              break;
            } catch (loadError) {
              const err = loadError as Error;
              log.warn(`パターン${i+1}の読み込みに失敗: ${err.message}`);
            }
          }
        } catch (error) {
          const err = error as Error;
          log.warn(`パターン${i+1}の確認中にエラー: ${err.message}`);
        }
      }

      // 通常のURLローディングを試みる（まだ成功していない場合）
      if (!foundValidPath) {
        try {
          log.info(`標準パスで読み込み試行: ${url}`);
          await mainWindow.loadURL(url);
          log.info('標準パスでHTML読み込み成功');
        } catch (urlError) {
          throw urlError; // 次のcatchブロックで処理
        }
      }
    } catch (error) {
      log.error('HTMLロード中にエラーが発生しました:', error);

      // 最終的なフォールバック - 複数のディレクトリをさらに探索
      const fallbackPaths: string[] = [];

      // 1. まずResourcesディレクトリ内を確認
      if (app.isPackaged) {
        // Mac固有のパス
        if (process.platform === 'darwin') {
          // Contents/Resources内のrendererフォルダを確認
          fallbackPaths.push(path.join(process.resourcesPath, 'renderer', 'index.html'));

          // Contents/Resources/app/rendererを確認
          fallbackPaths.push(path.join(process.resourcesPath, 'app', 'renderer', 'index.html'));

          // Contents/Resources/app/out/rendererを確認
          fallbackPaths.push(path.join(process.resourcesPath, 'app', 'out', 'renderer', 'index.html'));

          // Contents直下
          fallbackPaths.push(path.join(path.dirname(process.resourcesPath), 'renderer', 'index.html'));

          // app.asar.unpackedを確認
          const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked');
          fallbackPaths.push(path.join(unpackedPath, 'out', 'renderer', 'index.html'));
          fallbackPaths.push(path.join(unpackedPath, 'renderer', 'index.html'));
        } else {
          // Windows/Linux用の追加パス
          fallbackPaths.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'renderer', 'index.html'));
          fallbackPaths.push(path.join(path.dirname(process.execPath), 'renderer', 'index.html'));
        }
      }

      // フォールバックパスを試行
      let fallbackSuccess = false;
      for (let i = 0; i < fallbackPaths.length; i++) {
        const fbPath = fallbackPaths[i];
        const fbUrl = `file://${fbPath}`;

        try {
          const exists = fs.existsSync(fbPath);
          log.info(`フォールバック#${i+1}: ${fbPath} - 存在: ${exists}`);

          if (exists) {
            try {
              await mainWindow.loadURL(fbUrl);
              log.info(`フォールバック#${i+1}で成功: ${fbUrl}`);
              fallbackSuccess = true;
              break;
            } catch (fbError) {
              const err = fbError as Error;
              log.warn(`フォールバック#${i+1}の読み込みに失敗: ${err.message}`);
            }
          }
        } catch (error) {
          const err = error as Error;
          log.warn(`フォールバック#${i+1}の確認中にエラー: ${err.message}`);
        }
      }

      if (!fallbackSuccess) {
        log.error('すべてのパスの試行に失敗しました');

        // それでも失敗した場合、エラーメッセージを表示
        const errorMessage = `
          <html>
            <head>
              <title>エラー</title>
              <style>
                body { font-family: sans-serif; padding: 2rem; background-color: #f5f5f5; color: #333; }
                h1 { color: #e63946; }
                pre { background-color: #eee; padding: 1rem; overflow: auto; }
              </style>
            </head>
            <body>
              <h1>アプリケーションの読み込みに失敗しました</h1>
              <p>以下のエラーが発生しました:</p>
              <pre>${String(error)}</pre>
              <p>ログファイル: ${log.transports.file.getFile().path}</p>
            </body>
          </html>
        `;

        mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorMessage)}`);
      }
    }

    mainWindow.on('ready-to-show', () => {
      if (!mainWindow) {
        log.error('"mainWindow" is not defined');
        return;
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

    try {
      const menuBuilder = new MenuBuilder(mainWindow);
      menuBuilder.buildMenu();
    } catch (error) {
      log.error('メニュー構築中にエラーが発生しました:', error);
    }

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
      shell.openExternal(edata.url);
      return { action: 'deny' };
    });

    // アプリケーションの自動更新
    try {
      new AppUpdater();
    } catch (error) {
      log.error('自動更新の初期化中にエラーが発生しました:', error);
    }

    // DevToolsを開く（デバッグモード時のみ）
    if (isDebug || process.env.DEBUG_PROD === 'true') {
      log.info('デバッグモードが有効：DevToolsを開きます');
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    log.error('createWindow関数でエラーが発生しました:', error);
    throw error; // 上位のエラーハンドラに委譲
  }
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
