"use strict";
const electron = require("electron");
const electronHandler = {
  ipcRenderer: {
    sendMessage(channel, ...args) {
      electron.ipcRenderer.send(channel, ...args);
    },
    on(channel, func) {
      const subscription = (_event, ...args) => func(...args);
      electron.ipcRenderer.on(channel, subscription);
      return () => {
        electron.ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel, func) {
      electron.ipcRenderer.once(channel, (_event, ...args) => func(...args));
    }
  },
  // ファイル保存APIを追加
  saveFile: (options) => electron.ipcRenderer.invoke("save-file", options),
  // ファイル選択ダイアログAPIを追加
  selectFile: () => electron.ipcRenderer.invoke("select-file"),
  // ディレクトリ選択ダイアログAPIを追加
  selectDirectory: () => electron.ipcRenderer.invoke("select-directory"),
  // ファイル読み込みAPIを追加（完全なファイルパスからファイル情報を取得）
  openFile: (filePath) => electron.ipcRenderer.invoke("open-file", filePath),
  // フォルダ読み込みAPIを追加（ディレクトリ構造を取得）
  openDirectory: (dirPath) => electron.ipcRenderer.invoke("open-directory", dirPath),
  // 再帰的にフォルダ内のファイル・フォルダを取得
  getDirectoryContents: (dirPath) => electron.ipcRenderer.invoke("get-directory-contents", dirPath),
  // ファイル内検索を実行
  searchInFiles: (searchTerm, directoryPath) => electron.ipcRenderer.invoke("search-in-files", searchTerm, directoryPath),
  // 新規ファイル/フォルダを作成
  createFileSystemItem: (options) => electron.ipcRenderer.invoke("create-file-system-item", options),
  // ファイル/フォルダを削除
  deleteFileSystemItem: (options) => electron.ipcRenderer.invoke("delete-file-system-item", options)
};
electron.contextBridge.exposeInMainWorld("electron", electronHandler);
