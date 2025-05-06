import { app } from 'electron';
import electronLog from 'electron-log';
import './main';

// ESModule形式でelectron-squirrel-startupをインポート
import electronSquirrelStartup from 'electron-squirrel-startup';

// アプリケーション全体のログを取得するための設定
const log = electronLog;
log.info('アプリケーション初期化: ' + new Date().toLocaleString());

// 本番環境でデバッグを行うための環境変数チェック
const isDebugProd = process.env.DEBUG_PROD === 'true';

if (isDebugProd) {
  log.info('本番環境デバッグモードが有効です');

  // アプリケーションに関する追加情報をログに記録
  log.info('アプリバージョン:', app.getVersion());
  log.info('Electronバージョン:', process.versions.electron);
  log.info('Chromeバージョン:', process.versions.chrome);
  log.info('Nodeバージョン:', process.versions.node);
  log.info('プラットフォーム:', process.platform);
  log.info('アーキテクチャ:', process.arch);
  log.info('実行パス:', app.getAppPath());
  log.info('ユーザーデータパス:', app.getPath('userData'));
  log.info('一時ファイルパス:', app.getPath('temp'));

  // 本番環境でのデバッグを有効にする
  import('electron-debug')
    .then((module) => {
      module.default({ showDevTools: true, devToolsMode: 'right' });
      log.info('electron-debugを本番環境で有効化しました');
    })
    .catch(err => {
      log.error('electron-debugのロードに失敗しました:', err);
    });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electronSquirrelStartup) {
  app.quit();
}

// グローバル例外ハンドラの登録
process.on('uncaughtException', (error) => {
  log.error('未処理の例外が発生しました:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('未処理のPromise rejectionが発生しました:', reason);
});

// This method is typically called when Electron is ready to initialize
// and is already handled in main.ts, so this file primarily serves as the entry point
