import { contextBridge, ipcRenderer } from "electron";
const electronHandler = {
  ipcRenderer: {
    sendMessage(channel, ...args) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel, func) {
      const subscription = (_event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel, func) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    }
  },
  // ファイル保存APIを追加
  saveFile: (options) => ipcRenderer.invoke("save-file", options),
  // ファイル選択ダイアログAPIを追加
  selectFile: () => ipcRenderer.invoke("select-file"),
  // ディレクトリ選択ダイアログAPIを追加
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  // ファイル読み込みAPIを追加（完全なファイルパスからファイル情報を取得）
  openFile: (filePath) => ipcRenderer.invoke("open-file", filePath),
  // フォルダ読み込みAPIを追加（ディレクトリ構造を取得）
  openDirectory: (dirPath) => ipcRenderer.invoke("open-directory", dirPath),
  // 再帰的にフォルダ内のファイル・フォルダを取得
  getDirectoryContents: (dirPath) => ipcRenderer.invoke("get-directory-contents", dirPath),
  // ファイル内検索を実行
  searchInFiles: (searchTerm, directoryPath) => ipcRenderer.invoke("search-in-files", searchTerm, directoryPath),
  // 新規ファイル/フォルダを作成
  createFileSystemItem: (options) => ipcRenderer.invoke("create-file-system-item", options),
  // ファイル/フォルダを削除
  deleteFileSystemItem: (options) => ipcRenderer.invoke("delete-file-system-item", options)
};
contextBridge.exposeInMainWorld("electron", electronHandler);
