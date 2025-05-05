import { app } from 'electron';
import './main';

// ESModule形式でelectron-squirrel-startupをインポート
import electronSquirrelStartup from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electronSquirrelStartup) {
  app.quit();
}

// This method is typically called when Electron is ready to initialize
// and is already handled in main.ts, so this file primarily serves as the entry point
