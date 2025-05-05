import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'save-file' | 'open-file' | 'select-file' | 'open-directory' | 'search-in-files';

interface SaveFileOptions {
  defaultPath: string;
  content: string;
  overwrite?: boolean;
}

export interface CreateFileSystemItemOptions {
  parentPath: string;
  name: string;
  type: 'file' | 'directory';
}

export interface DeleteFileSystemItemOptions {
  path: string;
  type: 'file' | 'directory';
}

// Define the handler object
const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  // ファイル保存APIを追加
  saveFile: (options: SaveFileOptions) => ipcRenderer.invoke('save-file', options),
  // ファイル選択ダイアログAPIを追加
  selectFile: () => ipcRenderer.invoke('select-file'),
  // ディレクトリ選択ダイアログAPIを追加
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  // ファイル読み込みAPIを追加（完全なファイルパスからファイル情報を取得）
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  // フォルダ読み込みAPIを追加（ディレクトリ構造を取得）
  openDirectory: (dirPath: string) => ipcRenderer.invoke('open-directory', dirPath),
  // 再帰的にフォルダ内のファイル・フォルダを取得
  getDirectoryContents: (dirPath: string) => ipcRenderer.invoke('get-directory-contents', dirPath),
  // ファイル内検索を実行
  searchInFiles: (searchTerm: string, directoryPath?: string) => ipcRenderer.invoke('search-in-files', searchTerm, directoryPath),
  // 新規ファイル/フォルダを作成
  createFileSystemItem: (options: CreateFileSystemItemOptions) => ipcRenderer.invoke('create-file-system-item', options),
  // ファイル/フォルダを削除
  deleteFileSystemItem: (options: DeleteFileSystemItemOptions) => ipcRenderer.invoke('delete-file-system-item', options),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronHandler);

// For TypeScript users, allow importing the type
export type ElectronHandler = typeof electronHandler;
