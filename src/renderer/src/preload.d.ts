interface ElectronHandler {
  ipcRenderer: {
    sendMessage(channel: string, ...args: unknown[]): void;
    on(channel: string, func: (...args: unknown[]) => void): (() => void) | undefined;
    once(channel: string, func: (...args: unknown[]) => void): void;
  };
  saveFile: (options: { defaultPath: string; content: string; overwrite?: boolean }) => Promise<string | null>;
  selectFile: () => Promise<{ path: string; name: string; content: string } | null>;
  selectDirectory: () => Promise<any | null>;
  openFile: (filePath: string) => Promise<{ path: string; name: string; content: string } | null>;
  openDirectory: (dirPath: string) => Promise<any>;
  getDirectoryContents: (dirPath: string) => Promise<any[]>;
  searchInFiles: (searchTerm: string, directoryPath?: string) => Promise<any[]>;
  createFileSystemItem: (options: { parentPath: string; name: string; type: 'file' | 'directory' }) => Promise<string | null>;
  deleteFileSystemItem: (options: { path: string; type: 'file' | 'directory' }) => Promise<{ success: boolean; path: string } | null>;
}

declare global {
  interface Window {
    electron: ElectronHandler;
  }
}

export {};
