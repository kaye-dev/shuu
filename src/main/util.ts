import { URL } from 'url';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import electronLog from 'electron-log';

const log = electronLog;

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.ELECTRON_RENDERER_PORT || 5173;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }

  // 本番環境では複数の可能性のあるパターンを試す
  const appPath = app.getAppPath();
  log.info(`アプリパス: ${appPath}`);

  // 様々なビルド環境に対応するためのパスパターン
  const possibleRendererPaths = [
    // パターン1: electron-builder.ymlのextraFilesで指定した標準的な場所
    path.join(path.dirname(appPath), 'renderer'),

    // パターン2: Resources直下
    path.join(process.resourcesPath, 'renderer'),

    // パターン3: app.asar内部
    path.join(appPath, 'out', 'renderer'),

    // パターン4: Resources/app内（asarなし構成）
    path.join(process.resourcesPath, 'app', 'out', 'renderer'),

    // パターン5: アプリのディレクトリ構造によっては、さらに上のディレクトリに配置される場合
    path.join(path.dirname(path.dirname(appPath)), 'renderer')
  ];

  // 存在するパスを見つける
  for (const rendererPath of possibleRendererPaths) {
    const fullPath = path.join(rendererPath, htmlFileName);
    try {
      // asarファイル内のパスもあるため、常に存在確認ができるとは限らないが
      // 通常のファイルシステムパスについては確認を試みる
      const exists = fs.existsSync(fullPath);
      log.info(`renderer検索: ${fullPath} - 存在: ${exists}`);

      if (exists) {
        log.info(`renderer検出成功: ${fullPath}`);
        return `file://${fullPath}`;
      }
    } catch (error) {
      log.warn(`パス確認エラー (無視して継続): ${fullPath}`);
    }
  }

  // 存在確認できなかった場合、デフォルトパス
  const resourcesPath = path.dirname(appPath);
  const rendererPath = path.join(resourcesPath, 'renderer');
  log.info(`レンダラーのデフォルトパス: ${rendererPath}`);

  return `file://${path.join(rendererPath, htmlFileName)}`;
}
